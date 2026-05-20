import { useEffect, useState } from "react";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebase";

import "./admin.css";

export default function AdminPanel() {
  const [customers, setCustomers] = useState<any[]>([]);

  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [codeCount, setCodeCount] = useState(10);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [password, setPassword] = useState("");

  // FETCH CUSTOMERS

  const fetchCustomers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "customers"));

      const list: any[] = [];

      querySnapshot.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...docSnap.data(),
        });
      });

      setCustomers(list);

      setFilteredCustomers(list);

      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchCustomers();
  }, [isLoggedIn]);

  // SEARCH

  useEffect(() => {
    const filtered = customers.filter(
      (customer) =>
        customer.name?.toLowerCase().includes(search.toLowerCase()) ||
        customer.mobile?.includes(search)
    );

    setFilteredCustomers(filtered);
  }, [search, customers]);

  // RESET

  const resetReward = async (mobile: string) => {
    try {
      const customerRef = doc(db, "customers", mobile);

      await updateDoc(customerRef, {
        stamps: 0,
        rewardUnlocked: false,
        rewardClaimed: false,
        selectedReward: "",
        claimStartTime: null,
      });

      fetchCustomers();

      alert("Reward reset successful");
    } catch (error) {
      console.log(error);
    }
  };

  // DELETE

  const deleteCustomer = async (mobile: string) => {
    const confirmDelete = window.confirm("Delete this customer?");

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "customers", mobile));

      fetchCustomers();

      alert("Customer deleted");
    } catch (error) {
      console.log(error);
    }
  };

  // EXPORT CSV

  const exportCSV = () => {
    const headers = ["Name", "Mobile", "Stamps", "Reward", "Status"];

    const rows = customers.map((customer) => [
      customer.name,

      customer.mobile,

      customer.stamps,

      customer.selectedReward || "-",

      customer.rewardClaimed
        ? "Claimed"
        : customer.rewardUnlocked
        ? "Unlocked"
        : "Collecting",
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv",
    });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "HM_Customers.csv";

    a.click();
  };

  // GENERATE CODES

  const generateCodes = async () => {
    try {
      const prefixes = ["HM", "DW", "FL", "PC"];

      for (let i = 0; i < codeCount; i++) {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

        const randomNumber = Math.floor(10000 + Math.random() * 90000);

        const code = `${prefix}${randomNumber}`;

        await setDoc(doc(db, "codes", code), {
          code,
          used: false,
          createdAt: Date.now(),
        });
      }

      alert(`${codeCount} codes generated successfully`);
    } catch (error) {
      console.log(error);

      alert("Failed to generate codes");
    }
  };

  // ANALYTICS

  const totalRewards = customers.filter((item) => item.rewardClaimed).length;

  // LOGIN

  const handleLogin = () => {
    if (password === process.env.REACT_APP_ADMIN_PASSWORD) {
      setIsLoggedIn(true);
    } else {
      alert("Wrong Password");
    }
  };

  // LOGIN PAGE

  if (!isLoggedIn) {
    return (
      <div className="loginPage">
        <div className="loginBox">
          <h1>HM Admin Login</h1>

          <input
            type="password"
            placeholder="Enter Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleLogin}>Login</button>
        </div>
      </div>
    );
  }

  // MAIN UI

  return (
    <div className="adminPage">
      {/* HEADER */}

      <div className="adminHeader">
        <h1>HM Admin Dashboard</h1>

        <p>Manage rewards, customers & analytics</p>
      </div>

      {/* ANALYTICS */}

      <div className="analyticsGrid">
        <div className="analyticsCard">
          <h2>{customers.length}</h2>

          <p>Total Customers</p>
        </div>

        <div className="analyticsCard">
          <h2>{totalRewards}</h2>

          <p>Rewards Claimed</p>
        </div>
      </div>

      {/* CODE GENERATOR */}

      <div className="generatorBox">
        <h3>Generate Reward Codes</h3>

        <input
          type="number"
          value={codeCount}
          onChange={(e) => setCodeCount(Number(e.target.value))}
        />

        <button className="generateBtn" onClick={generateCodes}>
          Generate Codes
        </button>
      </div>

      {/* EXPORT */}

      <button className="exportBtn" onClick={exportCSV}>
        Download CSV
      </button>

      {/* SEARCH */}

      <input
        type="text"
        placeholder="Search by name or mobile"
        className="searchInput"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* TABLE */}

      {loading ? (
        <h2 className="loadingText">Loading...</h2>
      ) : (
        <div className="tableWrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>

                <th>Mobile</th>

                <th>Stamps</th>

                <th>Reward</th>

                <th>Status</th>

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>

                  <td>{customer.mobile}</td>

                  <td>
                    {customer.stamps}
                    /4
                  </td>

                  <td>{customer.selectedReward || "-"}</td>

                  <td>
                    {customer.rewardClaimed
                      ? "Claimed"
                      : customer.rewardUnlocked
                      ? "Unlocked"
                      : "Collecting"}
                  </td>

                  <td>
                    <div className="btnGroup">
                      <button
                        className="resetBtn"
                        onClick={() => resetReward(customer.mobile)}
                      >
                        Reset
                      </button>

                      <button
                        className="deleteBtn"
                        onClick={() => deleteCustomer(customer.mobile)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
