import React, { useEffect, useState } from "react";
import api from "../api";

export default function TenantProfile() {
  const [tenant, setTenant] = useState(null);
  const [profile, setProfile] = useState(null);
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    address: "",
    emergencyContact: "",
    idProof: ""
  });
  const [profileComplete, setProfileComplete] = useState(false);
  const [pwMode, setPwMode] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  const [oldPw, setOldPw] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const userId = localStorage.getItem("userId");

        const res = await api.get(`/auth/profile/${userId}`);
        setTenant(res.data.user);
        setProfile(res.data.profile);

        setForm({
          address: res.data.profile?.address || "",
          emergencyContact: res.data.profile?.emergencyContact || "",
          idProof: ""
        });

        const unitRes = await api.get("/unit/my-unit");
        setUnit(unitRes.data);

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

  if (loading) {
    return <div className="page-container">Loading profile...</div>;
  }

  if (!tenant) {
    return <div className="page-container">Profile not found.</div>;
  }

  return (
    <div className="page-container" style={{ maxWidth: 500, margin: "2rem auto", background: "#fff", borderRadius: 10, boxShadow: "0 2px 12px #0001", padding: 32 }}>
      <h1 style={{ textAlign: "center", marginBottom: 24 }}>My Profile</h1>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#e0e7ef", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, color: "#0891b2", overflow: "hidden", marginBottom: 8, position: 'relative' }}>
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
          <form onChange={handleProfilePhotoChange} style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <label htmlFor="profile-photo-upload" style={{ cursor: 'pointer', background: '#fff', borderRadius: '50%', padding: 4, boxShadow: '0 1px 4px #0002', border: '1px solid #ccc', fontSize: 18 }} title="Upload profile photo">
              <span role="img" aria-label="upload">📷</span>
              <input id="profile-photo-upload" type="file" accept="image/*" style={{ display: 'none' }} />
            </label>
          </form>
        </div>
        <div style={{ width: "100%", maxWidth: 340 }}>
          <div className="profile-row"><span className="profile-label">Full Name:</span> <span className="profile-value">{tenant.name}</span></div>
          <div className="profile-row"><span className="profile-label">Email:</span> <span className="profile-value">{tenant.email}</span></div>
          <div className="profile-row"><span className="profile-label">Phone:</span> <span className="profile-value">{tenant.phone || "-"}</span></div>
          <div className="profile-row"><span className="profile-label">Unit:</span> <span className="profile-value">{unit?.number || "-"}</span></div>
          <div className="profile-row"><span className="profile-label">Property:</span> <span className="profile-value">{unit?.property?.name ? `${unit.property.name} (${unit.property.address})` : "-"}</span></div>
        </div>
        <div style={{ width: "100%", maxWidth: 340, marginTop: 18 }}>
          {editMode ? (
            <form onSubmit={handleSave} style={{ width: "100%" }}>
              <div className="form-group">
                <label className="profile-label">Address</label>
                <input name="address" value={form.address} onChange={handleChange} required disabled={profileComplete} className="profile-input" />
              </div>
              <div className="form-group">
                <label className="profile-label">Emergency Contact</label>
                <input name="emergencyContact" value={form.emergencyContact} onChange={handleChange} required disabled={profileComplete} className="profile-input" />
              </div>
              <div className="form-group">
                <label className="profile-label">Number of persons living with you</label>
                <input name="numberOfPersons" type="number" min={0} value={form.numberOfPersons || ''} onChange={handleChange} disabled={profileComplete} className="profile-input" />
              </div>
              <div className="form-group">
                <label className="profile-label">ID Proof (PDF/Image)</label>
                <input name="idProof" type="file" accept="image/*,application/pdf" onChange={handleChange} disabled={profileComplete} className="profile-input" />
              </div>
              <div className="form-group">
                <label className="profile-label">Rent Agreement (PDF/Image)</label>
                <input name="rentAgreement" type="file" accept="image/*,application/pdf" onChange={handleChange} disabled={profileComplete} className="profile-input" />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <button type="submit" disabled={profileComplete} className="btn-primary">Save</button>
                <button type="button" onClick={handleCancel} className="btn-secondary">Cancel</button>
              </div>
              {saveMsg && <div style={{ marginTop: 8, color: saveMsg.includes("Fail") ? "#d32f2f" : "#059669" }}>{saveMsg}</div>}
            </form>
          ) : (
            <>
              <div className="profile-row"><span className="profile-label">Address:</span> <span className="profile-value">{profile?.address || "-"}</span></div>
              <div className="profile-row"><span className="profile-label">Number of persons living with you:</span> <span className="profile-value">{profile?.numberOfPersons ?? '-'}</span></div>
              <div className="profile-row"><span className="profile-label">Emergency Contact:</span> <span className="profile-value">{profile?.emergencyContact || "-"}</span></div>
              <div className="profile-row"><span className="profile-label">ID Proof of all:</span> <span className="profile-value">{profile?.idProof ? (<a href={`http://localhost:5000/${profile.idProof}`} target="_blank" rel="noopener noreferrer">View</a>) : "-"}</span></div>
              <div className="profile-row"><span className="profile-label">Rent Agreement:</span> <span className="profile-value">{profile?.rentAgreement ? (<a href={`http://localhost:5000/${profile.rentAgreement}`} target="_blank" rel="noopener noreferrer">View</a>) : "-"}</span></div>
              {!profileComplete && <button onClick={handleEdit} className="btn-primary" style={{ marginTop: 14 }}>Complete Profile</button>}
              {profileComplete && <div style={{ color: "#059669", marginTop: 8 }}>Profile complete and locked.</div>}
            </>
          )}
        </div>
        <div style={{ width: "100%", maxWidth: 340, marginTop: 24 }}>
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
