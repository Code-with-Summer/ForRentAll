import React from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

function OwnerTenantsSection() {
  const nav = useNavigate();
  const [tenants, setTenants] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [sortOrder, setSortOrder] = React.useState("desc");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    async function fetchTenants() {
      try {
        const res = await api.get("/unit/owner-tenants");
        setTenants(res.data);
      } catch (err) {
        setTenants([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTenants();
  }, []);

  // Filter and sort tenants
  const filteredTenants = tenants
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // If tenantAddedDate is available, sort by it, else fallback to name
      if (a.tenantAddedDate && b.tenantAddedDate) {
        return sortOrder === "asc"
          ? new Date(a.tenantAddedDate) - new Date(b.tenantAddedDate)
          : new Date(b.tenantAddedDate) - new Date(a.tenantAddedDate);
      }
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });

  return (
    <div className="page-container mobile-links-page">
      <h2>Tenants Assigned to Your Units</h2>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Filter</div>
        <div style={{ display: "flex", gap: 16, alignItems: 'center' }}>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ padding: 8, borderRadius: 4, border: "1px solid #d4a017", fontSize: 15, background: '#fff7ed', color: '#1f2937', fontWeight: 500, minWidth: 180 }}>
            <option value="desc">Date Descending</option>
            <option value="asc">Date Ascending</option>
          </select>
          <button
            onClick={() => { setSearch(""); setSortOrder("desc"); }}
            style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #d4a017', background: '#fff3cf', color: '#1f2937', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 1px 4px rgba(212,160,23,0.2)' }}
          >
            Clear Filter
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', background: '#d4a017', color: '#1f2937', borderRadius: '50%', width: 24, height: 24, textAlign: 'center', lineHeight: '24px', fontSize: 16 }}>
            🔍
          </span>
          Search Tenant
        </div>
        <div style={{ position: 'relative', width: 'min(420px, 100%)' }}>
          <input
            type="text"
            placeholder="Search by name"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 32px 10px 12px', borderRadius: 6, border: "1px solid #d4a017", width: '100%', fontSize: 15, boxShadow: '0 1px 4px rgba(212,160,23,0.2)' }}
          />
        </div>
      </div>
      {loading ? (
        <div>Loading tenants...</div>
      ) : filteredTenants.length === 0 ? (
        <div>No tenants found.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fff3cf" }}>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>Name</th>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>Email</th>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>Unit</th>
              <th style={{ padding: "8px", border: "1px solid #ddd" }}>Property</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.map((tenant, idx) => (
                  <tr key={tenant._id} style={{ cursor: "pointer" }} onClick={() => nav(`/tenant-details/${tenant._id}`)}>
                    <td>{tenant.name}</td>
                    <td>{tenant.email}</td>
                    <td>{tenant.unit}</td>
                    <td>{tenant.property}</td>
                  </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default OwnerTenantsSection;
