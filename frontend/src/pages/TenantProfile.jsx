import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function TenantProfile() {
  const [tenant, setTenant] = useState(null);
  const [profile, setProfile] = useState(null);
  const [unit, setUnit] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    address: "",
    emergencyContact: "",
    idProof: ""
  });
  const [ownerForm, setOwnerForm] = useState({ licenseNumber: "", documents: "", verified: false });
  const [profileComplete, setProfileComplete] = useState(false);
  const [pwMode, setPwMode] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  const [oldPw, setOldPw] = useState("");
  const [adminPaymentInfo, setAdminPaymentInfo] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const userId = localStorage.getItem("userId");

        const res = await api.get(`/auth/profile/${userId}`);
        setTenant(res.data.user);
        setProfile(res.data.profile);

          // initialize owner/admin forms
          if (res.data.user?.role === "owner") {
            setOwnerForm({
              licenseNumber: res.data.profile?.licenseNumber || "",
              documents: res.data.profile?.documents || "",
              verified: !!res.data.profile?.verified
            });
          }
          // admin profile fields removed

        // Fetch admin payment info for admin role
        if (res.data.user?.role === "admin") {
          try {
            const paymentInfoRes = await api.get("/subscription/payment-info");
            setAdminPaymentInfo(paymentInfoRes.data?.paymentInfo || null);
          } catch (err) {
            console.warn("Failed to fetch admin payment info", err);
          }
        }

        setForm({
          address: res.data.profile?.address || "",
          emergencyContact: res.data.profile?.emergencyContact || "",
          idProof: "",
          phone: res.data.user?.phone || ''
        });

        if (res.data.user?.role === "tenant") {
          const unitRes = await api.get("/unit/my-unit");
          setUnit(unitRes.data);
        } else if (res.data.user?.role === "owner") {
          try {
            const propRes = await api.get("/property/me");
            setProperties(propRes.data || []);
          } catch (err) {
            console.warn("Failed to fetch owner properties", err);
            setProperties([]);
          }
        } else {
          // admin or other roles - no tenant unit
          setUnit(null);
        }

        setProfileComplete(
          !!res.data.profile?.address &&
          !!res.data.profile?.emergencyContact &&
          !!res.data.profile?.idProof
        );
      } catch (err) {
        console.error(err);
        setTenant(null);
        setProfile(null);
        setUnit(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const nav = useNavigate();
  const handleEdit = () => setEditMode(true);

  const handleCancel = () => {
    setEditMode(false);
    setSaveMsg("");
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveMsg("");

    try {
      const userId = localStorage.getItem("userId");
      const fd = new FormData();

      fd.append("address", form.address);
      fd.append("emergencyContact", form.emergencyContact);
      if (form.numberOfPersons !== undefined && form.numberOfPersons !== "") fd.append("numberOfPersons", String(form.numberOfPersons));
      if (form.idProof) fd.append("idProof", form.idProof);
      if (form.rentAgreement) fd.append("rentAgreement", form.rentAgreement);

      // update user's phone via user endpoint
      if (form.phone !== undefined) {
        await api.put(`/auth/user/${userId}`, { phone: form.phone });
      }

      await api.put(`/tenant-profile/${userId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setEditMode(false);
      setSaveMsg("Profile updated!");

      const res = await api.get(`/auth/profile/${userId}`);
      setProfile(res.data.profile);

      setProfileComplete(
        !!res.data.profile?.address &&
        !!res.data.profile?.emergencyContact &&
        !!res.data.profile?.idProof
      );
    } catch (err) {
      console.error(err);
      setSaveMsg("Failed to update profile");
    }
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    setPwMsg("");
    if (!oldPw) {
      setPwMsg("Please enter your old password");
      return;
    }
    if (pw !== pw2) {
      setPwMsg("Passwords do not match");
      return;
    }
    try {
      const userId = localStorage.getItem("userId");
      await api.put(`/auth/change-password/${userId}`, {
        oldPassword: oldPw,
        password: pw
      });
      setPwMsg("Password changed!");
      setOldPw("");
      setPw("");
      setPw2("");
      setPwMode(false);
    } catch (err) {
      setPwMsg(err?.response?.data?.error || "Failed to change password");
    }
  };

  const handleProfilePhotoChange = async (e) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;
    const userId = localStorage.getItem("userId");
    const fd = new FormData();
    fd.append("profile_photo", file);
    try {
      await api.put(`/profile-photo/${userId}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      // Refetch user
      const res = await api.get(`/auth/profile/${userId}`);
      setTenant(res.data.user);
    } catch (err) {
      alert("Failed to upload profile photo");
    }
  };

  const handleLockProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const res = await api.put(`/tenant/${userId}/lock`);
      setProfile(res.data.profile);
      setSaveMsg('Profile locked');
    } catch (err) {
      setSaveMsg(err?.response?.data?.error || 'Failed to lock profile');
    }
  };

  const handleOwnerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOwnerForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };


  const handleOwnerSave = async (e) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userId');
      const payload = { licenseNumber: ownerForm.licenseNumber, documents: ownerForm.documents };
      // only admin can set verified via form checkbox
      if (ownerForm.verified) payload.verified = ownerForm.verified;
      const res = await api.put(`/auth/owner-profile/${userId}`, payload);
      setProfile(res.data.profile);
      setEditMode(false);
      setSaveMsg('Owner profile updated');
    } catch (err) {
      console.error(err);
      setSaveMsg('Failed to update owner profile');
    }
  };

  // admin profile editing removed; admins edit base user fields on the Edit Profile page

  if (loading) {
    return <div className="page-container">Loading profile...</div>;
  }

  if (!tenant) {
    return <div className="page-container">Profile not found.</div>;
  }

  return (
    <div className="page-container profile-shell" style={{ maxWidth: 500, margin: "2rem auto", background: "#fff", borderRadius: 10, boxShadow: "0 2px 12px #0001", padding: 32 }}>
      <h1 style={{ textAlign: "center", marginBottom: 24 }}>My Profile</h1>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#e0e7ef", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, color: "#0891b2", overflow: "hidden", marginBottom: 8, position: 'relative', border: '1px solid #000' }}>
          {tenant?.profile_photo ? (
            <img
              src={`http://localhost:5000/${tenant.profile_photo}`}
              alt="Profile"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : profile?.photo ? (
            <img
              src={`http://localhost:5000/${profile.photo}`}
              alt="Profile"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span>{tenant.name?.charAt(0)?.toUpperCase() || "U"}</span>
          )}
          {!profile?.locked && (
            <form onChange={handleProfilePhotoChange} style={{ position: 'absolute', bottom: 0, right: 0 }}>
              <label htmlFor="profile-photo-upload" style={{ cursor: 'pointer', background: '#fff', borderRadius: '50%', padding: 4, boxShadow: '0 1px 4px #0002', border: '1px solid #ccc', fontSize: 18 }} title="Upload profile photo">
                <span role="img" aria-label="upload">📷</span>
                <input id="profile-photo-upload" type="file" accept="image/*" style={{ display: 'none' }} />
              </label>
            </form>
          )}
        </div>
        
          <div style={{ width: "100%", maxWidth: 340 }}>
            <div className="profile-row"><span className="profile-label">Full Name:</span> <span className="profile-value">{tenant.name}</span></div>
            <div className="profile-row"><span className="profile-label">Email:</span> <span className="profile-value">{tenant.email}</span></div>
            <div className="profile-row"><span className="profile-label">Phone:</span> <span className="profile-value">{tenant.phone || "-"}</span></div>

            {tenant.role === "tenant" && (
              <>
                <div className="profile-row"><span className="profile-label">Unit:</span> <span className="profile-value">{unit?.number || "-"}</span></div>
                <div className="profile-row"><span className="profile-label">Property:</span> <span className="profile-value">{unit?.property?.name ? `${unit.property.name} (${unit.property.address})` : "-"}</span></div>

                <div style={{ marginTop: 12 }}>
                  <div className="profile-row"><span className="profile-label">Address:</span> <span className="profile-value">{profile?.address || "-"}</span></div>
                  <div className="profile-row"><span className="profile-label">Number of persons living with you:</span> <span className="profile-value">{profile?.numberOfPersons ?? "-"}</span></div>
                  <div className="profile-row"><span className="profile-label">Emergency Contact:</span> <span className="profile-value">{profile?.emergencyContact || "-"}</span></div>
                  <div className="profile-row"><span className="profile-label">ID Proof of all:</span> <span className="profile-value">{profile?.idProof ? (<a href={`http://localhost:5000/${profile.idProof}`} target="_blank" rel="noopener noreferrer">View</a>) : "-"}</span></div>
                  <div className="profile-row"><span className="profile-label">Rent Agreement:</span> <span className="profile-value">{profile?.rentAgreement ? (<a href={`http://localhost:5000/${profile.rentAgreement}`} target="_blank" rel="noopener noreferrer">View</a>) : "-"}</span></div>
                </div>
                {/* Show one-time Complete Profile button for tenants when profile is incomplete */}
        {tenant?.role === 'tenant' && !profileComplete && !profile?.locked && !editMode && (
          <button className="btn-primary" style={{ marginBottom: 8 }} onClick={() => setEditMode(true)}>Complete Profile</button>
        )}
                {profile?.locked ? (
                  <div style={{ marginTop: 12, color: '#059669' }}>Profile locked</div>
                ) : null}

                {editMode && !profile?.locked && (
                  <form onSubmit={handleSave} style={{ marginTop: 12 }}>
                    <div className="form-group">
                      <label className="profile-label">Address</label>
                      <input name="address" value={form.address || ''} onChange={handleChange} className="profile-input" />
                    </div>
                    <div className="form-group">
                      <label className="profile-label">Number of persons living with you</label>
                      <input name="numberOfPersons" value={form.numberOfPersons || ''} onChange={handleChange} className="profile-input" />
                    </div>
                    <div className="form-group">
                      <label className="profile-label">Phone</label>
                      <input name="phone" value={form.phone || ''} onChange={handleChange} className="profile-input" />
                    </div>
                    <div className="form-group">
                      <label className="profile-label">Emergency Contact</label>
                      <input name="emergencyContact" value={form.emergencyContact || ''} onChange={handleChange} className="profile-input" />
                    </div>
                    <div className="form-group">
                      <label className="profile-label">ID Proof</label>
                      <input type="file" name="idProof" onChange={handleChange} className="profile-input" />
                    </div>
                    <div className="form-group">
                      <label className="profile-label">Rent Agreement</label>
                      <input type="file" name="rentAgreement" onChange={handleChange} className="profile-input" />
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:12 }}>
                      <button className="btn-primary" type="submit">Save</button>
                      <button type="button" className="btn-secondary" onClick={() => { setEditMode(false); setSaveMsg(''); }}>Cancel</button>
                    </div>
                  </form>
                )}

              </>
            )}

            {tenant.role === "owner" && (
              <div style={{ marginTop: 8 }}>
                <div className="profile-row"><span className="profile-label">Bank Name:</span> <span className="profile-value">{profile?.bankName || "-"}</span></div>
                <div className="profile-row"><span className="profile-label">Account Number:</span> <span className="profile-value">{profile?.accountNumber || "-"}</span></div>
                <div className="profile-row"><span className="profile-label">IFSC:</span> <span className="profile-value">{profile?.ifsc || "-"}</span></div>
                <div className="profile-row"><span className="profile-label">UPI ID:</span> <span className="profile-value">{profile?.upiId || "-"}</span></div>
                <div className="profile-row"><span className="profile-label">Payment QR:</span> <span className="profile-value">{profile?.paymentQr ? (<a href={`http://localhost:5000/${profile.paymentQr}`} target="_blank" rel="noopener noreferrer">View</a>) : "-"}</span></div>
                <div className="profile-label">Owned Properties</div>
                {properties.length ? (
                  <ul style={{ marginTop: 6 }}>
                    {properties.map(p => (
                      <li key={p._id}>{p.name} — {p.address}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="profile-row"><span className="profile-value">No properties found</span></div>
                )}
                <button onClick={() => nav('/edit-profile')} className="btn-primary" style={{ marginTop: 10 }}>Edit Owner Profile</button>
              </div>
            )}

            {tenant.role === "admin" && (
              <div style={{ marginTop: 8 }}>
                <h4 style={{ marginTop: 16, marginBottom: 12 }}>Bank Details</h4>
                <div className="profile-row"><span className="profile-label">Bank Name:</span> <span className="profile-value">{adminPaymentInfo?.bankName || "-"}</span></div>
                <div className="profile-row"><span className="profile-label">Account Number:</span> <span className="profile-value">{adminPaymentInfo?.accountNumber || "-"}</span></div>
                <div className="profile-row"><span className="profile-label">IFSC:</span> <span className="profile-value">{adminPaymentInfo?.ifsc || "-"}</span></div>
                <div className="profile-row"><span className="profile-label">UPI ID:</span> <span className="profile-value">{adminPaymentInfo?.upiId || "-"}</span></div>
                {adminPaymentInfo?.paymentQr && (
                  <div className="profile-row">
                    <span className="profile-label">Payment QR:</span> 
                    <span className="profile-value">
                      <a href={`http://localhost:5000/${adminPaymentInfo.paymentQr}`} target="_blank" rel="noopener noreferrer">View QR Code</a>
                    </span>
                  </div>
                )}
                <div style={{ marginTop: 16 }}>
                  <button onClick={() => nav('/edit-profile')} className="btn-primary" style={{ marginTop: 10 }}>Edit Profile</button>
                </div>
              </div>
            )}
          </div>
        <div style={{ width: "100%", maxWidth: 340, marginTop: 0 }}>
          {tenant.role === 'tenant' && profileComplete && (
            <div style={{ marginBottom: 10, color: '#008359', fontWeight: 600 }}>Profile locked !</div>
          )}
          <button onClick={() => setPwMode((p) => !p)} className="btn-secondary" style={{ width: "100%" }}>Change Password</button>
          {pwMode && (
            <form onSubmit={handlePwChange} style={{ width: "100%", marginTop: 12 }}>
              <div className="form-group">
                <label className="profile-label">Old Password</label>
                <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} required className="profile-input" />
              </div>
              <div className="form-group">
                <label className="profile-label">New Password</label>
                <input type="password" value={pw} onChange={e => setPw(e.target.value)} required className="profile-input" />
              </div>
              <div className="form-group">
                <label className="profile-label">Confirm Password</label>
                <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} required className="profile-input" />
              </div>
              <button type="submit" className="btn-primary" style={{ width: "100%" }}>Save Password</button>
              {pwMsg && <div style={{ marginTop: 8, color: pwMsg.includes("Fail") || pwMsg.includes("incorrect") ? "#d32f2f" : "#059669" }}>{pwMsg}</div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
