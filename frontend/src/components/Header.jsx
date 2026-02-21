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
    <header className="header">
      <Link to="/" className="header-brand">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="9" width="18" height="12" rx="2" fill="currentColor" fillOpacity="0.2"/>
          <path d="M3 9L12 3L21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="9" y="13" width="6" height="8" rx="1" fill="currentColor"/>
        </svg>
        <span>ForRentAll</span>
      </Link>


      <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
        {isLoggedIn() ? (
          <>
            <span className="header-greeting">Hello, {displayName}</span>
            <button 
              onClick={() => handleNavClick('/dashboard')} 
              className="header-btn header-btn-ghost"
            >
              Dashboard
            </button>
            <button 
              onClick={() => handleNavClick('/payment-history')} 
              className="header-btn header-btn-ghost"
            >
              Payment History
            </button>
            {role === 'owner' && (
              <button 
                onClick={() => handleNavClick('/property/mine')} 
                className="header-btn header-btn-ghost"
              >
                My Properties
              </button>
            )}
            {role === 'admin' && (
              <button 
                onClick={() => handleNavClick('/property/all')} 
                className="header-btn header-btn-ghost"
              >
                All Properties
              </button>
            )}
            {role === 'tenant' && (
              <>
                <button 
                  onClick={() => handleNavClick('/invoice')} 
                  className="header-btn header-btn-ghost"
                >
                  Invoice
                </button>
                <button 
                  onClick={() => handleNavClick('/ticket')} 
                  className="header-btn header-btn-ghost"
                >
                  Raise Ticket
                </button>
                <button 
                  onClick={() => handleNavClick('/tenant-profile')} 
                  className="header-btn header-btn-ghost"
                >
                  My Profile
                </button>
              </>
            )}
            {role === 'owner' && (
              <button 
                onClick={() => handleNavClick('/property/create')} 
                className="header-btn header-btn-primary"
              >
                + New Property
              </button>
            )}
            <button 
              onClick={logout} 
              className="header-btn header-btn-outline"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => handleNavClick('/')} 
              className="header-btn header-btn-ghost"
            >
              Home
            </button>
            <button 
              onClick={() => handleNavClick('/login')} 
              className="header-btn header-btn-ghost"
            >
              Sign In
            </button>
            <button 
              onClick={() => handleNavClick('/register')} 
              className="header-btn header-btn-primary"
            >
              Get Started
            </button>
          </>
        )}
      </nav>
    </header>
  );
}