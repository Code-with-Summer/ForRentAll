import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import api from "../api";
import logoStrip from "../images/logo strip.jpeg";
import logoIcon from "../images/icon logo.jpeg";

export default function Navbar({ ownerBlocked = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const nav = useNavigate();
  const location = useLocation();
  const wrapperRef = useRef(null);

  const isLoggedIn = () => {
    const t = localStorage.getItem("token");
    return !!t && t !== "undefined" && t !== "null";
  };

  const avatarUrl = () => {
    // return currently cached avatar if set
    return localStorage.getItem("photo") || localStorage.getItem("avatar") || null;
  };

  const [avatar, setAvatar] = useState(avatarUrl());

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

  const role = localStorage.getItem("role");
  const isOwnerLoggedIn = isLoggedIn() && role === "owner";
  const isTenantLoggedIn = isLoggedIn() && role === "tenant";
  const showMobileLinksbar =
    isTenantLoggedIn || (isOwnerLoggedIn && !ownerBlocked && location.pathname !== "/dashboard");
  const ownerMobileLinks = useMemo(
    () => [
      { key: "properties", label: "My Properties", path: "/property/mine" },
      { key: "add", label: "Add Property", path: "/property/create" },
      { key: "tenants", label: "View Tenants", path: "/all-tenants" },
      { key: "invoices", label: "Tenant Invoices", path: "/invoice" },
      { key: "payments", label: "Payment History", path: "/payment-history" },
      { key: "maintenance", label: "Maintenance", path: "/maintenance" },
      { key: "subscription", label: "Subscription", path: "/owner/subscription" },
    ],
    [],
  );

  const tenantMobileLinks = useMemo(
    () => [
      { key: "invoices", label: "Invoices", path: "/invoice" },
      { key: "payments", label: "Payment History", path: "/payment-history" },
      { key: "ticket", label: "Ticket", path: "/ticket" },
    ],
    [],
  );

  const mobileLinks = role === "owner" ? ownerMobileLinks : tenantMobileLinks;

  const isMobileLinkActive = (path) => {
    if (path === "/property/mine") {
      return location.pathname === "/property/mine" || location.pathname.startsWith("/property/");
    }
    if (path === "/tenant-profile") {
      return location.pathname === "/tenant-profile" || location.pathname === "/edit-profile";
    }
    return location.pathname === path;
  };

  useEffect(() => {
    // fetch latest user/profile and derive avatar URL from DB
    async function fetchAvatar() {
      try {
        if (!isLoggedIn()) return;
        const userId = localStorage.getItem("userId");
        if (!userId) return;
        const res = await api.get(`/auth/profile/${userId}`);
        const p = res.data.user?.profile_photo;
        if (p) {
          // p may be a path like 'user-photo/<id>' or a filename in uploads
          const src = `http://localhost:5000/${p}`;
          setAvatar(src);
          localStorage.setItem("photo", src);
        }
      } catch (err) {
        // ignore
      }
    }
    
    // fetch subscription status for owners
    async function fetchSubscriptionStatus() {
      try {
        const role = localStorage.getItem("role");
        if (role !== "owner") return;
        setSubLoading(true);
        const res = await api.get("/subscription/my");
        setSubscriptionStatus(res.data);
      } catch (err) {
        // ignore - subscription status fetch failed
      } finally {
        setSubLoading(false);
      }
    }
    
    fetchAvatar();
    fetchSubscriptionStatus();
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
    <>
      <nav className="fr-navbar" ref={wrapperRef}>
        <div className="left">
          <button
            className={`fr-navbar__toggle ${menuOpen ? "open" : ""}`}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((s) => !s)}
          >
            <span className={`fr-navbar__hamburger ${menuOpen ? "open" : ""}`} />
          </button>

          <Link to="/" className="fr-navbar__brand">
            <img src={logoStrip} alt="RentForAll" className="fr-navbar__logo-strip" />
            <img src={logoIcon} alt="RentForAll" className="fr-navbar__logo-icon" />
          </Link>
        </div>

        <div className="right">
          <ul className={`fr-navbar__links ${menuOpen ? "open" : ""}`}>
            {isLoggedIn() && !(isOwnerLoggedIn && ownerBlocked) && (
              <li>
                <Link
                  className="nav-link-btn"
                  to={localStorage.getItem('role') === 'admin' ? '/admin' : '/dashboard'}
                  onClick={() => { setMenuOpen(false); setProfileOpen(false); }}
                >
                  Dashboard
                </Link>
              </li>
            )}
            <li>
              <Link className="nav-link-btn" to="/blogs" onClick={() => handleNavigate("/blogs")}>
                Blogs
              </Link>
            </li>
            <li>
              <Link to="/contact" className="nav-link-btn" onClick={() => handleNavigate("/contact")}>
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/about" className="nav-link-btn" onClick={() => handleNavigate("/about")}>
                About Us
              </Link>
            </li>
          </ul>

          <div className="fr-navbar__actions">
            {/* Subscription indicator for owners */}
            {isOwnerLoggedIn && (
              <div className="fr-navbar__subscription">
                {subLoading ? (
                  <span className="fr-navbar__sub-loading">Loading...</span>
                ) : subscriptionStatus?.hasActivePackage ? (
                  <Link 
                    to="/owner/subscription" 
                    className={`fr-navbar__sub-link ${subscriptionStatus?.expiryWarning ? 'expiring' : 'active'}`}
                    onClick={() => { setMenuOpen(false); setProfileOpen(false); }}
                  >
                    <span className="fr-navbar__sub-icon">💎</span>
                    <span className="fr-navbar__sub-label">
                      {subscriptionStatus.activeSubscription?.planName}
                      {subscriptionStatus?.expiryWarning && (
                        <span className="fr-navbar__sub-warning">
                          {' '}(Expiring in {subscriptionStatus.expiryWarning.daysLeft} days)
                        </span>
                      )}
                    </span>
                  </Link>
                ) : (
                  <Link 
                    to="/owner/subscription" 
                    className="fr-navbar__sub-btn"
                    onClick={() => { setMenuOpen(false); setProfileOpen(false); }}
                  >
                    Subscription
                  </Link>
                )}
              </div>
            )}
            {isLoggedIn() ? (
              <div className="fr-navbar__profile">
                <img
                  src={avatar || "/default-avatar.png"}
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

      {showMobileLinksbar && (
        <div className="dash-mobile-linksbar--global">
          {mobileLinks.map((item) => (
            <button
              key={item.key}
              className={`dash-mobile-link ${isMobileLinkActive(item.path) ? "active" : ""}`}
              onClick={() => handleNavigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
