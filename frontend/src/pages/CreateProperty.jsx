import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function CreateProperty(){
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [images, setImages] = useState([]);
  const [paymentQrFile, setPaymentQrFile] = useState(null);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
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
      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }
      if (paymentQrFile) formData.append('paymentQr', paymentQrFile);
      formData.append('bankName', bankName || '');
      formData.append('accountNumber', accountNumber || '');
      formData.append('ifsc', ifsc || '');
      formData.append('upiId', upiId || '');
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
    <div className="page-container form-container">
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
          <label className="form-label">Address</label>
          <input 
            placeholder="e.g., 123 Main Street, City" 
            value={address} 
            onChange={e => setAddress(e.target.value)}
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
        <div className="form-group">
          <label className="form-label">Payment QR (optional)</label>
          <input type="file" accept="image/*" onChange={e => setPaymentQrFile(e.target.files[0])} />
        </div>
        <div className="form-group">
          <label className="form-label">Bank Name</label>
          <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank name (optional)" />
        </div>
        <div className="form-group">
          <label className="form-label">Account Number</label>
          <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account number (optional)" />
        </div>
        <div className="form-group">
          <label className="form-label">IFSC</label>
          <input value={ifsc} onChange={e => setIfsc(e.target.value)} placeholder="IFSC (optional)" />
        </div>
        <div className="form-group">
          <label className="form-label">UPI ID</label>
          <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="UPI ID (optional)" />
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