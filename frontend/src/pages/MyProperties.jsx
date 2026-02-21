import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function MyProperties(){
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const [filter, setFilter] = useState("none");

  useEffect(() => {
    const fetch = async () => {
      try {
        setError(null);
        const res = await api.get("/property/me");
        setData(res.data);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  if (loading) return <div className="loading">Loading properties...</div>;
  if (error) return <div className="page-container"><div className="error-msg">{error}</div></div>;

  // Helper to determine vacant/occupied
  const filteredData = filter === "none" ? data : data.filter(p => {
    // If property has units, check if all units are vacant or some are occupied
    if (!p.units || !p.units.length) return filter === "vacant";
    const vacantUnits = p.units.filter(u => !u.tenant);
    if (filter === "vacant") return vacantUnits.length === p.units.length;
    if (filter === "occupied") return vacantUnits.length < p.units.length;
    return true;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Properties</h1>
        <p className="page-subtitle">Properties you own and manage</p>
        <div style={{marginTop: '1rem'}}>
          <label style={{marginRight: '8px'}}>Filter:</label>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="none">All</option>
            <option value="vacant">Vacant</option>
            <option value="occupied">Occupied</option>
          </select>
          {filter !== "none" && (
            <button style={{marginLeft: '12px'}} onClick={() => setFilter("none")}>Remove Filter</button>
          )}
        </div>
      </div>

      {!filteredData.length ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏠</div>
          <p>No properties found for this filter.</p>
          <button onClick={() => nav('/property/create')} style={{marginTop: '1rem'}}>
            + Create Property
          </button>
        </div>
      ) : (
        <div className="property-list">
          {filteredData.map(p => (
            <div 
              key={p._id} 
              className="property-card" 
              onClick={() => nav(`/property/${p._id}`)}
              style={{cursor:'pointer'}}
            >
              <div className="property-name">{p.name}</div>
              <div className="property-address">{p.address}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}