import { useLocation, useNavigate } from "react-router-dom";

const tenantLinks = [
  { key: "invoices", label: "Invoices", path: "/invoice", icon: "📄" },
  { key: "payment-history", label: "Payment History", path: "/payment-history", icon: "💳" },
  { key: "ticket", label: "Tickets", path: "/ticket", icon: "📣" }
];

function isActive(pathname, path) {
  return pathname === path;
}

export default function TenantSidePanel() {
  const nav = useNavigate();
  const location = useLocation();

  return (
    <aside className="owner-sticky-panel" aria-label="Tenant Navigation">
      <div className="owner-sticky-panel__links">
        {tenantLinks.map((item) => (
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
