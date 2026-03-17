import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

export default function OwnerDetail() {
  const { ownerId } = useParams();
  const nav = useNavigate();
  const [owner, setOwner] = useState(null);
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingProperty, setUpdatingProperty] = useState("");
  const toFileUrl = (p) => {
    if (!p) return "";
    const value = String(p);
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    const base = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
    return `${base}/${value.startsWith("/") ? value.slice(1) : value}`;
  };

  const getProfilePhotoUrl = () => {
    const base = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
    if (owner?.profile_photo) {
      if (typeof owner.profile_photo === "string") return toFileUrl(owner.profile_photo);
    }
    if (owner?._id) return `${base}/user-photo/${owner._id}`;
    return "";
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      nav("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [ownerRes, profileRes, allPropsRes] = await Promise.all([
          api.get(`/owner/${ownerId}`),
          api.get(`/auth/profile/${ownerId}`),
          api.get("/property/all")
        ]);
        const ownerUser = ownerRes.data?.owner || profileRes.data?.user || null;
        setOwner(ownerUser);
        setProfile(profileRes.data?.profile || null);
        const allProps = allPropsRes.data || [];
        const ownerProps = allProps.filter((p) => {
          const oid = p?.owner?._id || p?.owner;
          return String(oid) === String(ownerId);
        });
        setProperties(ownerProps);
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load owner details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ownerId, nav]);

  if (loading) return <div className="page-container">Loading owner details...</div>;
  if (error) return <div className="page-container"><div className="error-msg">{error}</div></div>;
  if (!owner) return <div className="page-container"><div className="error-msg">Owner not found</div></div>;

  const togglePropertyStatus = async (property) => {
    try {
      setUpdatingProperty(property._id);
      const res = await api.put(`/subscription/admin/property/${property._id}/status`, {
        adminDeactivated: !property.adminDeactivated,
      });
      const updated = res.data?.property;
      setProperties((prev) => prev.map((p) => (p._id === property._id ? { ...p, ...updated } : p)));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update listing status");
    } finally {
      setUpdatingProperty("");
    }
  };

  return (
    <div className="admin-owner-detail page-container">
      <div className="admin-owner-detail-head">
        <h1>Owner Details</h1>
      </div>

      <div className="admin-owner-panels">
        <section className="admin-card">
          <h3>Account</h3>
          <div className="admin-detail-row">
            <span>Profile Photo:</span>
            {getProfilePhotoUrl() ? (
              <img
                src={getProfilePhotoUrl()}
                alt="Profile"
                style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              <strong>no profile photo</strong>
            )}
          </div>
          <div className="admin-detail-row"><span>Name:</span>{owner.name || "-"}</div>
          <div className="admin-detail-row"><span>Email:</span>{owner.email || "-"}</div>
          <div className="admin-detail-row"><span>Phone:</span>{owner.phone || "-"}</div>
          <div className="admin-detail-row"><span>Owner ID:</span> <code>{owner._id}</code></div>
        </section>

        <section className="admin-card">
          <h3>Profile</h3>
          <div className="admin-detail-row"><span>License Number:</span> {profile?.licenseNumber || "-"}</div>
          <div className="admin-detail-row"><span>Bank Name:</span> {profile?.bankName || "-"}</div>
          <div className="admin-detail-row"><span>Account Number:</span> {profile?.accountNumber || "-"}</div>
          <div className="admin-detail-row"><span>IFSC:</span> {profile?.ifsc || "-"}</div>
          <div className="admin-detail-row"><span>UPI ID:</span>{profile?.upiId || "-"}</div>
          <div className="admin-detail-row">
            <span>Documents:</span>
            {profile?.documents ? <a href={`http://localhost:5000/${profile.documents}`} target="_blank" rel="noreferrer">View</a> : <strong>-</strong>}
          </div>
          <div className="admin-detail-row">
            <span>Payment QR:</span>
            {profile?.paymentQr ? <a href={`http://localhost:5000/${profile.paymentQr}`} target="_blank" rel="noreferrer">View</a> : <strong>-</strong>}
          </div>
        </section>
      </div>

      <section className="admin-card">
        <h3>Properties ({properties.length})</h3>
        {!properties.length ? (
          <div style={{ color: "#6b7280" }}>No properties found for this owner.</div>
        ) : (
          <div className="admin-prop-grid">
            {properties.map((p) => (
              <div
                key={p._id}
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5 }}
                className="admin-prop-card"
              >
                <div className="admin-prop-label">Property Name</div>
                <div className="admin-prop-name">{p.name || "Untitled Property"}</div>
                <div className="admin-prop-label" style={{ marginTop: 8 }}>Property Location</div>
                <div className="admin-prop-addr">{p.address || "-"}</div>
                <div className="admin-prop-addr">{[p.area, p.city, p.state].filter(Boolean).join(", ") || "-"}</div>
                <div className="admin-prop-label" style={{ marginTop: 8 }}>
                  Status: {p.adminDeactivated ? "Inactive" : "Active"}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button type="button" className="btn-secondary" onClick={() => nav(`/property/${p._id}`)}>
                    View
                  </button>
                  <button
                    type="button"
                    className={p.adminDeactivated ? "btn-secondary" : "btn-danger"}
                    disabled={updatingProperty === p._id}
                    onClick={() => togglePropertyStatus(p)}
                  >
                    {updatingProperty === p._id
                      ? "Updating..."
                      : p.adminDeactivated
                        ? "Activate Listing"
                        : "Deactivate Listing"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
