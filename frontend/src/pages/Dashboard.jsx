import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import "../styles/dashboard.css";
import { useMemo } from "react";

function DashboardPaymentHistory({ role, unitId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/payment-history/history");
        const all = res.data.history || [];
        if (role === "owner") setHistory(all);
        else if (unitId) setHistory(all.filter(h => String(h.unit) === String(unitId)));
        else setHistory([]);
      } catch (err) {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [role, unitId]);

  if (loading) return <div>Loading payment history...</div>;
  if (!history.length) return <div>No payment history found.</div>;

  return (
    <div className="dash-section" style={{ marginTop: "2rem" }}>
      <h2>Payment History</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Date</th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Amount</th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>
              Transaction ID
            </th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>Status</th>
            <th style={{ padding: "8px", border: "1px solid #ddd" }}>
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          {history.map((item, idx) => (
            <tr
              key={idx}
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedInvoice(item)}
            >
              <td>{item.date}</td>
              <td>₹{item.amount}</td>
              <td>{item.txnId}</td>
              <td>{item.status}</td>
              <td>{item.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedInvoice && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            overflowY: 'auto',
            padding: 20,
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              minWidth: 320,
              maxWidth: 560,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
              position: 'relative',
              boxSizing: 'border-box'
            }}
          >
            <button onClick={() => setSelectedInvoice(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', width: 26, height: 26, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, lineHeight: '20px', cursor: 'pointer', color: '#888' }} aria-label="Close">×</button>
            <h3>Invoice Details</h3>
            <p>
              <strong>Date:</strong> {selectedInvoice.date}
            </p>
            <p>
              <strong>Amount:</strong> ₹{selectedInvoice.amount}
            </p>
            <p>
              <strong>Status:</strong> {selectedInvoice.status}
            </p>
            {selectedInvoice.txnId && (
              <p>
                <strong>Transaction ID:</strong> {selectedInvoice.txnId}
              </p>
            )}
            {selectedInvoice.details && (
              <p>
                <strong>Details:</strong> {selectedInvoice.details}
              </p>
            )}
            {selectedInvoice.screenshot && (
              <div style={{ marginTop: 12 }}>
                <strong>Screenshot:</strong>
                <br />
                <img
                  src={(selectedInvoice.screenshot && (selectedInvoice.screenshot.startsWith('http://') || selectedInvoice.screenshot.startsWith('https://')))
                    ? selectedInvoice.screenshot
                    : (selectedInvoice.screenshot ? api.defaults.baseURL + (selectedInvoice.screenshot.startsWith('/') ? selectedInvoice.screenshot : ('/' + selectedInvoice.screenshot)) : '')}
                  alt="Payment Screenshot"
                  style={{ maxWidth: 200, maxHeight: 200, borderRadius: 4 }}
                />
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const role = localStorage.getItem("role");
  const name = localStorage.getItem("name");
  const nav = useNavigate();

  const [propsList, setPropsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myUnit, setMyUnit] = useState(null);
  const [unitLoading, setUnitLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [ownerUser, setOwnerUser] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerEditMode, setOwnerEditMode] = useState(false);
  const [ownerForm, setOwnerForm] = useState({ name: "", phone: "", licenseNumber: "", documents: null, profile_photo: null });
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (role !== "owner") return;
      try {
        setLoading(true);
        const res = await api.get("/property/me");
        setPropsList(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [role]);

  useEffect(() => {
    // Fetch owner profile when owner opens profile tab
    const fetchOwnerProfile = async () => {
      if (role !== "owner" || activeTab !== "profile") return;
      try {
        setOwnerLoading(true);
        const userId = localStorage.getItem("userId");
        if (!userId) return;
        const res = await api.get(`/auth/profile/${userId}`);
        setOwnerUser(res.data.user || null);
        setOwnerProfile(res.data.profile || null);
        setOwnerForm({
          name: res.data.user?.name || "",
          phone: res.data.user?.phone || "",
          licenseNumber: res.data.profile?.licenseNumber || "",
          documents: null,
          profile_photo: null
        });
      } catch (err) {
        console.error(err);
        setOwnerUser(null);
        setOwnerProfile(null);
      } finally {
        setOwnerLoading(false);
      }
    };
    fetchOwnerProfile();
  }, [role, activeTab]);

  useEffect(() => {
    const fetchMyUnit = async () => {
      if (role !== "tenant") return;
      try {
        setUnitLoading(true);
        const res = await api.get("/unit/my-unit");
        setMyUnit(res.data);
        if (res.data && res.data._id) {
          const invRes = await api.get(`/invoice/unit/${res.data._id}`);
          setInvoices(invRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setUnitLoading(false);
      }
    };
    fetchMyUnit();
  }, [role]);

  const logout = () => {
    localStorage.clear();
    nav("/");
    window.location.reload();
  };

  const handleProfileIconClick = () => {
    if (role === "owner") {
      setActiveTab("profile");
      setSidebarOpen(false);
    } else {
      nav("/tenant-profile");
    }
  };

  const commonMenuItems = [
    { id: "overview", label: "Dashboard", icon: "📊" },
    { id: "payment-history", label: "Payment History", icon: "💳" },
  ];
  const ownerMenuItems = [
    { id: "profile", label: "My Profile", icon: "👤" },
    { id: "overview", label: "Dashboard", icon: "📊" },
    { id: "properties", label: "My Properties", icon: "🏠" },
    { id: "add", label: "Add Property", icon: "➕" },
    { id: "all-tenants", label: "View Tenants", icon: "👥" },
    { id: "invoice", label: "Tenant Invoices", icon: "📄" },
    { id: "payment-history", label: "Payment History", icon: "💳" },
    { id: "maintenance", label: "Maintenance", icon: "🛠️" },
  ];
  const tenantMenuItems = [
    { id: "profile", label: "My Profile", icon: "👤" },
    { id: "overview", label: "Dashboard", icon: "📊" },
    { id: "invoice", label: "Invoices", icon: "📄" },
    { id: "payment-history", label: "Payment History", icon: "💳" },
    { id: "raise-ticket", label: "Ticket", icon: "📣" },
  ];
  const menuItems = role === "owner" ? ownerMenuItems : tenantMenuItems;

  const handleMenuClick = (id) => {
    setSidebarOpen(false);
    if (id === "add") {
      nav("/property/create");
    } else if (id === "invoice") {
      nav("/invoice");
    } else if (id === "raise-ticket") {
      nav("/ticket");
    } else if (id === "properties") {
      nav("/property/mine");
    } else if (id === "payment-history") {
      nav("/payment-history");
    } else if (id === "all-tenants") {
      nav("/all-tenants");
    } else if (id === "profile") {
      if (role === "owner") setActiveTab("profile");
      else nav("/tenant-profile");
    }
      else if (id === "maintenance") {
        nav("/maintenance");
      } else {
      setActiveTab(id);
    }
  };

  return (
    <div className="dash-layout">
      {/* Mobile Header */}
      <header className="dash-mobile-header">
        <button
          className="dash-hamburger"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <span className="dash-mobile-title">ForRentAll</span>
        <div className="dash-mobile-avatar" onClick={handleProfileIconClick} style={{ cursor: 'pointer' }}>
          {name?.charAt(0)?.toUpperCase() || "U"}
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="dash-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="dash-sidebar-header">
          <div className="dash-avatar" onClick={handleProfileIconClick} style={{ cursor: 'pointer' }}>
            {name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="dash-user-info">
            <span className="dash-user-name">{name || "User"}</span>
            <span className="dash-user-role">{role || "Guest"}</span>
          </div>
        </div>

        <nav className="dash-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`dash-nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => handleMenuClick(item.id)}
            >
              <span className="dash-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="dash-sidebar-footer">
          <button className="dash-logout" onClick={logout}>
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        {/* <div className="dash-header">
          <div>
            <p className="dash-greeting">Welcome back,</p>
            <h1 className="dash-title">{name || "User"}</h1>
          </div>
        </div> */}

        {/* Owner View */}
        {role === "owner" && (
          <div className="dash-content">
            <div style={{ display: activeTab === 'profile' ? 'block' : 'none' }} className="dash-section">
              <h2>My Profile</h2>
              {ownerLoading ? (
                <p>Loading...</p>
              ) : ownerUser ? (
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 160 }}>
                    <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#e0e7ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#0891b2', overflow: 'hidden' }}>
                      {ownerUser?.profile_photo ? (
                        <img src={`http://localhost:5000/${ownerUser.profile_photo}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{ownerUser.name?.charAt(0)?.toUpperCase() || 'O'}</span>
                      )}
                    </div>
                    {ownerEditMode ? (
                      <div style={{ marginTop: 8 }}>
                        <input type="file" accept="image/*" onChange={e => setOwnerForm(prev => ({ ...prev, profile_photo: e.target.files[0] }))} />
                      </div>
                    ) : null}
                  </div>
                  <div style={{ flex: 1 }}>
                    {ownerEditMode ? (
                      <div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: 'block', fontWeight: 600 }}>Full Name</label>
                          <input value={ownerForm.name} onChange={e => setOwnerForm(prev => ({ ...prev, name: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: 'block', fontWeight: 600 }}>Phone</label>
                          <input value={ownerForm.phone} onChange={e => setOwnerForm(prev => ({ ...prev, phone: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: 'block', fontWeight: 600 }}>License Number</label>
                          <input value={ownerForm.licenseNumber} onChange={e => setOwnerForm(prev => ({ ...prev, licenseNumber: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: 'block', fontWeight: 600 }}>Documents (PDF/Image)</label>
                          <input type="file" accept="image/*,application/pdf" onChange={e => setOwnerForm(prev => ({ ...prev, documents: e.target.files[0] }))} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button onClick={async () => {
                            // submit form
                            try {
                              setOwnerLoading(true);
                              const userId = localStorage.getItem('userId');
                              const fd = new FormData();
                              fd.append('name', ownerForm.name);
                              fd.append('phone', ownerForm.phone);
                              fd.append('licenseNumber', ownerForm.licenseNumber);
                              if (ownerForm.profile_photo) fd.append('profile_photo', ownerForm.profile_photo);
                              if (ownerForm.documents) fd.append('documents', ownerForm.documents);
                              const res = await api.put(`/owner/profile/${userId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                              setOwnerUser(res.data.user || null);
                              setOwnerProfile(res.data.profile || null);
                              setOwnerEditMode(false);
                              // update localStorage name/phone
                              if (res.data.user?.name) localStorage.setItem('name', res.data.user.name);
                              if (res.data.user?.phone) localStorage.setItem('phone', res.data.user.phone);
                            } catch (err) {
                              alert('Failed to save profile');
                            } finally {
                              setOwnerLoading(false);
                            }
                          }} style={{ padding: '8px 12px', borderRadius: 6, background: '#059669', color: '#fff', border: 'none' }}>Save</button>
                          <button onClick={() => { setOwnerEditMode(false); setOwnerForm(prev => ({ ...prev, profile_photo: null, documents: null })); }} style={{ padding: '8px 12px', borderRadius: 6, background: '#ddd', color: '#111', border: 'none' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p><strong>Full Name:</strong> {ownerUser.name}</p>
                        <p><strong>Email:</strong> {ownerUser.email}</p>
                        <p><strong>Phone:</strong> {ownerUser.phone || '-'}</p>
                        <p><strong>License Number:</strong> {ownerProfile?.licenseNumber || '-'}</p>
                        {/* <p><strong>Verified:</strong> {ownerProfile?.verified ? 'Yes' : 'No'}</p> */}
                        <p><strong>Documents:</strong> {ownerProfile?.documents ? (<a href={`http://localhost:5000/${ownerProfile.documents}`} target="_blank" rel="noreferrer">View</a>) : '-'}</p>
                        <div style={{ marginTop: 12 }}>
                          <button onClick={() => setOwnerEditMode(true)} style={{ padding: '8px 12px', borderRadius: 6, background: '#0891b2', color: '#fff', border: 'none' }}>Edit Profile</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p>Owner profile not found.</p>
              )}
            </div>

            <div style={{ display: activeTab === 'profile' ? 'none' : 'block' }}>
            <div className="dash-stats">
              <div className="dash-stat-card">
                <span className="dash-stat-icon">🏠</span>
                <div>
                  <p className="dash-stat-value">{propsList.length}</p>
                  <p className="dash-stat-label">Properties</p>
                </div>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-icon">🚪</span>
                <div>
                  <p className="dash-stat-value">
                    {propsList.reduce(
                      (acc, p) => acc + (p.units?.length || 0),
                      0,
                    )}
                  </p>
                  <p className="dash-stat-label">Total Units</p>
                </div>
              </div>
            </div>

            <div className="dash-section">
              <div className="dash-section-header">
                <h2>Your Properties</h2>
              </div>

              {loading && <p className="dash-loading">Loading...</p>}

              {!loading && propsList.length === 0 && (
                <div className="dash-empty">
                  <p>No properties yet.</p>
                  <button onClick={() => nav("/property/create")}>
                    Create your first property
                  </button>
                </div>
              )}

              <div className="dash-grid">
                {!loading &&
                  propsList.map((p) => (
                    <div
                      key={p._id}
                      className="dash-card"
                      onClick={() => nav(`/property/${p._id}`)}
                    >
                      <h3>{p.name}</h3>
                      <p>{p.address}</p>
                      <div className="dash-card-footer">
                        <span>{p.units?.length || 0} units</span>
                        <span className="dash-card-arrow">→</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dash-section" style={{ marginTop: "2rem" }}>
              <h2>Quick Actions</h2>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'stretch', flexWrap: 'nowrap' }}>
                    <div className="dash-card" onClick={() => nav('/all-tenants')} style={{ cursor: 'pointer', flex: '0 0 23vw', width: '23vw', height: '25vh' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                    <div style={{ fontSize: 28 }}>👥</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>{propsList.reduce((acc, p) => acc + (p.units?.filter(u => u.tenant)?.length || 0), 0)}</div>
                      <div style={{ color: '#64748b' }}>Total Tenants</div>
                    </div>
                  </div>
                </div>

                    <div className="dash-card" onClick={() => nav('/invoice')} style={{ cursor: 'pointer', flex: '0 0 23vw', width: '23vw', height: '25vh' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                    <div style={{ fontSize: 28 }}>📄</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>Invoices</div>
                      <div style={{ color: '#64748b' }}>Manage invoices</div>
                    </div>
                  </div>
                </div>

                    <div className="dash-card" onClick={() => nav('/maintenance')} style={{ cursor: 'pointer', flex: '0 0 23vw', width: '23vw', height: '25vh' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                    <div style={{ fontSize: 28 }}>🛠️</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>Maintenance</div>
                      <div style={{ color: '#64748b' }}>View requests</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
            </div>
        )}
        {/* Tenant View */}
        {role !== "owner" && (
          <div className="dash-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <p className="dash-greeting">Welcome back,</p>
                <h1 className="dash-title">{name || 'Tenant'}</h1>
                <p style={{ color: '#64748b', marginTop: 6 }}>{myUnit ? `${myUnit.propertyName} • Unit ${myUnit.number || myUnit.unitNumber || ''}` : 'No unit assigned'}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => nav('/invoice')} style={{ padding: '8px 14px', borderRadius: 6, background: '#0891b2', color: '#fff', border: 'none' }}>View Invoices</button>
                <button onClick={() => nav('/payment-history')} style={{ padding: '8px 14px', borderRadius: 6, background: '#06b6d4', color: '#fff', border: 'none' }}>Payment History</button>
              </div>
            </div>

            <div className="dash-stats" style={{ marginTop: '1.2rem' }}>
              <div className="dash-stat-card">
                <span className="dash-stat-icon">📄</span>
                <div>
                  <p className="dash-stat-value">{invoices.length}</p>
                  <p className="dash-stat-label">Your Invoices</p>
                </div>
              </div>
              <div className="dash-stat-card">
                <span className="dash-stat-icon">💳</span>
                <div>
                  <p className="dash-stat-value">{invoices.filter(i=>i.status!=='paid').length}</p>
                  <p className="dash-stat-label">Pending Payments</p>
                </div>
              </div>
            </div>

            <div className="dash-section" style={{ marginTop: '1.6rem' }}>
              <h2>Upcoming / Recent Invoice</h2>
              {unitLoading ? (
                <p>Loading...</p>
              ) : invoices.length === 0 ? (
                <div className="dash-empty">No invoices found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {invoices.slice(0,3).map(inv => (
                    <div key={inv._id} className="dash-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{inv.month}</div>
                        <div style={{ color: '#64748b' }}>{inv.action === 'verified' ? 'Verified' : 'Pending Verification'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#0e7490' }}>₹{inv.rent || inv.amount}</div>
                        {inv.status !== 'paid' ? (
                          <button onClick={() => nav('/invoice')} style={{ marginTop: 6, padding: '6px 12px', borderRadius: 6, background: '#0e7490', color: '#fff', border: 'none' }}>Pay Now</button>
                        ) : (
                          <div style={{ marginTop: 6, color: '#16a34a', fontWeight: 700 }}>Paid</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DashboardPaymentHistory role={role} unitId={myUnit?._id} />
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
