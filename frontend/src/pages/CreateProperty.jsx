import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function CreateProperty(){
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("address", address);
      formData.append("state", state);
      formData.append("city", city);
      formData.append("area", area);
      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }
      await api.post("/property", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      nav("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || err.message || "Failed to create property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container form-container mobile-links-page">
      <div className="page-header">
        <h1 className="page-title">Create Property</h1>
        <p className="page-subtitle">Add a new property to your portfolio</p>
      </div>
      
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Property Name</label>
          <input 
            placeholder="e.g., Sunrise Apartments" 
            value={name} 
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Full Address</label>
          <input 
            placeholder="e.g., 123 Main Street, City" 
            value={address} 
            onChange={e => setAddress(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">State</label>
          <input
            placeholder="e.g., Maharashtra"
            value={state}
            onChange={e => setState(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">City</label>
          <input
            placeholder="e.g., Mumbai"
            value={city}
            onChange={e => setCity(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Area</label>
          <input
            placeholder="e.g., Andheri West"
            value={area}
            onChange={e => setArea(e.target.value)}
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
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Property'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => nav(-1)}>
            Cancel
          </button>
        </div>
        
        {error && <div className="error-msg">{error}</div>}
      </form>
    </div>
  );
}
