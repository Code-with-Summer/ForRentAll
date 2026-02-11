import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

export default function TenantDetails() {
  const { tenantId } = useParams();
  const [tenant, setTenant] = useState(null);
  const [unit, setUnit] = useState(null);
  const [tenantProfile, setTenantProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ address: '', emergencyContact: '', numberOfPersons: '', idProof: null, rentAgreement: null });
  const [property, setProperty] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = localStorage.getItem('role');

  useEffect(() => {
    async function fetchDetails() {
      try {
        // Get unit by tenant
        const unitRes = await api.get(`/unit/by-tenant/${tenantId}`);
        setUnit(unitRes.data);
        setProperty(unitRes.data.property);
        setTenant(unitRes.data.tenant);
        // Fetch tenant profile (address, emergencyContact, idProof, numberOfPersons, rentAgreement)
        try {
          const profileRes = await api.get(`/auth/profile/${tenantId}`);
          setTenantProfile(profileRes.data.profile || null);
          // If the /auth/profile returned a fuller user object (with profile_photo), prefer it
          if (profileRes.data.user) setTenant(profileRes.data.user);
        } catch (e) {
          setTenantProfile(null);
        }
        // Get invoices for unit
        const invRes = await api.get(`/invoice/unit/${unitRes.data._id}`);
        setInvoices(invRes.data);
      } catch (err) {
        setTenant(null);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [tenantId]);

  if (loading) return <div>Loading tenant details...</div>;
  if (!tenant) return <div>Tenant not found.</div>;

  return (
    <div className="tenant-details-page" style={{padding:'2rem'}}>
      <h2>Tenant Details</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {tenant?.profile_photo ? (
            <img src={`http://localhost:5000/${tenant.profile_photo}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ fontSize: 28, color: '#0e7490' }}>{tenant.name?.charAt(0)?.toUpperCase() || 'U'}</div>
          )}
        </div>
        <div>
          <p style={{ margin: 0 }}><strong>Name:</strong> {tenant.name}</p>
          <p style={{ margin: 0, color: '#6b7280' }}>{tenant.email}</p>
        </div>
      </div>
      {role === 'owner' && !editMode && (
        <div style={{ textAlign: 'right', marginBottom: 8 }}>
          <button onClick={() => {
            setForm({
              address: tenantProfile?.address || '',
              emergencyContact: tenantProfile?.emergencyContact || '',
              numberOfPersons: tenantProfile?.numberOfPersons ?? '',
              idProof: null,
              rentAgreement: null
            });
            setEditMode(true);
          }} style={{ padding: '6px 12px', borderRadius: 6, background: '#0891b2', color: '#fff', border: 'none' }}>Edit Tenant</button>
        </div>
      )}
      <p><strong>Address:</strong> {tenantProfile?.address || '-'}</p>
      <p><strong>Emergency Contact:</strong> {tenantProfile?.emergencyContact || '-'}</p>

      <p><strong>Number of persons:</strong> {tenantProfile?.numberOfPersons ?? '-'}</p>
      {!editMode ? (
        <>
          <p><strong>ID Proof:</strong> {tenantProfile?.idProof ? (<a href={`http://localhost:5000/${tenantProfile.idProof}`} target="_blank" rel="noreferrer">View</a>) : '-'}</p>
          <p><strong>Rent Agreement:</strong> {tenantProfile?.rentAgreement ? (<a href={`http://localhost:5000/${tenantProfile.rentAgreement}`} target="_blank" rel="noreferrer">View</a>) : '-'}</p>
        </>
      ) : (
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            const fd = new FormData();
            fd.append('address', form.address);
            fd.append('emergencyContact', form.emergencyContact);
            if (form.numberOfPersons !== '' && form.numberOfPersons !== null) fd.append('numberOfPersons', String(form.numberOfPersons));
            if (form.idProof) fd.append('idProof', form.idProof);
            if (form.rentAgreement) fd.append('rentAgreement', form.rentAgreement);
            await api.put(`/tenant-profile/${tenantId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            // refresh
            const profileRes = await api.get(`/auth/profile/${tenantId}`);
            setTenantProfile(profileRes.data.profile || null);
            if (profileRes.data.user) setTenant(profileRes.data.user);
            setEditMode(false);
          } catch (err) {
            alert('Failed to save tenant profile');
          }
        }}>
          <div className="form-group">
            <label className="profile-label">Address</label>
            <input name="address" value={form.address} onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">Emergency Contact</label>
            <input name="emergencyContact" value={form.emergencyContact} onChange={e => setForm(prev => ({ ...prev, emergencyContact: e.target.value }))} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">Number of persons</label>
            <input name="numberOfPersons" type="number" min={0} value={form.numberOfPersons} onChange={e => setForm(prev => ({ ...prev, numberOfPersons: e.target.value }))} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">ID Proof (PDF/Image)</label>
            <input name="idProof" type="file" accept="image/*,application/pdf" onChange={e => setForm(prev => ({ ...prev, idProof: e.target.files[0] }))} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">Rent Agreement (PDF/Image)</label>
            <input name="rentAgreement" type="file" accept="image/*,application/pdf" onChange={e => setForm(prev => ({ ...prev, rentAgreement: e.target.files[0] }))} className="profile-input" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" onClick={() => setEditMode(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}
      <p><strong>Property:</strong> {property?.name} ({property?.address})</p>
      <p><strong>Unit:</strong> {unit?.number}</p>
      <p><strong>Date Assigned:</strong> {unit?.tenantAddedDate ? new Date(unit.tenantAddedDate).toLocaleDateString() : 'N/A'}</p>
      <p><strong>No. of persons living with him:</strong> {unit?.numberOfPersons || 'N/A'}</p>
      <h3 style={{marginTop:'2rem'}}>Invoices</h3>
      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#f5f5f5'}}>
            <th style={{padding:'8px', border:'1px solid #ddd'}}>Month</th>
            <th style={{padding:'8px', border:'1px solid #ddd'}}>Amount</th>
            <th style={{padding:'8px', border:'1px solid #ddd'}}>Status</th>
            <th style={{padding:'8px', border:'1px solid #ddd'}}>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv._id}>
              <td>{inv.month} {inv.year}</td>
              <td>₹{inv.amount}</td>
              <td>{inv.status}</td>
              <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
