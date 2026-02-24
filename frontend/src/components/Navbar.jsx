import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const nav = useNavigate();
  const wrapperRef = useRef(null);

  const isLoggedIn = () => {
    const t = localStorage.getItem("token");
    return !!t && t !== "undefined" && t !== "null";
  };

  const avatarUrl = () => {
    // try common keys used in app; fall back to null
    return (
      localStorage.getItem("photo") || localStorage.getItem("avatar") || null
    );
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("userId");
    localStorage.removeItem("photo");
    setProfileOpen(false);
    setMenuOpen(false);
    nav("/");
    window.location.reload();
  };

  const handleNavigate = (path) => {
    nav(path);
    setMenuOpen(false);
    setProfileOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fr-navbar" ref={wrapperRef}>
      <div className="left">
        <button
          className={`fr-navbar__toggle ${menuOpen ? "open" : ""}`}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((s) => !s)}
        >
          <span className={`fr-navbar__hamburger ${menuOpen ? "open" : ""}`} />
        </button>

        <div className="fr-navbar__brand">ForRentAll</div>
      </div>

      <div className="right">
        <ul className={`fr-navbar__links ${menuOpen ? "open" : ""}`}>
          <li>
            <Link to="/blogs" onClick={() => handleNavigate("/blogs")}>
              Blog
            </Link>
          </li>
          <li>
            <Link to="/contact" onClick={() => handleNavigate("/contact")}>
              Contact Us
            </Link>
          </li>
          <li>
            <Link to="/about" onClick={() => handleNavigate("/about")}>
              About Us
            </Link>
          </li>
        </ul>

        <div className="fr-navbar__actions">
          {isLoggedIn() ? (
            <div className="fr-navbar__profile">
              <img
                src={avatarUrl() || "/public/default-avatar.png"}
                alt="profile"
                className="fr-navbar__avatar"
                onClick={() => setProfileOpen((s) => !s)}
              />

              <div
                className={`fr-navbar__profile-dropdown ${profileOpen ? "open" : ""}`}
              >
                <button onClick={() => handleNavigate("/tenant-profile")}>
                  My Profile
                </button>
                {localStorage.getItem('role') === 'admin' && (
                  <button onClick={() => handleNavigate('/admin/blogs')}>Manage Blogs</button>
                )}
                <button onClick={logout}>Logout</button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="fr-navbar__login"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
