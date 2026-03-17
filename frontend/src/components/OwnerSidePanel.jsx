import { useLocation, useNavigate } from "react-router-dom";

const ownerLinks = [
  { key: "my-properties", label: "My Properties", path: "/property/mine", icon: "🏠" },
  { key: "add-property", label: "Add Property", path: "/property/create", icon: "➕" },
  { key: "tenants", label: "View Tenants", path: "/all-tenants", icon: "👥" },
  { key: "invoices", label: "Tenant Invoices", path: "/invoice", icon: "📄" },
  { key: "payments", label: "Payment History", path: "/payment-history", icon: "💳" },
  { key: "maintenance", label: "Maintenance", path: "/maintenance", icon: "🛠️" },
  { key: "subscription", label: "Subscription", path: "/owner/subscription", icon: "💠" },
];

function isActive(pathname, path) {
  if (path === "/dashboard") return pathname === "/dashboard";
  if (path === "/property/mine") return pathname === "/property/mine" || pathname.startsWith("/property/");
  return pathname === path;
}

export default function OwnerSidePanel() {
  const nav = useNavigate();
  const location = useLocation();

  return (
    <aside className="owner-sticky-panel" aria-label="Owner Navigation">

      <div className="owner-sticky-panel__links">
        {ownerLinks.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`owner-sticky-panel__link ${isActive(location.pathname, item.path) ? "active" : ""}`}
            onClick={() => nav(item.path)}
          >
            <span className="owner-sticky-panel__icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
