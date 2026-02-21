import React, { useState, useEffect, useRef } from "react";
import api from "../api";

export default function Ticket() {
  const [view, setView] = useState("raise"); // 'raise' or 'view'
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const fileInputRef = useRef();

  useEffect(() => {
    if (view === "view") {
      setLoading(true);
      api.get("/ticket").then(res => {
        setTickets(res.data || []);
      }).catch(() => {
        setTickets([]);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [view]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      const form = new FormData();
      form.append("subject", subject);
      form.append("description", description);
      images.forEach(file => form.append("images", file));
      await api.post("/ticket", form, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess(true);
      setSubject("");
      setDescription("");
      setImages([]);
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (err) {
      setError("Failed to raise ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", background: "#fff", borderRadius: 10, boxShadow: "0 2px 16px #0001", padding: 32 }}>
      <div style={{ display: "flex", gap: 18, marginBottom: 24 }}>
        <button
          style={{ background: view === "view" ? "#0e7490" : "#e0f2fe", color: view === "view" ? "#fff" : "#0369a1", border: "none", borderRadius: 6, padding: "10px 28px", fontWeight: 600, cursor: "pointer" }}
          onClick={() => setView("view")}
        >
          View All Tickets
        </button>
        <button
          style={{ background: view === "raise" ? "#0e7490" : "#e0f2fe", color: view === "raise" ? "#fff" : "#0369a1", border: "none", borderRadius: 6, padding: "10px 28px", fontWeight: 600, cursor: "pointer" }}
          onClick={() => setView("raise")}
        >
          Raise a Ticket
        </button>
      </div>
      {view === "view" ? (
        loading ? (
          <div>Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div>No tickets found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ padding: "8px", border: "1px solid #eee" }}>Subject</th>
                <th style={{ padding: "8px", border: "1px solid #eee" }}>Images</th>
                <th style={{ padding: "8px", border: "1px solid #eee" }}>Description</th>
                <th style={{ padding: "8px", border: "1px solid #eee" }}>Status</th>
                <th style={{ padding: "8px", border: "1px solid #eee" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? "#f9fafb" : "#fff" }}>
                  <td>{t.subject}</td>
                  <td style={{ padding: 8, border: "1px solid #eee" }}>
                    {t.images && t.images.length > 0 ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {t.images.map((img, i) => (
                          <img key={i} src={(img.startsWith("http") ? img : `http://localhost:5000${img}`)} alt="ticket" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: "#6b7280" }}>—</div>
                    )}
                  </td>
                  <td>{t.description}</td>
                  <td>{t.status || "Open"}</td>
                  <td>{t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: "0 auto" }}>
          <h2 style={{ color: "#0e7490", marginBottom: 18 }}>Raise a Ticket</h2>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 500 }}>Subject</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc", marginTop: 4 }}
            >
              <option value="">Select an issue</option>
              <option value="Plumbing Issue">Plumbing Issue</option>
              <option value="Electricity Issue">Electricity Issue</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Internet Issue">Internet Issue</option>
              <option value="Cleaning Request">Cleaning Request</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 500 }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows={5}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc", marginTop: 4, resize: "vertical" }}
              placeholder="Describe your issue or request"
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 500 }}>Attach Images (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={e => setImages(Array.from(e.target.files || []))}
              style={{ display: "block", marginTop: 8 }}
            />
            {images && images.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {images.map((f, i) => (
                  <img key={i} src={URL.createObjectURL(f)} alt={f.name} style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 6 }} />
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{ background: "#0e7490", color: "#fff", border: "none", borderRadius: 6, padding: "10px 28px", fontWeight: 600, cursor: "pointer", width: "100%" }}
          >
            {submitting ? "Submitting..." : "Submit Ticket"}
          </button>
          {success && <div style={{ color: "#22c55e", marginTop: 12 }}>Ticket raised successfully!</div>}
          {error && <div style={{ color: "#b91c1c", marginTop: 12 }}>{error}</div>}
        </form>
      )}
    </div>
  );
}
