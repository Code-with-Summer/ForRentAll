import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function AllProperties(){
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await api.get("/property/all");
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">All Properties</h1>
        <p className="page-subtitle">Browse all properties in the system</p>
      </div>

      {!data.length ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏢</div>
          <p>No properties found</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Property</th>
                <th>Address</th>
                <th>Owner</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {data.map(p => (
                <tr 
                  key={p._id} 
                  onClick={() => nav(`/property/${p._id}`)}
                  style={{cursor:'pointer'}}
                >
                  <td style={{fontWeight:500, color:'var(--primary)'}}>{p.name}</td>
                  <td>{p.address}</td>
                  <td>{p.owner?.name || "-"}</td>
                  <td style={{color:'var(--text-muted)'}}>{p.owner?.email || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}