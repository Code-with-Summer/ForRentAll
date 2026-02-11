import React, { useEffect, useState } from "react";
import api from "../api";

const PaymentHistory = () => {
  const [history, setHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filterTenant, setFilterTenant] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [tenantOptions, setTenantOptions] = useState([]);
  const role = localStorage.getItem("role");
  const myName = localStorage.getItem("name");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const role = localStorage.getItem("role");
        if (role === "owner") {
          const res = await api.get("/payment-history/history");
          const all = res.data.history || [];
          setAllHistory(all);
          setHistory(all);
          // load tenant options for owner
          try {
            const tenantsRes = await api.get("/unit/owner-tenants");
            const opts = (tenantsRes.data || []).map(t => ({ label: `Unit ${t.unit} — ${t.name}`, value: t.unitId || t._id || t.unit }));
            setTenantOptions(opts);
          } catch (e) {
            setTenantOptions([]);
          }
        } else {
          // Tenant: fetch unit and show only history for that unit
          const unitRes = await api.get("/unit/my-unit");
          const unitId = unitRes.data?._id;
          const res = await api.get("/payment-history/history");
          const all = res.data.history || [];
          const filteredByUnit = unitId ? all.filter(h => String(h.unit) === String(unitId)) : [];
          setAllHistory(filteredByUnit);
          setHistory(filteredByUnit);
        }
      } catch (err) {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);
  // Apply client-side filters (must be a hook call location consistent across renders)
  const filtered = React.useMemo(() => {
    let data = allHistory.slice();
    if (filterTenant) {
      data = data.filter(h => String(h.unit) === String(filterTenant));
    }
    if (filterDate) {
      data = data.filter(h => {
        const d = h.date ? new Date(h.date) : (h.createdAt ? new Date(h.createdAt) : null);
        if (!d || isNaN(d.getTime())) return false;
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return monthKey === filterDate;
      });
    }
    return data;
  }, [allHistory, filterTenant, filterDate]);

  const tenantMap = React.useMemo(() => {
    const m = {};
    tenantOptions.forEach(t => { m[String(t.value)] = t.label; });
    return m;
  }, [tenantOptions]);

  if (loading) return <div>Loading payment history...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 32, color: '#0e7490', letterSpacing: 1 }}>Payment History</h2>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
        {tenantOptions.length > 0 && (
          <select value={filterTenant} onChange={e => setFilterTenant(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #bae6fd' }}>
            <option value="">Tenant (All)</option>
            {tenantOptions.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
          </select>
        )}
        <input type="month" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #bae6fd' }} />
        <button onClick={() => { setFilterDate(""); setFilterTenant(""); }} style={{ padding: 8, borderRadius: 6, background: '#e0f2fe', border: 'none', color: '#0369a1', fontWeight: 600 }}>Clear Filters</button>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16, background: '#fff' }}>
          <thead style={{ background: '#e0f2fe' }}>
            <tr>
              <th style={{ padding: '12px 8px', fontWeight: 600, color: '#0369a1', borderBottom: '2px solid #bae6fd' }}>Date & Time</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, color: '#0369a1', borderBottom: '2px solid #bae6fd' }}>Tenant</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, color: '#0369a1', borderBottom: '2px solid #bae6fd' }}>Amount</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, color: '#0369a1', borderBottom: '2px solid #bae6fd' }}>Transaction ID</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, color: '#0369a1', borderBottom: '2px solid #bae6fd' }}>Status</th>
              <th style={{ padding: '12px 8px', fontWeight: 600, color: '#0369a1', borderBottom: '2px solid #bae6fd' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#666' }}>No payment history found.</td>
              </tr>
            ) : filtered.map((item, idx) => (
              <tr
                key={idx}
                style={{
                  cursor: 'pointer',
                  background: idx % 2 === 0 ? '#f1f5f9' : '#fff',
                  transition: 'background 0.2s',
                  borderBottom: '1px solid #e0e0e0'
                }}
                onClick={() => setSelectedInvoice(item)}
                onMouseOver={e => (e.currentTarget.style.background = '#bae6fd')}
                onMouseOut={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#f1f5f9' : '#fff')}
              >
                <td style={{ padding: '10px 8px' }}>{(() => {
                  const d = item.date ? new Date(item.date) : (item.createdAt ? new Date(item.createdAt) : null);
                  return d && !isNaN(d.getTime()) ? d.toLocaleString() : (item.date || '-');
                })()}</td>
                <td style={{ padding: '10px 8px' }}>{role === 'owner' ? (tenantMap[String(item.unit)] || item.tenantName || item.unit || '-') : (myName || item.tenantName || item.unit || '-')}</td>
                <td style={{ padding: '10px 8px', fontWeight: 500, color: '#0e7490' }}>₹{item.amount}</td>
                <td style={{ padding: '10px 8px' }}>{item.txnId}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 12,
                    background: item.status === 'paid' ? '#bbf7d0' : '#fee2e2',
                    color: item.status === 'paid' ? '#166534' : '#b91c1c',
                    fontWeight: 600,
                    fontSize: 14
                  }}>{item.status}</span>
                </td>
                <td style={{ padding: '10px 8px' }}>{item.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: 36,
            borderRadius: 12,
            minWidth: 340,
            maxWidth: 400,
            boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
            position: 'relative',
            animation: 'fadeIn 0.2s'
          }}>
            <button
              onClick={() => setSelectedInvoice(null)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                fontSize: 22,
                color: '#888',
                cursor: 'pointer',
                fontWeight: 700
              }}
              aria-label="Close"
            >×</button>
            <h3 style={{ color: '#0e7490', marginBottom: 18 }}>Invoice Details</h3>
            <p><strong>Date:</strong> {(() => {
              const d = selectedInvoice.date ? new Date(selectedInvoice.date) : (selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt) : null);
              return d && !isNaN(d.getTime()) ? d.toLocaleString() : (selectedInvoice.date || '-');
            })()}</p>
            <p><strong>Tenant:</strong> {(() => {
              const role = localStorage.getItem('role');
              const myName = localStorage.getItem('name');
              return role === 'owner'
                ? (tenantMap[String(selectedInvoice.unit)] || selectedInvoice.tenantName || selectedInvoice.unit || '-')
                : (myName || selectedInvoice.tenantName || selectedInvoice.unit || '-');
            })()}</p>
            <p><strong>Amount:</strong> <span style={{ color: '#0e7490', fontWeight: 600 }}>₹{selectedInvoice.amount}</span></p>
            <p><strong>Transaction ID:</strong> {selectedInvoice.txnId}</p>
            <p><strong>Status:</strong> <span style={{ color: selectedInvoice.status === 'paid' ? '#166534' : '#b91c1c', fontWeight: 600 }}>{selectedInvoice.status}</span></p>
            {selectedInvoice.details && <p><strong>Details:</strong> {selectedInvoice.details}</p>}
            {selectedInvoice.screenshot && (
              <div style={{ marginTop: 16 }}>
                <strong>Screenshot:</strong><br />
                <img src={selectedInvoice.screenshot} alt="Payment Screenshot" style={{ maxWidth: 220, maxHeight: 220, borderRadius: 6, border: '1px solid #e0e0e0', marginTop: 6 }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
