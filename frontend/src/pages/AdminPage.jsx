import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api";

const AdminPage = () => {
  const nav = useNavigate();
  const [owners, setOwners] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Restrict access to admin only
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      alert("Unauthorized route");
      nav("/login");
      return;
    }
    const fetchOwners = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get("/owner/all", {
          headers: { Authorization: token },
        });
        setOwners(res.data.owners);
      } catch (err) {
        setError("Failed to fetch owners");
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
  }, [success, nav]);

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle add owner
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(
        "/owner/add",
        { ...form },
        { headers: { Authorization: token } }
      );
      setSuccess("Owner added successfully");
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add owner");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("userId");
    window.location.href = "/login";
  };

  return (
    <div className="admin-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Admin Panel</h2>
      </div>
        <button onClick={handleLogout} style={{ padding: "6px 16px", background: "#d32f2f", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Logout</button>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <h3>Add Owner</h3>
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Owner"}
        </button>
        {error && <div style={{ color: "red" }}>{error}</div>}
        {success && <div style={{ color: "green" }}>{success}</div>}
      </form>
      <h3>All Owners</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {owners.map((owner) => (
              <tr key={owner._id}>
                <td>{owner.name}</td>
                <td>{owner.email}</td>
                <td>{owner._id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminPage;
