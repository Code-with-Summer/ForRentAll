import Maintenance from "./pages/Maintenance";
import AllTenants from "./pages/AllTenants";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { useEffect, useMemo, useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import CreateProperty from "./pages/CreateProperty";
import CreateUnit from "./pages/CreateUnit";
import PropertyDetails from "./pages/PropertyDetails";
import MyProperties from "./pages/MyProperties";
import AllProperties from "./pages/AllProperties";
import Invoice from "./pages/Invoice";
import EditProperty from "./pages/EditProperty";
import EditUnit from "./pages/EditUnit";
import UnitDetail from "./pages/UnitDetail";
import Navbar from "./components/Navbar";
import SiteFooter from "./components/SiteFooter";
import OwnerSidePanel from "./components/OwnerSidePanel";
import TenantSidePanel from "./components/TenantSidePanel";
import AdminPage from "./pages/AdminPage";
import OwnerDetail from "./pages/OwnerDetail";
import AdminCreateBlog from "./pages/AdminCreateBlog";
import AdminManageBlogs from "./pages/AdminManageBlogs";
import AdminEditBlog from "./pages/AdminEditBlog";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import PaymentHistory from "./pages/PaymentHistory";
import TenantProfile from "./pages/TenantProfile";
import EditProfile from "./pages/EditProfile";
import OwnerProfile from "./pages/OwnerProfile";
import TenantDetails from "./pages/TenantDetails";
import Ticket from "./pages/Ticket";
import OwnerSubscription from "./pages/OwnerSubscription";
import Contact from "./pages/Contact";
import About from "./pages/About";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LegalInfo from "./pages/LegalInfo";
import api from "./api";

function TenantProfileWrapper() {
  const name = localStorage.getItem("name");
  const email = localStorage.getItem("email");
  const phone = localStorage.getItem("phone");
  const unitNumber = localStorage.getItem("unitNumber");

  return <TenantProfile />;
}

function OwnerProfileWrapper() {
  const name = localStorage.getItem("name");
  const email = localStorage.getItem("email");
  const phone = localStorage.getItem("phone");

  return <OwnerProfile owner={{ name, email, phone }} />;
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [ownerBlocked, setOwnerBlocked] = useState(false);
  const [selfPurchaseAllowed, setSelfPurchaseAllowed] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");
  const role = localStorage.getItem("role");

  useEffect(() => {
    const checkOwnerStatus = async () => {
      if (role !== "owner") {
        setOwnerBlocked(false);
        return;
      }
      try {
        const res = await api.get("/subscription/my");
        const blocked = !res.data?.ownerActive || !res.data?.hasActivePackage;
        setOwnerBlocked(!!blocked);
        setSelfPurchaseAllowed(!!res.data?.selfPurchaseAllowed);
        setBlockedReason(res.data?.blockedReason || "");
      } catch (_err) {
        setOwnerBlocked(true);
        setSelfPurchaseAllowed(false);
        setBlockedReason("");
      }
    };
    checkOwnerStatus();
  }, [location.pathname, role]);

  const ownerAllowedWhenBlocked = useMemo(() => {
    const p = location.pathname;
    return (
      p === "/tenant-profile" ||
      p === "/edit-profile" ||
      p === "/blogs" ||
      p.startsWith("/blogs/") ||
      p === "/contact" ||
      p === "/about" ||
      p === "/tos" ||
      p === "/privacy" ||
      p === "/legal" ||
      p === "/owner/subscription"
    );
  }, [location.pathname]);

  const shouldShowOwnerBlockedMessage =
    role === "owner" && ownerBlocked && !ownerAllowedWhenBlocked;

  const showOwnerStickyPanel =
    role === "owner" &&
    !ownerBlocked &&
    location.pathname !== "/login" &&
    location.pathname !== "/register";

  const showTenantStickyPanel =
    role === "tenant" &&
    location.pathname !== "/login" &&
    location.pathname !== "/register";

  const routedContent = shouldShowOwnerBlockedMessage ? (
    <div className="page-container mobile-links-page">
      <div
        style={{
          border: "1px solid #dc2626",
          background: "#fef2f2",
          color: "#dc2626",
          borderRadius: 10,
          padding: "14px 16px",
          fontWeight: 600,
          textAlign: "center",
          margin: "0.5rem 0",
        }}
      >
        {blockedReason === "PAYMENT_PENDING"
          ? "Subscription payment is pending verification."
          : blockedReason === "ADMIN_CANCELLED_SUBSCRIPTION"
            ? "Subscription is cancelled by admin."
            : blockedReason === "PACKAGE_EXPIRED"
              ? "No active subscription found."
              : "Owner account is deactivated by admin."}
      </div>
      {selfPurchaseAllowed ? (
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button
            type="button"
            onClick={() => navigate("/owner/subscription")}
            style={{
              border: "1px solid #0e7490",
              background: "#ecfeff",
              color: "#0e7490",
              borderRadius: 8,
              padding: "8px 14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Go to Subscription
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center", marginTop: 10, color: "#b91c1c", fontWeight: 500 }}>
          Subscription is cancelled by admin. You cannot activate it yourself.
        </div>
      )}
    </div>
  ) : (
    <Routes>
      <Route path="/" element={<Properties />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/property/mine" element={<MyProperties />} />
      <Route path="/property/all" element={<AllProperties />} />
      <Route path="/property/create" element={<CreateProperty />} />
      <Route path="/property/:id" element={<PropertyDetails />} />
      <Route path="/property/:id/edit" element={<EditProperty />} />
      <Route path="/property/:id/unit/create" element={<CreateUnit />} />
      <Route path="/property/:id/unit/:unitId/edit" element={<EditUnit />} />
      <Route path="/unit/:unitId" element={<UnitDetail />} />

      <Route path="/invoice" element={<Invoice />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/owner/:ownerId" element={<OwnerDetail />} />
      <Route path="/admin/blogs" element={<AdminManageBlogs />} />
      <Route path="/admin/blogs/new" element={<AdminCreateBlog />} />
      <Route path="/admin/blogs/:id/edit" element={<AdminEditBlog />} />
      <Route path="/blogs" element={<Blogs />} />
      <Route path="/blogs/:id" element={<BlogDetail />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/about" element={<About />} />
      <Route path="/tos" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/legal" element={<LegalInfo />} />
      <Route path="/payment-history" element={<PaymentHistory />} />
      <Route path="/ticket" element={<Ticket />} />

      <Route path="/tenant-profile" element={<TenantProfileWrapper />} />
      <Route path="/owner-profile" element={<OwnerProfileWrapper />} />
      <Route path="/edit-profile" element={<EditProfile />} />

      <Route path="/tenant-details/:tenantId" element={<TenantDetails />} />
      <Route path="/all-tenants" element={<AllTenants />} />
      <Route path="/maintenance" element={<Maintenance />} />
      <Route path="/owner/subscription" element={<OwnerSubscription />} />
    </Routes>
  );

  return (
    <>
      <Navbar ownerBlocked={ownerBlocked} />
      {showOwnerStickyPanel ? (
        <div className="owner-layout-shell">
          <OwnerSidePanel />
          <div className="owner-layout-content">{routedContent}</div>
        </div>
      ) : showTenantStickyPanel ? (
        <div className="owner-layout-shell">
          <TenantSidePanel />
          <div className="owner-layout-content">{routedContent}</div>
        </div>
      ) : (
        routedContent
      )}
      <SiteFooter />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
