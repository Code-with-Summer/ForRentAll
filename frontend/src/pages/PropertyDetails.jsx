import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from '../api';

export default function PropertyDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [occupancyFilter, setOccupancyFilter] = useState('all');
  const [titleFilter, setTitleFilter] = useState('');
  const [showTenantModal, setShowTenantModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openUnit, setOpenUnit] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [pRes, uRes] = await Promise.all([
          api.get(`/property/${id}`),
          api.get(`/unit/property/${id}`)
        ]);
        setProperty(pRes.data);
        setUnits(uRes.data);
      } catch (err) {
        setProperty(null);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const fetchTenants = async () => {
    const res = await api.get('/unit/tenants');
    setTenants(res.data);
  };

  const openTenantModal = (unitId) => {
    fetchTenants();
    setShowTenantModal(unitId);
  };

  const assignTenant = async (unitId, tenantId) => {
    try {
      await api.put(`/unit/assign-tenant/${unitId}`, { tenant: tenantId });
      const uRes = await api.get(`/unit/property/${id}`);
      setUnits(uRes.data);
      setShowTenantModal(null);
    } catch (err) {
      alert('Failed to assign tenant');
    }
  };

  const removeTenant = async (unitId) => {
    try {
      await api.put(`/unit/assign-tenant/${unitId}`, { tenant: null });
      const uRes = await api.get(`/unit/property/${id}`);
      setUnits(uRes.data);
    } catch (err) {
      alert('Failed to remove tenant');
    }
  };

  const deleteProperty = async () => {
    if (!window.confirm("Are you sure you want to delete this property? All units will also be deleted.")) return;
    try {
      await api.delete(`/property/${id}`);
      nav('/dashboard');
    } catch (err) {
      alert('Failed to delete property');
    }
  };

  const deleteUnit = async (unitId) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return;
    try {
      await api.delete(`/unit/${unitId}`);
      const uRes = await api.get(`/unit/property/${id}`);
      setUnits(uRes.data);
    } catch (err) {
      alert('Failed to delete unit');
    }
  };

  if (loading) return <div className="loading">Loading property...</div>;
  if (!property) return <div className="page-container"><div className="error-msg">Property not found</div></div>;

  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");
  const isOwner = role === "owner" && userId && property.owner && String(property.owner._id || property.owner) === String(userId);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{property.name}</h1>
        <p className="page-subtitle">{property.address}</p>
        <div style={{marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)'}}>
          Owner: <span style={{color: 'var(--primary)', fontWeight: 500}}>{property.owner?.name || 'Unknown'}</span>
        </div>
      </div>
      {property.images && property.images.length > 0 && (
        <div style={{ margin: '1rem 0' }}>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>Property Photos:</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {property.images.map((img, idx) => (
              <img
                key={idx}
                src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                alt="Property"
                style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #ccc' }}
              />
            ))}
          </div>
        </div>
      )}

      {isOwner && (
        <div className="dashboard-actions">
          <button onClick={() => nav(`/property/${id}/unit/create`)}>+ Add Unit</button>
          <button onClick={() => nav(`/property/${id}/edit`)} className="btn-secondary">Edit Property</button>
          <button onClick={deleteProperty} className="btn-danger">Delete Property</button>
        </div>
      )}

      <div className="dashboard-section">
        <div className="section-header" style={{display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <h3 className="section-title">Units</h3>
            <span className="badge badge-neutral">{units.length} total</span>
            <span style={{color: '#64748b', fontSize: '0.9rem'}}>Showing: {occupancyFilter === 'all' ? 'All' : occupancyFilter === 'occupied' ? 'Occupied' : 'Vacant'}</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <div style={{ fontWeight: 600, color: '#334155', marginRight: 6 }}>Filter</div>
            <select value={occupancyFilter} onChange={e => setOccupancyFilter(e.target.value)} style={{padding: 6, borderRadius: 6, border: '1px solid #e2e8f0', minWidth: 200}}>
              <option value="all">All Units</option>
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
            </select>
            <button onClick={() => setOccupancyFilter('all')} style={{padding: '6px 10px', borderRadius: 6, background: '#e6f6ff', border: 'none', color: '#0369a1'}}>Clear</button>
          </div>
        </div>
        {units.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🚪</div>
            <p>No units in this property yet.</p>
            {isOwner && (
              <button onClick={() => nav(`/property/${id}/unit/create`)} style={{marginTop: '1rem'}}>
                + Add First Unit
              </button>
            )}
          </div>
        )}
        <div className="unit-grid">
          {units
            .filter(u => {
              if (occupancyFilter === 'all') return true;
              if (occupancyFilter === 'occupied') return !!u.tenant;
              if (occupancyFilter === 'vacant') return !u.tenant;
              return true;
            })
            .filter(u => {
              if (!titleFilter) return true;
              const tf = titleFilter.toString().toLowerCase();
              const num = u.number ? u.number.toString().toLowerCase() : '';
              const desc = u.description ? u.description.toLowerCase() : '';
              const tenantName = u.tenant?.name ? u.tenant.name.toLowerCase() : '';
              return num.includes(tf) || desc.includes(tf) || tenantName.includes(tf);
            })
            .map(u => (
            <div key={u._id} className="unit-card">
              <div className="unit-header">
                <span className="unit-number">Unit {u.number}</span>
                <button style={{marginLeft:8}} onClick={() => setOpenUnit(openUnit === u._id ? null : u._id)}>
                  {openUnit === u._id ? "Hide Details" : "View Details"}
                </button>
              </div>
              {openUnit === u._id && (
                <div className="unit-details-dropdown">
                  <div className="unit-details">
                    <div><strong>Rooms:</strong> {u.rooms}</div>
                    <div><strong>Halls:</strong> {u.halls}</div>
                    <div><strong>Bathrooms:</strong> {u.bathrooms}</div>
                    <div><strong>Balcony:</strong> {u.balcony}</div>
                    {u.mapLink && <div><strong>Map:</strong> <a href={u.mapLink} target="_blank" rel="noopener noreferrer">View Map</a></div>}
                    {u.description && <div><strong>Description:</strong> {u.description}</div>}
                  </div>
                  {u.photos && u.photos.length > 0 && (
                    <div className="unit-images" style={{marginTop:'0.5rem'}}>
                      <strong>Images:</strong>
                      <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                        {u.photos.map((img, idx) => (
                          <img key={idx} src={`http://localhost:5000/${img}`} alt="Unit" style={{width:80, height:80, objectFit:'cover', borderRadius:4}} />
                        ))}
                      </div>
                    </div>
                  )}
                  {(u.amenity1 || u.amenity2 || u.amenity3 || u.amenity4) && (
                    <div className="unit-info">
                      <strong>Amenities:</strong> {
                        [
                          u.amenity1 && `${u.amenity1}${u.amenity1Expense ? ` (₹${u.amenity1Expense})` : ''}`,
                          u.amenity2 && `${u.amenity2}${u.amenity2Expense ? ` (₹${u.amenity2Expense})` : ''}`,
                          u.amenity3 && `${u.amenity3}${u.amenity3Expense ? ` (₹${u.amenity3Expense})` : ''}`,
                          u.amenity4 && `${u.amenity4}${u.amenity4Expense ? ` (₹${u.amenity4Expense})` : ''}`
                        ].filter(Boolean).join(", ")
                      }
                    </div>
                  )}
                  <div className="unit-tenant">
                    {u.tenant ? (
                      <>
                        <span className="badge badge-success">Occupied</span>
                        <span style={{fontSize: '0.875rem'}}>{u.tenant.name}</span>
                      </>
                    ) : (
                      <span className="badge badge-neutral">Vacant</span>
                    )}
                  </div>
                  {isOwner && (
                    <div className="unit-actions">
                      <button onClick={() => nav(`/property/${id}/unit/${u._id}/edit`)} className="btn-secondary btn-sm">Edit</button>
                      <button onClick={() => deleteUnit(u._id)} className="btn-danger btn-sm">Delete</button>
                      {u.tenant ? (
                        <button onClick={() => removeTenant(u._id)} className="btn-secondary btn-sm">Remove Tenant</button>
                      ) : (
                        <button onClick={() => openTenantModal(u._id)} className="btn-sm">Assign Tenant</button>
                      )}
                    </div>
                  )}
                  {showTenantModal === u._id && (
                    <div className="modal-overlay" onClick={() => setShowTenantModal(null)}>
                      <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                          <h3 className="modal-title">Select Tenant</h3>
                          <button className="modal-close" onClick={() => setShowTenantModal(null)}>&times;</button>
                        </div>
                        {tenants.length === 0 && (
                          <div className="empty-state" style={{padding: '1rem'}}>
                            <p>No tenants available</p>
                          </div>
                        )}
                        {tenants.map(t => (
                          <div key={t._id} style={{
                            padding: '0.875rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <div style={{fontWeight: 500}}>{t.name}</div>
                              <div style={{fontSize: '0.8125rem', color: 'var(--text-muted)'}}>{t.email}</div>
                            </div>
                            <button onClick={() => assignTenant(u._id, t._id)} className="btn-sm">Select</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
