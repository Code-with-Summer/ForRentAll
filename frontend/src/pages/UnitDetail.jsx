import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

export default function UnitDetail() {
  const { unitId } = useParams();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (idx) => { setLightboxIndex(idx); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const lightboxPrev = (e) => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + imageUrls.length) % imageUrls.length); };
  const lightboxNext = (e) => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % imageUrls.length); };

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/unit/public/${unitId}`);
        setUnit(res.data || null);
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load unit details");
      } finally {
        setLoading(false);
      }
    };
    fetchUnit();
  }, [unitId]);

  const imageUrls = useMemo(() => {
    if (!unit) return [];
    const urls = [];
    if (Array.isArray(unit.photos)) {
      unit.photos.forEach((p) => {
        if (!p) return;
        if (p.startsWith("http://") || p.startsWith("https://")) urls.push(p);
        else urls.push(`${api.defaults.baseURL}/${p.startsWith("/") ? p.slice(1) : p}`);
      });
    }
    return urls.length ? urls : ["https://via.placeholder.com/900x500?text=Unit+Image"];
  }, [unit]);

  const amenities = useMemo(() => {
    if (!unit) return [];
    return [
      unit.amenity1 && `${unit.amenity1}`,
      unit.amenity2 && `${unit.amenity2}`,
      unit.amenity3 && `${unit.amenity3}`,
      unit.amenity4 && `${unit.amenity4}`
    ].filter(Boolean);
  }, [unit]);

  const fullAddress = useMemo(() => {
    if (!unit) return "-";
    return [unit.property?.address, unit.property?.area, unit.property?.city, unit.property?.state]
      .filter(Boolean)
      .join(", ");
  }, [unit]);

  const ownerContact = useMemo(() => {
    const owner = unit?.property?.owner;
    if (!owner || typeof owner !== "object") {
      return { name: "-", phone: "-", email: "-" };
    }
    return {
      name: owner.name || "-",
      phone: owner.phone || "-",
      email: owner.email || "-"
    };
  }, [unit]);

  if (loading) return <div className="page-container">Loading unit details...</div>;
  if (error) return <div className="page-container"><div className="error-msg">{error}</div></div>;
  if (!unit) return <div className="page-container"><div className="error-msg">Unit not found</div></div>;

  return (
    <>
    <div className="page-container">
      <div className="searchSection" style={{ marginBottom: "2rem" }}>
        <p className="p1">Explore Available Properties Instantly</p>
        <p className="p2">Your complete property overview with photos, amenities, and key details.</p>
      </div>

      <div className="unitDetail-wrap">
        {unit.property?.name && (
          <p className="unitDetail-propertyName" style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: 4, marginTop: 0 }}>
            {unit.property.name}
          </p>
        )}
        <h1 className="unitDetail-title">Unit {unit.number || "-"}</h1>

        <div className="unitDetail-main">
          <div className="unitDetail-mediaCol">
            <div className="unitDetail-carousel">
              <img
                src={imageUrls[currentImageIndex]}
                alt={`Unit image ${currentImageIndex + 1}`}
                className="unitDetail-mainImg"
                style={{ cursor: 'zoom-in' }}
                onClick={() => openLightbox(currentImageIndex)}
              />
              <div className="unitDetail-thumbStrip">
                {imageUrls.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    className={`unitDetail-thumbBtn ${idx === currentImageIndex ? "active" : ""}`}
                    onClick={() => setCurrentImageIndex(idx)}
                  >
                    <img src={img} alt={`thumbnail ${idx + 1}`} className="unitDetail-thumbImg" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="unitDetail-contentCol">
            <div className="unitDetail-card">
              <div className="unitDetail-cardHead">
                <h3>Property Detail</h3>
                <div>
                  <span className="unitDetail-black">Rent Price: </span>
                  <span className="unitDetail-blue">&#8377;{unit.rent ?? "-"}</span>
                </div>
              </div>
              <p className="unitDetail-descInCard">{unit.description || "No unit description available."}</p>
            </div>
          </div>
        </div>

        <div className="unitDetail-extra">
          <div className="unitDetail-card">
            <h3>Included Amenities</h3>
            {amenities.length ? (
              <ul className="unitDetail-list">
                {amenities.map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            ) : (
              <p className="unitDetail-muted">No amenities specified.</p>
            )}
          </div>

          <hr className="unitDetail-hr" />

          <h3 className="unitDetail-heading">Address:</h3>
          <div className="unitDetail-address">
            <span className="unitDetail-locationIcon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            <span>{fullAddress || "-"}</span>
          </div>

          <hr className="unitDetail-hr" />

          <h3 className="unitDetail-heading">Unit Details:</h3>
          <div className="unitDetail-lines">
            <div><span className="unitDetail-black">Bedroom:</span> <span className="unitDetail-gray">{unit.rooms ?? "-"}</span></div>
            <div><span className="unitDetail-black">Kitchen:</span> <span className="unitDetail-gray">{unit.halls ?? "-"}</span></div>
            <div><span className="unitDetail-black">Bathroom:</span> <span className="unitDetail-gray">{unit.bathrooms ?? "-"}</span></div>
            <div><span className="unitDetail-black">Balcony:</span> <span className="unitDetail-gray">{unit.balcony ?? "-"}</span></div>
          </div>

          <hr className="unitDetail-hr" />

          <h3 className="unitDetail-heading">Contact Owner:</h3>
          <div className="unitDetail-contact">
            <div><span className="unitDetail-black">Name:</span> <span className="unitDetail-gray">{ownerContact.name}</span></div>
            <div><span className="unitDetail-black">Phone:</span> <span className="unitDetail-gray">{ownerContact.phone}</span></div>
            <div><span className="unitDetail-black">Email:</span> <span className="unitDetail-gray">{ownerContact.email}</span></div>
          </div>
        </div>
      </div>
    </div>

      {lightboxOpen && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px'
          }}
        >
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute', top: 16, right: 20, background: 'none',
              border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer', lineHeight: 1
            }}
          >×</button>
          {imageUrls.length > 1 && (
            <button
              onClick={lightboxPrev}
              style={{
                position: 'absolute', left: 16, background: 'rgba(255,255,255,0.15)',
                border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer',
                borderRadius: 6, padding: '4px 8px', width: 'fit-content', minWidth: 0
              }}
            >‹</button>
          )}
          <img
            src={imageUrls[lightboxIndex]}
            alt={`Unit image ${lightboxIndex + 1}`}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90%', maxHeight: '85vh',
              objectFit: 'contain', borderRadius: 10,
              boxShadow: '0 4px 32px rgba(0,0,0,0.5)'
            }}
          />
          {imageUrls.length > 1 && (
            <button
              onClick={lightboxNext}
              style={{
                position: 'absolute', right: 16, background: 'rgba(255,255,255,0.15)',
                border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer',
                borderRadius: 6, padding: '4px 8px', width: 'fit-content', minWidth: 0
              }}
            >›</button>
          )}
          <div style={{
            position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center',
            color: '#ccc', fontSize: '0.9rem'
          }}>
            {lightboxIndex + 1} / {imageUrls.length}
          </div>
        </div>
      )}
    </>
  );
}
