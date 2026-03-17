import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api";
import logoIcon from "../images/icon logo.jpeg";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "tenant" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/register", form);
      const { token, user } = response.data || {};
      if (token) localStorage.setItem("token", token);
      if (user?._id) localStorage.setItem("userId", user._id);
      if (user?.name) localStorage.setItem("name", user.name);
      if (user?.email) localStorage.setItem("email", user.email);
      if (user?.role) localStorage.setItem("role", user.role);
      navigate(user?.role === "owner" ? "/dashboard" : "/");
    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container auth-card auth-card--register">
      <div className="auth-logo-wrap">
        <img src={logoIcon} alt="RentForAll" className="auth-logo" />
      </div>
      <h1 className="auth-title">Create account</h1>
      <form onSubmit={onSubmit} className="auth-form">
        <input name="name" placeholder="Full name" value={form.name} onChange={onChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required />
        <select name="role" value={form.role} onChange={onChange}>
          <option value="tenant">Tenant</option>
          <option value="owner">Owner</option>
        </select>
        {error ? <div className="auth-error">{error}</div> : null}
        <button type="submit" disabled={loading}>{loading ? "Creating..." : "Register"}</button>
      </form>
      <p className="auth-footnote">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}