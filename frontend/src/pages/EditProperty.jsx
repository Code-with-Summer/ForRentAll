import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

export default function EditProperty() {
  const { id } = useParams();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [paymentQrPreview, setPaymentQrPreview] = useState('');
  const [paymentQrFile, setPaymentQrFile] = useState(null);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await api.get(`/property/${id}`);
        setName(res.data.name);
        setAddress(res.data.address);
        const toUrl = p => p && (p.startsWith('http://') || p.startsWith('https://') ? p : (api.defaults.baseURL + (p || '')));
        setExistingImages((res.data.images || []).map(i => toUrl(i)));
        setPaymentQrPreview(res.data.paymentQr ? toUrl(res.data.paymentQr) : '');
        setBankName(res.data.paymentInfo?.bankName || '');
        setAccountNumber(res.data.paymentInfo?.accountNumber || '');
        setIfsc(res.data.paymentInfo?.ifsc || '');
        setUpiId(res.data.paymentInfo?.upiId || '');
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
      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }
      if (paymentQrFile) formData.append('paymentQr', paymentQrFile);
      formData.append('bankName', bankName || '');
      formData.append('accountNumber', accountNumber || '');
      formData.append('ifsc', ifsc || '');
      formData.append('upiId', upiId || '');
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

        <div className="form-group">
          <label className="form-label">Payment QR (optional)</label>
          <input type="file" accept="image/*" onChange={e => { setPaymentQrFile(e.target.files[0]); setPaymentQrPreview(URL.createObjectURL(e.target.files[0])); }} />
          {paymentQrPreview && (<div style={{ marginTop: 8 }}><img src={paymentQrPreview} alt="QR" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #ccc' }} /></div>)}
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