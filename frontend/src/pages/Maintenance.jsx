import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/dashboard.css";

export default function Maintenance() {
  const nav = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIdx, setOpenIdx] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const role = localStorage.getItem('role');
  const [ticketStatusUpdating, setTicketStatusUpdating] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch("/unit/maintenance/all", { credentials: 'include' });
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
    // fetch tickets raised by tenants
    async function fetchTickets() {
      try {
        const res = await api.get('/ticket');
        setTickets(res.data || []);
      } catch (err) {
        setTickets([]);
      } finally {
        setTicketsLoading(false);
      }
    }
    fetchTickets();
  }, []);

  const handleStatusChange = async (id, status) => {
    setStatusUpdating(id);
    await fetch(`/unit/maintenance/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    setRequests(reqs => reqs.map(r => r._id === id ? { ...r, status } : r));
    setStatusUpdating(null);
  };

  return (
    <div className="dash-section" style={{marginTop:'2rem'}}>
      <div className="dash-section-header">
        <h2>Maintenance</h2>
      </div>
      <div style={{padding:'1rem',background:'#f9fafb',borderRadius:'8px'}}>
        <p>View and manage maintenance requests/issues for your properties here.</p>
        {/* {loading ? <div>Loading...</div> : (
          <table style={{width:'100%',marginTop:'1.5rem',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#f5f5f5'}}>
                <th style={{padding:'8px',border:'1px solid #ddd'}}>Unit</th>
                <th style={{padding:'8px',border:'1px solid #ddd'}}>Tenant</th>
                <th style={{padding:'8px',border:'1px solid #ddd'}}>Issue</th>
                <th style={{padding:'8px',border:'1px solid #ddd'}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req, idx) => (
                <>
                  <tr key={req._id} style={{cursor:'pointer'}} onClick={()=>setOpenIdx(openIdx===idx?null:idx)}>
                    <td style={{padding:'8px',border:'1px solid #ddd'}}>{req.unit?.number}</td>
                    <td style={{padding:'8px',border:'1px solid #ddd'}}>{req.tenant?.name}</td>
                    <td style={{padding:'8px',border:'1px solid #ddd'}}>{req.heading || req.description?.slice(0,40) + (req.description?.length>40 ? '...' : '')}</td>
                    <td style={{padding:'8px',border:'1px solid #ddd'}}>
                      <select value={req.status} disabled={statusUpdating===req._id} onClick={e=>e.stopPropagation()} onChange={e=>handleStatusChange(req._id, e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                  {openIdx===idx && (
                    <tr>
                      <td colSpan={4} style={{background:'#fff',border:'1px solid #eee',borderRadius:'6px',padding:'10px',boxShadow:'0 2px 8px #0001'}}>
                        <div><b>Description:</b> {req.description}</div>
                        {req.image && (
                          <div style={{marginTop:'8px'}}>
                            <b>Image:</b><br/>
                            <img src={`http://localhost:5000/${req.image}`} alt="issue" style={{maxWidth:200,maxHeight:200,borderRadius:'4px'}} />
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )} */}
        <div style={{marginTop:24}}>
          <h3>Tenant Tickets</h3>
          {ticketsLoading ? <div>Loading tickets...</div> : (
            <div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                <label style={{ color: '#334155', fontWeight: 600 }}>Filter:</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: 6, borderRadius: 6 }}>
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <button onClick={() => setSortAsc(s => !s)} style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 6, background: '#e0f2fe', border: 'none' }}>
                  Sort by Date: {sortAsc ? 'Old → New' : 'New → Old'}
                </button>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse',marginTop:8}}>
              <thead>
                <tr style={{background:'#f5f5f5'}}>
                  <th style={{padding:'8px',border:'1px solid #ddd'}}>Subject</th>
                  <th style={{padding:'8px',border:'1px solid #ddd'}}>Tenant</th>
                  <th style={{padding:'8px',border:'1px solid #ddd'}}>Description</th>
                  <th style={{padding:'8px',border:'1px solid #ddd'}}>Status</th>
                  <th style={{padding:'8px',border:'1px solid #ddd'}}>Date Raised</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = tickets.filter(t => statusFilter === 'all' ? true : String(t.status) === String(statusFilter));
                  const sorted = filtered.sort((a, b) => {
                    const da = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const db = b.createdAt ? new Date(b.createdAt) : new Date(0);
                    return sortAsc ? da - db : db - da;
                  });
                  if (sorted.length === 0) return (<tr><td colSpan={5} style={{padding:12,textAlign:'center',color:'#666'}}>No tickets found.</td></tr>);
                  return sorted.map(t => (
                    <tr key={t._id}>
                      <td style={{padding:'8px',border:'1px solid #ddd'}}>{t.subject}</td>
                      <td style={{padding:'8px',border:'1px solid #ddd'}}>{t.tenant?.name || t.tenantName || '-'}</td>
                      <td style={{padding:'8px',border:'1px solid #ddd'}}>{t.description}</td>
                      <td style={{padding:'8px',border:'1px solid #ddd'}}>
                        {role === 'owner' ? (
                          <select value={t.status} disabled={ticketStatusUpdating===t._id} onChange={async (e) => {
                            const newStatus = e.target.value;
                            setTicketStatusUpdating(t._id);
                            try {
                              await api.put(`/ticket/${t._id}/status`, { status: newStatus });
                              setTickets(ts => ts.map(item => item._id === t._id ? { ...item, status: newStatus } : item));
                            } catch (err) {
                              alert('Failed to update ticket status');
                            } finally {
                              setTicketStatusUpdating(null);
                            }
                          }}>
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        ) : (
                          (t.status || '-')
                        )}
                      </td>
                      <td style={{padding:'8px',border:'1px solid #ddd'}}>{t.createdAt ? new Date(t.createdAt).toLocaleString() : '-'}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
