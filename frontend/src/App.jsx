import Maintenance from "./pages/Maintenance";
import AllTenants from "./pages/AllTenants";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

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
import Header from "./components/Header";
import AdminPage from "./pages/AdminPage";
import PaymentHistory from "./pages/PaymentHistory";
import TenantProfile from "./pages/TenantProfile";
// import OwnerProfile from "./pages/OwnerProfile";
import TenantDetails from "./pages/TenantDetails";
import Ticket from "./pages/Ticket";
import ViewTickets from "./pages/ViewTickets";

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
  const hideHeaderRoutes = ["/dashboard", "/login", "/register"];
  const shouldHideHeader = hideHeaderRoutes.includes(location.pathname);

  return (
    <>
      {!shouldHideHeader && <Header />}

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

        <Route path="/invoice" element={<Invoice />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/payment-history" element={<PaymentHistory />} />
        <Route path="/ticket" element={<Ticket />} />
        <Route path="/view-tickets" element={<ViewTickets />} />

        <Route path="/tenant-profile" element={<TenantProfileWrapper />} />
        <Route path="/owner-profile" element={<OwnerProfileWrapper />} />

        <Route path="/tenant-details/:tenantId" element={<TenantDetails />} />
        <Route path="/all-tenants" element={<AllTenants />} />
        <Route path="/maintenance" element={<Maintenance />} />
      </Routes>
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
