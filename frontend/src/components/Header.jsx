import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

export default function Header(){
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const isLoggedIn = () => {
    const t = localStorage.getItem("token");
    return !!t && t !== "undefined" && t !== "null";
  };
  
  const role = localStorage.getItem("role");
  const name = localStorage.getItem("name");
  const displayName = name && name !== 'null' && name !== 'undefined' ? name : 'User';

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("userId");
    nav("/");
    window.location.reload();
  };

  const handleNavClick = (path) => {
    nav(path);
    setMenuOpen(false);
  };

  return (
    <div>
      <h1>Header</h1>
      <h1>Header</h1>
      <h1>Header</h1>
      <h1>Header</h1>
      <h1>Header</h1>
      <h1>Header</h1>
      <h1>Header</h1>
      <h1>Header</h1>
      <h1>Header</h1>
      <h1>Header</h1>
    </div>
  );
}