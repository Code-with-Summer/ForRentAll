import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("name", res.data.user.name);
      localStorage.setItem("userId", res.data.user._id);
      // Fetch profile after login
      const profileRes = await api.get(`/auth/profile/${res.data.user._id}`);
      localStorage.setItem("profile", JSON.stringify(profileRes.data.profile));
      if (res.data.user.role === "admin") {
        nav("/admin");
      } else {
        nav("/dashboard");
      }
      window.location.reload();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || err?.response?.data || err.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p className="subtitle">Sign in to manage your properties</p>

        <form onSubmit={submit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {error && <p className="error">{error}</p>}
        </form>

        <p className="footer">
          Don't have an account?
          <span onClick={() => nav("/register")}> Register</span>
        </p>
      </div>
    </div>
  );
}