import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api";
import logoIcon from "../images/icon logo.jpeg";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
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
      const response = await api.post("/auth/login", form);
      const { token, user } = response.data || {};
      if (token) localStorage.setItem("token", token);
      if (user?._id) localStorage.setItem("userId", user._id);
      if (user?.name) localStorage.setItem("name", user.name);
      if (user?.email) localStorage.setItem("email", user.email);
      if (user?.phone) localStorage.setItem("phone", user.phone || "");
      if (user?.role) localStorage.setItem("role", user.role);
      navigate(user?.role === "admin" ? "/admin" : user?.role === "owner" ? "/dashboard" : "/");
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container auth-card auth-card--login">
      <div className="auth-logo-wrap">
        <img src={logoIcon} alt="RentForAll" className="auth-logo" />
      </div>
      <h1 className="auth-title">Login</h1>
      <form onSubmit={onSubmit} className="auth-form">
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required />
        {error ? <div className="auth-error">{error}</div> : null}
        <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
      </form>
      <p className="auth-footnote">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}