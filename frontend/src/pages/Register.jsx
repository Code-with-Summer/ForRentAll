import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function Register() {
  const [form, setForm] = useState({ role: "owner" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      const res = await api.post("/auth/register", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("name", res.data.user.name);
      localStorage.setItem("userId", res.data.user._id);
      localStorage.setItem("email", res.data.user.email);
      localStorage.setItem("phone", res.data.user.phone || "");
      if (res.data.user.role === "tenant") {
        localStorage.setItem("unitNumber", res.data.user.unitNumber || "");
      }

      // Fetch profile after registration
      const profileRes = await api.get(`/auth/profile/${res.data.user._id}`);
      localStorage.setItem("profile", JSON.stringify(profileRes.data.profile));
      nav("/dashboard");
      window.location.reload();
    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        <h1>Create Account</h1>
        <p className="subtitle">Manage your properties smarter</p>

        <form onSubmit={submit}>
          <div className="input-group">
            <label>Full Name</label>
            <input
              placeholder="John Doe"
              value={form.name || ""}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email || ""}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create strong password"
              value={form.password || ""}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label>Role</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              <option value="owner">Property Owner</option>
              <option value="tenant">Tenant</option>
            </select>
          </div>

          <button disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>

          {error && <p className="error">{error}</p>}
        </form>

        <p className="footer">
          Already have an account?  
          <span onClick={() => nav("/login")}> Login</span>
        </p>

      </div>
    </div>
  );
}
