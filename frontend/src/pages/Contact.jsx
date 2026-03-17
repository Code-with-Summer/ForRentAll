import { useState } from "react";
import api from "../api";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState(null); // 'ok' | 'error'
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setStatus("error");
      return;
    }
    try {
      setSubmitting(true);
      await api.post("/contact", form);
      setStatus("ok");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  const sectionHead = { color: "#d4a017", fontWeight: 700, fontSize: "1.15rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" };
  const infoLabel = { color: "#7c5a0e", fontWeight: 600, marginBottom: 2, display: "block" };
  const infoValue = { color: "#1f2937", marginBottom: 8, lineHeight: 1.7 };
  const linkStyle = { color: "#b45309", fontWeight: 600, textDecoration: "none" };
  const divider = { border: "none", borderTop: "1px solid #f1deab", margin: "18px 0" };

  return (
    <div className="page-container mobile-links-page info-page contact-page">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#1f2937", marginBottom: 6 }}>Get in Touch</h1>
        <p style={{ color: "#4b5563", lineHeight: 1.75 }}>
          We are here to help you with any questions related to rental properties, listings,
          or property management on RentForAll.
        </p>
      </div>

      {/* Contact cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#fffdf4", border: "1px solid #f1deab", borderRadius: 12, padding: "16px 18px" }}>
          <p style={sectionHead}>📞 Phone</p>
          <span style={infoLabel}>Call Us</span>
          <p style={infoValue}>
            <a href="tel:+919039252504" style={linkStyle}>+91 90392 52504</a>
          </p>
          <p style={{ color: "#6b7280", fontSize: "0.88rem" }}>General inquiries, listing assistance, platform support.</p>
        </div>

        <div style={{ background: "#fffdf4", border: "1px solid #f1deab", borderRadius: 12, padding: "16px 18px" }}>
          <p style={sectionHead}>✉️ Email</p>
          <span style={infoLabel}>Write to Us</span>
          <p style={infoValue}>
            <a href="mailto:support@rentforall.com" style={linkStyle}>support@rentforall.com</a>
          </p>
          <p style={{ color: "#6b7280", fontSize: "0.88rem" }}>Support requests, listing help, or business inquiries.</p>
        </div>

        <div style={{ background: "#fffdf4", border: "1px solid #f1deab", borderRadius: 12, padding: "16px 18px" }}>
          <p style={sectionHead}>🏢 Head Office</p>
          <span style={infoLabel}>Address</span>
          <p style={infoValue}>RentForAll<br />Pendra, Madhya Pradesh<br />India</p>
        </div>

        <div style={{ background: "#fffdf4", border: "1px solid #f1deab", borderRadius: 12, padding: "16px 18px" }}>
          <p style={sectionHead}>🕐 Business Hours</p>
          <span style={infoLabel}>Monday – Saturday</span>
          <p style={{ ...infoValue, marginBottom: 4 }}>10:00 AM – 7:00 PM</p>
          <span style={infoLabel}>Sunday</span>
          <p style={infoValue}>Closed</p>
        </div>
      </div>

      <hr style={divider} />

      {/* Message Form */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: "#1f2937", marginBottom: 6 }}>Send Us a Message</h2>
        <p style={{ color: "#4b5563", marginBottom: 18 }}>
          Have a question or need support? Fill out the form below and we will get back to you.
        </p>

        {status === "ok" && (
          <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 8, padding: "12px 16px", color: "#065f46", fontWeight: 600, marginBottom: 14 }}>
            ✓ Your message has been sent! We will get back to you soon.
          </div>
        )}
        {status === "error" && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", color: "#b91c1c", fontWeight: 600, marginBottom: 14 }}>
            Please fill in your name, email, and message before submitting.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 14 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Name <span style={{ color: "#b91c1c" }}>*</span></label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address <span style={{ color: "#b91c1c" }}>*</span></label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Phone Number</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Subject</label>
              <input name="subject" value={form.subject} onChange={handleChange} placeholder="How can we help?" />
            </div>
          </div>
          <div className="form-group" style={{ margin: 0, marginBottom: 14 }}>
            <label className="form-label">Message <span style={{ color: "#b91c1c" }}>*</span></label>
            <textarea name="message" value={form.message} onChange={handleChange} rows={5} placeholder="Write your message here..." required style={{ width: "100%", resize: "vertical" }} />
          </div>
          <button type="submit" disabled={submitting} style={{ background: "#d4a017", color: "#1f2937", border: "1px solid #c28e14", borderRadius: 8, padding: "10px 28px", fontWeight: 700, fontSize: "1rem", cursor: submitting ? "not-allowed" : "pointer" }}>
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>

      <hr style={divider} />

      {/* Support sections */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <div style={{ background: "#fffdf4", border: "1px solid #f1deab", borderRadius: 12, padding: "16px 18px" }}>
          <p style={sectionHead}>🏠 Support for Property Owners</p>
          <p style={{ color: "#374151", lineHeight: 1.7, marginBottom: 8 }}>
            Need help listing your property or managing your rental space?
          </p>
          <p style={infoValue}>
            📞 <a href="tel:+919039252504" style={linkStyle}>+91 90392 52504</a>
          </p>
          <p style={{ color: "#6b7280", fontSize: "0.88rem" }}>Our team will guide you through the listing process.</p>
        </div>

        <div style={{ background: "#fffdf4", border: "1px solid #f1deab", borderRadius: 12, padding: "16px 18px" }}>
          <p style={sectionHead}>🔑 Support for Tenants</p>
          <p style={{ color: "#374151", lineHeight: 1.7, marginBottom: 8 }}>
            Looking for a rental property or need assistance with your search?
          </p>
          <p style={infoValue}>
            📞 <a href="tel:+919039252504" style={linkStyle}>+91 90392 52504</a>
          </p>
          <p style={{ color: "#6b7280", fontSize: "0.88rem" }}>We will help you find the right rental space.</p>
        </div>
      </div>
    </div>
  );
}
