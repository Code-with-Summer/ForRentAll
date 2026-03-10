import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

export default function EditProperty() {
  const { id } = useParams();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/property/${id}`);
        setName(res.data.name);
        setAddress(res.data.address);
        setState(res.data.state || "");
        setCity(res.data.city || "");
        setArea(res.data.area || "");
        const toUrl = p => p && (p.startsWith('http://') || p.startsWith('https://') ? p : (api.defaults.baseURL + (p || '')));
        setExistingImages((res.data.images || []).map(i => toUrl(i)));
      } catch (err) {
        console.error(err);
        setError("Failed to load property");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSaving(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("address", address);
      formData.append("state", state);
      formData.append("city", city);
      formData.append("area", area);
      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }
      await api.put(`/property/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      nav(`/property/${id}`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || err.message || "Failed to update property");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading property...</div>;

  return (
    <div className="page-container form-container">
      <div className="page-header">
        <h1 className="page-title">Edit Property</h1>
        <p className="page-subtitle">Update your property details</p>
      </div>
      
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Property Name</label>
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Property name"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Address</label>
          <input 
            value={address} 
            onChange={e => setAddress(e.target.value)} 
            placeholder="Property address"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">State</label>
          <input
            value={state}
            onChange={e => setState(e.target.value)}
            placeholder="State"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">City</label>
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="City"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Area</label>
          <input
            value={area}
            onChange={e => setArea(e.target.value)}
            placeholder="Area"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Property Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={e => setImages(e.target.files)}
          />
          {existingImages.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Existing Images:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {existingImages.map((img, idx) => (
                  <img key={idx} src={img} alt="Property" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #ccc' }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => nav(`/property/${id}`)} className="btn-secondary">
            Cancel
          </button>
        </div>
        {error && <div className="error-msg">{error}</div>}
      </form>
    </div>
  );
}
