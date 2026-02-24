import { useEffect, useState, useRef } from "react";
import dayjs from "dayjs";
import { exportInvoicesToPDF } from "../utils/exportPDF";
import { exportInvoicesToExcel } from "../utils/exportExcel";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/invoice.css";

function StatusDropdown({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "4px 8px",
        borderRadius: 4,
        border: "1px solid #ccc",
        background: "#fff",
        color: value === "paid" ? "#0891b2" : value === "due" ? "#b20808" : "#333",
        fontWeight: 500,
      }}
    >
      <option value="due">Due</option>
      <option value="paid">Paid</option>
    </select>
  );
}

function ActionDropdown({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "4px 8px",
        borderRadius: 4,
        border: "1px solid #ccc",
        background: "#fff",
        color: value === "verified" ? "green" : value === "pending" ? "orange" : "#333",
        fontWeight: 500,
      }}
    >
      <option value="pending">Pending</option>
      <option value="verified">Verified</option>
    </select>
  );
}

export default function Invoice() {
  const nav = useNavigate();
  const role = localStorage.getItem("role");

  const [myUnit, setMyUnit] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // create invoice state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTarget, setCreateTarget] = useState("specific");
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [unitsForProperty, setUnitsForProperty] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [createMonth, setCreateMonth] = useState("");
  const [createAmount, setCreateAmount] = useState("");
  const [createAmenities, setCreateAmenities] = useState([]);
  const updateCreateAmenity = (id, changes) => {
    setCreateAmenities(prev => {
      const idx = prev.findIndex(it => it.id === id);
      if (idx === -1) return prev;
      const next = prev.slice();
      const updated = { ...next[idx], ...changes };
      // avoid updating if nothing changed
      if (next[idx] === updated || (JSON.stringify(next[idx]) === JSON.stringify(updated))) return prev;
      next[idx] = updated;
      return next;
    });
  };
  const [createDescription, setCreateDescription] = useState("");
  const [createDueDate, setCreateDueDate] = useState("");

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [txnId, setTxnId] = useState("");
  const [paymentImg, setPaymentImg] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [propertyPaymentInfo, setPropertyPaymentInfo] = useState(null);
  const fileInputRef = useRef();

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterProperty, setFilterProperty] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterTenant, setFilterTenant] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // local action state
  const [localActions, setLocalActions] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (role === "owner") {
          const res = await api.get("/invoice/all-owner");
          setInvoices(res.data || []);
          setFilteredInvoices(res.data || []);
          try {
            const p = await api.get('/property/me');
            setProperties(p.data || []);
          } catch (e) {
            setProperties([]);
          }
        } else {
          const unitRes = await api.get("/unit/my-unit");
          setMyUnit(unitRes.data);
          if (unitRes.data?._id) {
            const invRes = await api.get(`/invoice/unit/${unitRes.data._id}`);
            setInvoices(invRes.data || []);
          }
          const payRes = await api.get("/payment-history/history");
          const allHistory = payRes.data.history || [];
          const unitId = unitRes.data?._id;
          if (unitId) setPaymentHistory(allHistory.filter(h => String(h.unit) === String(unitId)));
          else setPaymentHistory([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role]);

  // For tenants, poll invoices so owner-created invoices appear without a full refresh
  useEffect(() => {
    if (role !== 'tenant') return;
    let intervalId;
    const fetchTenantInvoices = async () => {
      try {
        const unitRes = await api.get('/unit/my-unit');
        const unit = unitRes.data;
        setMyUnit(unit);
        if (unit?._id) {
          const invRes = await api.get(`/invoice/unit/${unit._id}`);
          setInvoices(invRes.data || []);
        }
      } catch (e) {
        console.error('Failed to poll tenant invoices', e);
      }
    };
    // initial fetch
    fetchTenantInvoices();
    // poll every 10s
    intervalId = setInterval(fetchTenantInvoices, 10000);
    return () => clearInterval(intervalId);
  }, [role]);

  useEffect(() => {
    if (role !== "owner") return;
    let data = [...invoices];
    if (filterStatus) data = data.filter(inv => inv.status === filterStatus);
    if (filterAction) data = data.filter(inv => (inv.action || "pending") === filterAction);
    if (filterProperty) data = data.filter(inv => inv.propertyName === filterProperty);
    if (filterUnit) data = data.filter(inv => String(inv.unitNumber) === String(filterUnit));
    if (filterTenant) data = data.filter(inv => inv.tenantName && inv.tenantName.toLowerCase().includes(filterTenant.toLowerCase()));
    if (filterDate) data = data.filter(inv => inv.month && inv.month.startsWith(filterDate));
    setFilteredInvoices(data);
  }, [filterStatus, filterAction, filterProperty, filterUnit, filterTenant, filterDate, invoices, role]);

  useEffect(() => {
    if (role === 'owner') {
      const initial = {};
      invoices.forEach(inv => { initial[inv._id] = inv.action || 'pending'; });
      setLocalActions(initial);
    }
  }, [invoices, role]);

  const handleActionDropdownChange = (id, value) => setLocalActions(prev => ({ ...prev, [id]: value }));

  const handleActionUpdate = async (id) => {
    setActionLoading(id);
    try {
      const action = localActions[id];
      await api.put(`/invoice/${id}`, { action });
      setInvoices(prev => prev.map(inv => inv._id === id ? { ...inv, action } : inv));
    } catch (err) { console.error(err); } finally { setActionLoading(null); }
  };

  const handleStatusChange = async (id, status) => {
    setActionLoading(id);
    try {
      await api.put(`/invoice/${id}`, { status });
      setInvoices(prev => prev.map(inv => inv._id === id ? { ...inv, status } : inv));
    } catch (err) { console.error(err); } finally { setActionLoading(null); }
  };

  if (loading) return <div className="loading">Loading invoice...</div>;

  const renderSourceBadge = (inv) => {
    const origin = inv.origin;
    let text = 'Monthly';
    let bg = '#f1f5f9';
    let color = '#475569';
    if (origin === 'owner') { text = 'Owner'; bg = '#e0f2fe'; color = '#0369a1'; }
    else if (origin === 'tenant') { text = 'Owner copy'; bg = '#fff7ed'; color = '#b45309'; }
    return (
      <span style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 12, background: bg, color, fontWeight: 700, fontSize: 12 }}>{text}</span>
    );
  };

  const computeInvoiceAmount = (inv) => {
    const amenitiesTotal = (inv.amenities || []).reduce((sum, a) => sum + (Number(a.cost) || 0), 0);
    const amt = (typeof inv.amount !== 'undefined' && inv.amount !== null && String(inv.amount) !== '') ? Number(inv.amount) : (Number(inv.rent || 0) + amenitiesTotal);
    return { amt, amenitiesTotal };
  };

  const toUrl = (p) => {
    if (!p) return null;
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    if (p.startsWith('/')) return api.defaults.baseURL + p;
    return api.defaults.baseURL + '/' + p;
  };

  // Owner view
  if (role === 'owner') {
    const propertyOptions = Array.from(new Set(invoices.map(inv => inv.propertyName).filter(Boolean)));
    const unitOptions = Array.from(new Set(invoices.map(inv => inv.unitNumber).filter(Boolean)));
    const tenantOptions = Array.from(new Set(invoices.map(inv => inv.tenantName).filter(Boolean)));

    return (
      <div className="page-container" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div className="invoice-card" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001', padding: 32 }}>
          <h2 className="invoice-title" style={{ textAlign: 'center', color: '#0e7490', marginBottom: 28 }}>All Tenant Invoices</h2>

          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 18, justifyContent: 'center' }}>
            <input type="month" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #bae6fd' }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #bae6fd' }}>
              <option value="">Status (All)</option>
              <option value="due">Due</option>
              <option value="paid">Paid</option>
            </select>
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #bae6fd' }}>
              <option value="">Action (All)</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
            </select>
            <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #bae6fd' }}>
              <option value="">Property (All)</option>
              {propertyOptions.map(p => (<option key={p} value={p}>{p}</option>))}
            </select>
            <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #bae6fd' }}>
              <option value="">Unit (All)</option>
              {unitOptions.map(u => (<option key={u} value={u}>{u}</option>))}
            </select>
            <select value={filterTenant} onChange={e => setFilterTenant(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #bae6fd' }}>
              <option value="">Tenant (All)</option>
              {tenantOptions.map(t => (<option key={t} value={t}>{t}</option>))}
            </select>
            <button onClick={() => { setFilterDate(""); setFilterStatus(""); setFilterAction(""); setFilterProperty(""); setFilterUnit(""); setFilterTenant(""); }} style={{ padding: 6, borderRadius: 6, background: '#bae6fd', border: 'none', color: '#0369a1', fontWeight: 600 }}>Clear</button>
          </div>

          {/* Export + Create */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 18, justifyContent: 'center' }}>
            <button onClick={() => exportInvoicesToPDF(filteredInvoices)} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600 }}>Export PDF</button>
            <button onClick={() => exportInvoicesToExcel(filteredInvoices)} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600 }}>Export Excel</button>
            <button onClick={() => setShowCreateModal(true)} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600 }}>Create Invoice</button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16, background: '#fff' }}>
              <thead style={{ background: '#e0f2fe' }}>
                <tr>
                  <th style={{ padding: '12px 8px', fontWeight: 600, color: '#0369a1', borderBottom: '2px solid #bae6fd' }}>Tenant</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600, color: '#0369a1', borderBottom: '2px solid #bae6fd' }}>Unit</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600, color: '#0369a1', borderBottom: '2px solid #bae6fd' }}>Month</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600, color: '#0369a1', borderBottom: '2px solid #bae6fd' }}>Amount</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600, color: '#0369a1', borderBottom: '2px solid #bae6fd' }}>Status</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600, color: '#0369a1', borderBottom: '2px solid #bae6fd' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, idx) => (
                  <tr key={inv._id} style={{ background: idx % 2 === 0 ? '#f1f5f9' : '#fff', borderBottom: '1px solid #e0e0e0', cursor: 'pointer' }} onClick={() => setSelectedInvoice(inv)}>
                    <td style={{ padding: '10px 8px' }}>{inv.tenantName || "-"}</td>
                    <td style={{ padding: '10px 8px' }}>{inv.unitNumber || "-"}</td>
                    <td style={{ padding: '10px 8px' }}>{inv.month}{renderSourceBadge(inv)}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 500, color: '#0e7490' }}>
                      {(() => {
                        const { amt } = computeInvoiceAmount(inv);
                        return `₹${amt}`;
                      })()}
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: 12, background: inv.status === 'paid' ? '#bbf7d0' : '#fee2e2', color: inv.status === 'paid' ? '#166534' : '#b91c1c', fontWeight: 600, fontSize: 14 }}>
                        {inv.status === 'paid' ? 'Paid' : 'Due'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ padding: '4px 12px', borderRadius: 12, background: (inv.action || 'pending') === 'verified' ? '#bbf7d0' : '#fee2e2', color: (inv.action || 'pending') === 'verified' ? '#166534' : '#b91c1c', fontWeight: 600, fontSize: 14 }}>
                        {(inv.action || 'pending') === 'verified' ? 'Verified' : 'Pending'}
                      </span>
                      <select value={localActions[inv._id] || 'pending'} onChange={e => handleActionDropdownChange(inv._id, e.target.value)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', fontWeight: 500 }}>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                      </select>
                      <button style={{ padding: '4px 12px', borderRadius: 4, background: '#0e7490', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleActionUpdate(inv._id)} disabled={actionLoading === inv._id || (localActions[inv._id] === (inv.action || 'pending'))}>Update</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={() => nav("/dashboard")} style={{ marginTop: 24, background: '#0e7490', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 28px', fontWeight: 600, display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>Back to Dashboard</button>

          {selectedInvoice && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: 20, boxSizing: 'border-box' }}>
              <div style={{ background: '#fff', padding: 24, borderRadius: 12, minWidth: 320, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 32px rgba(0,0,0,0.18)', position: 'relative', animation: 'fadeIn 0.2s', boxSizing: 'border-box' }}>
                <button onClick={() => setSelectedInvoice(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', width: 26, height: 26, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, lineHeight: '20px', color: '#888', cursor: 'pointer' }} aria-label="Close">×</button>
                <h3 style={{ color: '#0e7490', marginBottom: 18 }}>Invoice Details</h3>
                <p><strong>Month:</strong> {selectedInvoice.month || selectedInvoice.month}</p>
                <p><strong>Tenant:</strong> {selectedInvoice.tenantName || selectedInvoice.unitNumber || '-'}</p>
                <p><strong>Amount:</strong> <span style={{ color: '#0e7490', fontWeight: 600 }}>₹{selectedInvoice.amount || selectedInvoice.rent || computeInvoiceAmount(selectedInvoice).amt}</span></p>
                <p><strong>Transaction ID:</strong> {selectedInvoice.txnId || '-'}</p>
                <p><strong>Status:</strong> <span style={{ color: selectedInvoice.status === 'paid' ? '#166534' : '#b91c1c', fontWeight: 600 }}>{selectedInvoice.status || 'due'}</span></p>
                {selectedInvoice.details && <p><strong>Details:</strong> {selectedInvoice.details}</p>}
                {selectedInvoice.screenshot && (
                  <div style={{ marginTop: 16 }}>
                    <strong>Screenshot:</strong><br />
                    <img src={toUrl(selectedInvoice.screenshot)} alt="Payment Screenshot" style={{ maxWidth: 220, maxHeight: 220, borderRadius: 6, border: '1px solid #e0e0e0', marginTop: 6 }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Create Invoice Modal (owner) */}
          {showCreateModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: 20, boxSizing: 'border-box' }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, width: 720, maxWidth: '98%', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>Create Invoice</h3>
                  <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', width: 26, height: 26, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer', color: '#666', fontWeight: 700 }} aria-label="Close">×</button>
                </div>

                <div style={{ display:'flex', gap:12, marginTop:12, flexWrap:'wrap', alignItems:'flex-end' }}>
                  <div style={{ minWidth:220 }}>
                    <label>Target</label>
                    <select value={createTarget} onChange={(e) => {
                      const v = e.target.value;
                      setCreateTarget(v);
                      if (v === 'all') { setSelectedProperty(''); setUnitsForProperty([]); setSelectedUnit(''); }
                    }} style={{ width:'100%', padding:8, borderRadius:6 }}>
                      <option value="specific">Specific Tenant (single unit)</option>
                      <option value="property">All Tenants in Property</option>
                      <option value="all">All Tenants (All my units)</option>
                    </select>
                  </div>

                  <div style={{ flex:1, minWidth:200 }}>
                    <label>Property</label>
                    <select disabled={createTarget === 'all'} value={selectedProperty} onChange={async (e) => {
                      setSelectedProperty(e.target.value);
                      setSelectedUnit('');
                      try { const ures = await api.get(`/unit/property/${e.target.value}`); setUnitsForProperty(ures.data || []); } catch (err) { setUnitsForProperty([]); }
                    }} style={{ width:'100%', padding:8, borderRadius:6 }}>
                      <option value="">Select property</option>
                      {properties.map(p => (<option key={p._id} value={p._id}>{p.name}</option>))}
                    </select>
                  </div>

                  <div style={{ flex:1, minWidth:180 }}>
                    <label>Unit</label>
                    <select disabled={createTarget !== 'specific'} value={selectedUnit} onChange={(e) => {
                      setSelectedUnit(e.target.value);
                      const unit = unitsForProperty.find(u => u._id === e.target.value);
                      if (unit) {
                        let amenitiesTotal = 0;
                        for (let i=1;i<=4;i++) { const cost = unit[`amenity${i}Expense`]; if (cost) amenitiesTotal += Number(cost); }
                        setCreateAmount(Number(unit.rent || 0) + amenitiesTotal);
                      } else setCreateAmount('');
                    }} style={{ width:'100%', padding:8, borderRadius:6 }}>
                      <option value="">Select unit</option>
                      {unitsForProperty.filter(u => u.tenant).map(u => (<option key={u._id} value={u._id}>{u.number} {u.tenant ? `— ${u.tenant.name}` : ''}</option>))}
                    </select>
                  </div>

                  <div style={{ minWidth:160 }}>
                    <label>Month</label>
                    <input type="month" value={createMonth} onChange={e => setCreateMonth(e.target.value)} style={{ padding:8, borderRadius:6 }} />
                  </div>

                  <div style={{ minWidth:140 }}>
                    <label>Amount (optional)</label>
                    <input type="number" value={createAmount} onChange={e => setCreateAmount(e.target.value)} style={{ padding:8, borderRadius:6 }} />
                  </div>
                </div>

                <div style={{ marginTop:12 }}>
                  <label>Amenities (optional)</label>
                  {createAmenities.map((a, idx) => (
                    <div key={a.id || idx} style={{ marginTop:6, borderRadius:6, padding:8, background:'#fafafa', boxSizing:'border-box' }}>
                      <div style={{ marginBottom: 6 }}>Amenity {idx + 1}</div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <input placeholder="Name" value={a.name} onChange={e => updateCreateAmenity(a.id, { name: e.target.value })} style={{ flex:2, minWidth:220, padding:8, borderRadius:6 }} />
                        <input placeholder="Cost" type="number" value={a.cost} onChange={e => updateCreateAmenity(a.id, { cost: e.target.value })} style={{ width:120, padding:8, borderRadius:6 }} />
                        <button onClick={() => setCreateAmenities(prev => prev.filter(it => it.id !== a.id))} style={{ background:'#ef4444', color:'#fff', border:'none', padding:'6px 8px', borderRadius:6, width:120 }}>Remove</button>
                      </div>
                      <div style={{ marginTop:8 }}>
                        <input placeholder="Amenity description (optional)" value={a.description || ''} onChange={e => updateCreateAmenity(a.id, { description: e.target.value })} style={{ width:'100%', padding:8, borderRadius:6, boxSizing:'border-box' }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop:8 }}>
                    <button onClick={() => setCreateAmenities(prev => ([...prev, { id: Date.now() + Math.random(), name:'', cost:'', description: '' }]))} style={{ background:'#0ea5e9', color:'#fff', border:'none', padding:'8px 12px', borderRadius:6 }}>Add Amenity</button>
                  </div>
                </div>
                  <div style={{ marginTop:12 }}>
                    <label>Invoice Description (optional)</label>
                    <textarea value={createDescription} onChange={e => setCreateDescription(e.target.value)} style={{ width:'100%', padding:8, borderRadius:6, minHeight:80, boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ marginTop:8 }}>
                  <label>Due Date (optional)</label>
                  <input type="date" value={createDueDate} onChange={e => setCreateDueDate(e.target.value)} style={{ padding:8, borderRadius:6 }} />
                </div>

                <div style={{ marginTop:8, color:'#555' }}>
                  {createTarget === 'property' && selectedProperty ? `${unitsForProperty.filter(u=>u.tenant).length} tenant-assigned unit(s) will receive invoices in this property.` : null}
                  {createTarget === 'all' ? 'Invoices will be generated for all tenant-assigned units you own.' : null}
                </div>

                <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:12 }}>
                  <button onClick={() => setShowCreateModal(false)} style={{ padding:'8px 14px', borderRadius:6 }}>Cancel</button>
                  <button onClick={async () => {
                    if (createTarget === 'specific' && !selectedUnit) return alert('Select unit for specific target');
                    if ((createTarget === 'property') && !selectedProperty) return alert('Select property');
                    if (!createMonth) return alert('Select month');
                    try {
                      // normalize amenities: ensure name is string and cost is number
                      const amenitiesToSend = createAmenities.length ? createAmenities.map(a => ({
                        name: String(a.name || ''),
                        cost: Number(a.cost) || 0,
                        description: String(a.description || '')
                      })) : undefined;
                      const payload = {
                        target: createTarget,
                        property: selectedProperty || undefined,
                        unit: selectedUnit || undefined,
                        month: createMonth,
                        amount: createAmount || undefined,
                        amenities: amenitiesToSend,
                        description: createDescription || undefined,
                        dueDate: createDueDate || undefined
                      };
                      console.log('Creating invoice payload:', payload, 'amenitiesToSend:', amenitiesToSend);
                      const res = await api.post('/invoice', payload);
                      // res may be single or array
                      const created = Array.isArray(res.data) ? res.data : [res.data];
                      setInvoices(prev => [...created, ...prev]);
                      setFilteredInvoices(prev => [...created, ...prev]);
                      setShowCreateModal(false);
                      setSelectedProperty(''); setUnitsForProperty([]); setSelectedUnit(''); setCreateMonth(''); setCreateAmount(''); setCreateAmenities([]); setCreateDescription(''); setCreateDueDate(''); setCreateTarget('specific');
                      alert('Invoice(s) created');
                    } catch (err) {
                      console.error('Create invoice error:', err?.response?.data || err);
                      const serverMsg = err.response?.data?.error || JSON.stringify(err.response?.data) || 'Failed to create invoice';
                      // Handle the common case where invoice already exists or unit has no tenant
                      if (String(serverMsg).toLowerCase().includes('invoice already exists') || String(serverMsg).toLowerCase().includes('unit has no tenant')) {
                        try {
                          if (createTarget === 'specific' && selectedUnit) {
                            const existingRes = await api.get(`/invoice/unit/${selectedUnit}`);
                            const match = (existingRes.data || []).find(i => i.month === createMonth);
                            if (match) {
                              // If tenant/unit details missing in invoice, fetch unit
                              let tenantName = match.tenantName;
                              let unitNumber = match.unitNumber;
                              let propertyName = match.propertyName || '';
                              if ((!tenantName || !unitNumber || !propertyName) && selectedUnit) {
                                try {
                                  const unitRes = await api.get(`/unit/${selectedUnit}`);
                                  const unitObj = unitRes.data;
                                  unitNumber = unitNumber || (unitObj?.number) || 'N/A';
                                  tenantName = tenantName || (unitObj?.tenant?.name) || 'N/A';
                                  propertyName = propertyName || (unitObj?.property?.name) || '';
                                } catch (ue) {
                                  console.error('Failed to fetch unit details', ue);
                                }
                              }
                              const details = `${match.month} — Tenant: ${tenantName || 'N/A'}${propertyName?`, Property: ${propertyName}`:''}, Unit: ${unitNumber || 'N/A'}, Amount: ₹${match.amount || match.rent || 0}`;
                              return alert(`Invoice already exists for ${details}`);
                            }
                          }
                        } catch (e) {
                          console.error('Failed to fetch existing invoice', e);
                        }
                        return alert(serverMsg);
                      }
                      alert(serverMsg);
                    }
                  }} style={{ padding:'8px 14px', background:'#0e7490', color:'#fff', border:'none', borderRadius:6 }}>Create</button>
                </div>
              </div>
            // </div>
          )}

        </div>
      </div>
    );
  }

  // Tenant view
  return (
    <div className="page-container" style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', color: '#0e7490', marginBottom: 28 }}>My Invoices</h2>
      {invoices.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#888' }}>No invoices available.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {invoices.map(inv => {
            const { amt: displayedAmount, amenitiesTotal } = computeInvoiceAmount(inv);
            const total = displayedAmount;
            return (
              <div key={inv._id} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px #0001', padding: 24, display: 'flex', flexDirection: 'column', gap: 8, borderLeft: inv.status === 'paid' ? '6px solid #22c55e' : '6px solid #f59e42', position: 'relative' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#0369a1', marginBottom: 2 }}>{inv.month}</div>
                  {renderSourceBadge(inv)}
                </div>
                <div style={{ fontSize: 15, color: '#64748b', marginBottom: 6 }}>Status: <span style={{ color: inv.status === 'paid' ? '#22c55e' : '#f59e42', fontWeight: 600 }}>{inv.status}</span></div>
                <div style={{ fontSize: 15, marginBottom: 2 }}>Amount: <b>₹{displayedAmount}</b></div>
                {inv.amenities && inv.amenities.length > 0 && (
                  <div style={{ fontSize: 15, marginBottom: 2 }}>
                    <div style={{ fontWeight: 500 }}>Amenities:</div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {inv.amenities.map((a, idx) => (<li key={idx}>{a.name}: ₹{a.cost}</li>))}
                    </ul>
                  </div>
                )}
                <div style={{ fontWeight: 600, fontSize: 16, marginTop: 4 }}>Total: <span style={{ color: '#0e7490' }}>₹{total}</span></div>
                <div style={{ fontSize: 15, marginTop: 2 }}>Verification: <span style={{ color: (inv.action || 'pending') === 'verified' ? '#22c55e' : '#f59e42', fontWeight: 600 }}>{(inv.action || 'pending') === 'verified' ? 'Verified' : 'Pending'}</span></div>
                {inv.status === 'paid' ? (
                  <div style={{ marginTop: 10, color: '#22c55e', fontWeight: 700, fontSize: 15 }}>Paid</div>
                ) : (
                  <button style={{ marginTop: 12, background: '#0e7490', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 28px', fontWeight: 600, fontSize: 15, cursor: 'pointer', alignSelf: 'flex-end' }} onClick={async () => {
                    setPayingInvoice(inv);
                    try {
                      // try to fetch property payment info from unit or myUnit
                      let propertyId = null;
                      if (myUnit && myUnit.property) propertyId = typeof myUnit.property === 'string' ? myUnit.property : myUnit.property._id;
                      // fallback: try to fetch unit details from invoice.unit
                      if (!propertyId && inv && inv.unit) {
                        try {
                          const ures = await api.get(`/unit/${inv.unit}`);
                          propertyId = ures.data?.property?._id || ures.data?.property;
                        } catch (e) { /* ignore */ }
                      }
                      if (propertyId) {
                        try {
                          const pres = await api.get(`/property/${propertyId}`);
                          setPropertyPaymentInfo(pres.data || null);
                        } catch (e) {
                          setPropertyPaymentInfo(null);
                        }
                      } else setPropertyPaymentInfo(null);
                    } catch (e) { console.error(e); setPropertyPaymentInfo(null); }
                    setShowPayModal(true);
                  }}>Pay Now</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button onClick={() => nav("/dashboard")} style={{ marginTop: 32, background: '#0e7490', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 28px', fontWeight: 600, display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>Back to Dashboard</button>

      {/* Payment Modal */}
      {showPayModal && payingInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: 20, boxSizing: 'border-box' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, maxWidth: 640, width: 'calc(100% - 40px)', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 4px 32px rgba(0,0,0,0.18)', position: 'relative', boxSizing: 'border-box' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h3 style={{ margin: 0, color: '#0e7490', fontSize: 22 }}>Pay Invoice</h3>
              
              <button onClick={() => { setShowPayModal(false); setTxnId(""); setPaymentImg(null); }} style={{ background: 'none', border: 'none', width: 26, height: 26, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer', color: '#888', fontWeight: 700 }} aria-label="Close">×</button>
              
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <b>Month:</b> {payingInvoice.month}<br />
              <b>Total:</b> <span style={{ color: '#0e7490', fontWeight: 600 }}>₹{computeInvoiceAmount(payingInvoice).amt}</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <b>Scan QR to Pay:</b><br />
              {propertyPaymentInfo?.paymentQr ? (
                (() => {
                  const p = propertyPaymentInfo.paymentQr;
                  const src = (p && (p.startsWith('http://') || p.startsWith('https://'))) ? p : (api.defaults.baseURL + (p || ''));
                  return <img src={src} alt="QR Code" style={{ width: 140, height: 140, margin: '8px 0', border: '1px solid #eee', borderRadius: 8 }} />;
                })()
              ) : (
                <img src="/public/qr-demo.png" alt="QR Code" style={{ width: 140, height: 140, margin: '8px 0', border: '1px solid #eee', borderRadius: 8 }} />
              )}
            </div>
            <div style={{ marginBottom: 10 }}>
              <b>Owner Bank Details:</b>
              <div style={{ fontSize: 15, marginTop: 2 }}>Verification: <span style={{ color: (payingInvoice.action || 'pending') === 'verified' ? '#22c55e' : '#f59e42', fontWeight: 600 }}>{(payingInvoice.action || 'pending') === 'verified' ? 'Verified' : 'Pending'}</span></div>
              <div style={{ marginTop: 6 }}>
                {propertyPaymentInfo?.paymentInfo ? (
                  <div style={{ fontSize: 14 }}>
                    {propertyPaymentInfo.paymentInfo.bankName && <div>Bank: {propertyPaymentInfo.paymentInfo.bankName}</div>}
                    {propertyPaymentInfo.paymentInfo.accountNumber && <div>Account: ****{String(propertyPaymentInfo.paymentInfo.accountNumber).slice(-4)}</div>}
                    {propertyPaymentInfo.paymentInfo.ifsc && <div>IFSC: {propertyPaymentInfo.paymentInfo.ifsc}</div>}
                    {propertyPaymentInfo.paymentInfo.upiId && <div>UPI: {propertyPaymentInfo.paymentInfo.upiId} <button onClick={() => { navigator.clipboard && navigator.clipboard.writeText(propertyPaymentInfo.paymentInfo.upiId); alert('UPI ID copied'); }} style={{ marginTop: 13, marginBotton: 23 }}>Copy</button></div>}
                  </div>
                ) : (
                  <div style={{ fontSize: 14, color: '#666' }}>No bank/UPI details provided by owner.</div>
                )}
              </div>
              <label htmlFor="txnId" style={{ fontWeight: 500 }}>Transaction ID / UTR:</label><br />
              <input id="txnId" type="text" value={txnId} onChange={e => setTxnId(e.target.value)} style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #ccc', marginTop: 2 }} placeholder="Enter transaction reference" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>Upload Payment Screenshot:</label><br />
              <input type="file" accept="image/*" ref={fileInputRef} onChange={e => setPaymentImg(e.target.files[0])} style={{ marginTop: 4 }} />
              {paymentImg && (<div style={{ marginTop: 6 }}><img src={URL.createObjectURL(paymentImg)} alt="Payment" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 6, border: '1px solid #eee' }} /></div>)}
            </div>
            <button style={{ background: '#0e7490', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 28px', fontWeight: 600, cursor: 'pointer', width: '100%' }} disabled={submitLoading || !txnId || !paymentImg} onClick={async () => {
              setSubmitLoading(true);
              try {
                const formData = new FormData();
                formData.append('status', 'paid');
                formData.append('txnId', txnId);
                if (paymentImg) formData.append('screenshot', paymentImg);
                await api.put(`/invoice/${payingInvoice._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                setInvoices(prev => prev.map(inv => inv._id === payingInvoice._id ? { ...inv, status: 'paid' } : inv));
                setFilteredInvoices(prev => prev.map(inv => inv._id === payingInvoice._id ? { ...inv, status: 'paid' } : inv));
                setShowPayModal(false); setTxnId(''); setPaymentImg(null);
                alert('Payment Done!');
              } catch (err) { alert('Failed to submit payment. Please try again.'); } finally { setSubmitLoading(false); }
            }}>{submitLoading ? 'Submitting...' : 'Submit Payment'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
