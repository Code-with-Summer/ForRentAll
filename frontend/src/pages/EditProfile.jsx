import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function EditProfile(){
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [userForm, setUserForm] = useState({ name: '', phone: '', address: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [paymentQrFile, setPaymentQrFile] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');
  const toAssetUrl = (p) => {
    if (!p) return '';
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    const base = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
    return `${base}/${p.startsWith('/') ? p.slice(1) : p}`;
  };

  useEffect(() => {
    async function fetch(){
      setLoading(true);
      try{
        const userId = localStorage.getItem('userId');
        const res = await api.get(`/auth/profile/${userId}`);
        setUser(res.data.user);
        setProfile(res.data.profile || {});
        const role = res.data.user?.role;
        // populate user fields editable on edit page
        setUserForm({ name: res.data.user?.name || '', phone: res.data.user?.phone || '', address: res.data.user?.address || '' });

        if(role === 'owner'){
          setForm({
            licenseNumber: res.data.profile?.licenseNumber || '',
            documents: res.data.profile?.documents || '',
            bankName: res.data.profile?.bankName || '',
            accountNumber: res.data.profile?.accountNumber || '',
            ifsc: res.data.profile?.ifsc || '',
            upiId: res.data.profile?.upiId || '',
            paymentQr: res.data.profile?.paymentQr || ''
          });
        } else if(role === 'admin'){
          setForm({
            bankName: res.data.profile?.bankName || '',
            accountNumber: res.data.profile?.accountNumber || '',
            ifsc: res.data.profile?.ifsc || '',
            upiId: res.data.profile?.upiId || '',
            paymentQr: res.data.profile?.paymentQr || ''
          });
        } else {
          // tenants are not allowed here
          nav('/tenant-profile');
        }
      }catch(err){
        console.error(err);
      }finally{
        setLoading(false);
      }
    }
    fetch();
  }, [nav]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const f = e.target.files?.[0];
    setPhotoFile(f || null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveMsg('');
    try{
      const userId = localStorage.getItem('userId');
      // update basic user fields (name, phone, address)
      await api.put(`/auth/user/${userId}`, { name: userForm.name, phone: userForm.phone, address: userForm.address });

      // upload profile photo if selected
      if(photoFile){
        const fd = new FormData();
        fd.append('profile_photo', photoFile);
        await api.put(`/profile-photo/${userId}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      if(user.role === 'owner'){
        const payload = new FormData();
        payload.append('licenseNumber', form.licenseNumber || '');
        payload.append('documents', form.documents || '');
        payload.append('bankName', form.bankName || '');
        payload.append('accountNumber', form.accountNumber || '');
        payload.append('ifsc', form.ifsc || '');
        payload.append('upiId', form.upiId || '');
        if (paymentQrFile) payload.append('paymentQr', paymentQrFile);
        await api.put(`/auth/owner-profile/${userId}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if(user.role === 'admin'){
        const payload = new FormData();
        payload.append('bankName', form.bankName || '');
        payload.append('accountNumber', form.accountNumber || '');
        payload.append('ifsc', form.ifsc || '');
        payload.append('upiId', form.upiId || '');
        if (paymentQrFile) payload.append('paymentQr', paymentQrFile);
        await api.put(`/auth/admin-profile/${userId}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setSaveMsg('Profile saved');
      setTimeout(()=> nav('/tenant-profile'), 800);
    }catch(err){
      console.error(err);
      setSaveMsg('Failed to save');
    }
  };

  if(loading) return <div className="page-container">Loading...</div>;
  if(!user) return <div className="page-container">Not found</div>;

  return (
    <div className="page-container" style={{ maxWidth:600, margin: '2rem auto', background:'#fff', padding:24, borderRadius:8 }}>
      <h2>Edit Profile</h2>
      {user.role === 'owner' && (
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="profile-label">Full name</label>
            <input name="name" value={userForm.name || ''} onChange={handleUserChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">Phone</label>
            <input name="phone" value={userForm.phone || ''} onChange={handleUserChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">Address</label>
            <input name="address" value={userForm.address || ''} onChange={handleUserChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">License Number</label>
            <input name="licenseNumber" value={form.licenseNumber || ''} onChange={handleChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">Documents (URL or path)</label>
            <input name="documents" value={form.documents || ''} onChange={handleChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">Bank Name</label>
            <input name="bankName" value={form.bankName || ''} onChange={handleChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">Account Number</label>
            <input name="accountNumber" value={form.accountNumber || ''} onChange={handleChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">IFSC</label>
            <input name="ifsc" value={form.ifsc || ''} onChange={handleChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">UPI ID</label>
            <input name="upiId" value={form.upiId || ''} onChange={handleChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">Payment QR</label>
            <input type="file" accept="image/*" onChange={e => setPaymentQrFile(e.target.files?.[0] || null)} className="profile-input" />
            {form.paymentQr && !paymentQrFile && (
              <div style={{ marginTop: 8 }}>
                <img src={toAssetUrl(form.paymentQr)} alt="Payment QR" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
            )}
            {paymentQrFile && (
              <div style={{ marginTop: 8 }}>
                <img src={URL.createObjectURL(paymentQrFile)} alt="Payment QR preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <button className="btn-primary" type="submit">Save</button>
            <button type="button" className="btn-secondary" onClick={() => nav('/tenant-profile')}>Cancel</button>
          </div>
          {saveMsg && <div style={{ marginTop:8 }}>{saveMsg}</div>}
        </form>
      )}

      {user.role === 'admin' && (
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="profile-label">Full name</label>
            <input name="name" value={userForm.name || ''} onChange={handleUserChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">Phone</label>
            <input name="phone" value={userForm.phone || ''} onChange={handleUserChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">Address</label>
            <input name="address" value={userForm.address || ''} onChange={handleUserChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">Profile Photo</label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">Bank Name</label>
            <input name="bankName" value={form.bankName || ''} onChange={handleChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">Account Number</label>
            <input name="accountNumber" value={form.accountNumber || ''} onChange={handleChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">IFSC</label>
            <input name="ifsc" value={form.ifsc || ''} onChange={handleChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">UPI ID</label>
            <input name="upiId" value={form.upiId || ''} onChange={handleChange} className="profile-input" />
          </div>
          <div className="form-group">
            <label className="profile-label">Payment QR</label>
            <input type="file" accept="image/*" onChange={e => setPaymentQrFile(e.target.files?.[0] || null)} className="profile-input" />
            {form.paymentQr && !paymentQrFile && (
              <div style={{ marginTop: 8 }}>
                <img src={toAssetUrl(form.paymentQr)} alt="Payment QR" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
            )}
            {paymentQrFile && (
              <div style={{ marginTop: 8 }}>
                <img src={URL.createObjectURL(paymentQrFile)} alt="Payment QR preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }} />
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <button className="btn-primary" type="submit">Save</button>
            <button type="button" className="btn-secondary" onClick={() => nav('/tenant-profile')}>Cancel</button>
          </div>
          {saveMsg && <div style={{ marginTop:8 }}>{saveMsg}</div>}
        </form>
      )}

    </div>
  );
}
