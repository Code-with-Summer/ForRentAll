import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { exportSubscriptionReceipt } from "../utils/exportSubscriptionReceipt";

export default function AdminPage() {
  const nav = useNavigate();
  const [owners, setOwners] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentAction, setPaymentAction] = useState("");
  const [adminInfo, setAdminInfo] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 6;
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ownerPageIndex, setOwnerPageIndex] = useState(0);

  // Messages state
  const [messages, setMessages] = useState([]);
  const [msgTotal, setMsgTotal] = useState(0);
  const [msgPage, setMsgPage] = useState(0);
  const msgPageSize = 6;
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [msgLoading, setMsgLoading] = useState(false);

  const msgTotalPages = Math.max(1, Math.ceil(msgTotal / msgPageSize));

  const fetchMessages = useCallback(async (page = 0) => {
    try {
      setMsgLoading(true);
      const res = await api.get(`/contact/messages?page=${page}&limit=${msgPageSize}`);
      setMessages(res.data.messages || []);
      setMsgTotal(res.data.total || 0);
    } catch {
      // silently ignore
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const handleResolveMsg = async (id) => {
    try {
      await api.put(`/contact/messages/${id}/resolve`);
      setMessages((prev) => prev.map((m) => m._id === id ? { ...m, resolved: true } : m));
      if (selectedMsg && selectedMsg._id === id) setSelectedMsg((prev) => ({ ...prev, resolved: true }));
    } catch {
      // ignore
    }
  };

  const reloadPayments = async () => {
    const paymentsRes = await api.get("/subscription/admin/payments");
    setPayments(paymentsRes.data.payments || []);
  };

  const toFileUrl = (p) => {
    if (!p) return "";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    const base = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
    return `${base}/${p.startsWith("/") ? p.slice(1) : p}`;
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      nav("/login");
      return;
    }
    const fetchOwners = async () => {
      try {
        setLoading(true);
        setError("");
        const [ownersRes, plansRes, paymentsRes] = await Promise.all([
          api.get("/owner/all"),
          api.get("/subscription/plans"),
          api.get("/subscription/admin/payments"),
        ]);
        setOwners(ownersRes.data.owners || []);
        setPlans(plansRes.data.plans || []);
        setPayments(paymentsRes.data.payments || []);
        const infoRes = await api.get("/subscription/payment-info");
        setAdminInfo(infoRes.data?.paymentInfo || null);
      } catch (err) {
        setError("Failed to fetch owners");
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
    fetchMessages(0);
  }, [success, nav, fetchMessages]);

  const filteredOwners = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return owners;
    return owners.filter((o) => {
      return (
        String(o.name || "").toLowerCase().includes(q) ||
        String(o.email || "").toLowerCase().includes(q) ||
        String(o._id || "").toLowerCase().includes(q)
      );
    });
  }, [owners, query]);

  const ownerPageSize = 6;
  const ownerTotalPages = Math.max(1, Math.ceil(filteredOwners.length / ownerPageSize));
  const pagedOwners = filteredOwners.slice(
    ownerPageIndex * ownerPageSize,
    (ownerPageIndex + 1) * ownerPageSize,
  );

  useEffect(() => {
    if (ownerPageIndex > ownerTotalPages - 1) {
      setOwnerPageIndex(ownerTotalPages - 1);
    }
  }, [ownerPageIndex, ownerTotalPages]);

  useEffect(() => {
    setOwnerPageIndex(0);
  }, [query]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      await api.post("/owner/add", { ...form });
      setSuccess("Owner added successfully");
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add owner");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ownerId) => {
    if (!window.confirm("Delete this owner? This cannot be undone.")) return;
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      await api.delete(`/owner/${ownerId}`);
      setOwners((prev) => prev.filter((o) => o._id !== ownerId));
      setSuccess("Owner removed");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete owner");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOwner = async (owner) => {
    try {
      setLoading(true);
      if (owner.isActive === false) {
        await api.post(`/subscription/admin/owner/${owner._id}/activate-subscription`, {
          planCode: "SILVER",
        });
      } else {
        await api.put(`/subscription/admin/owner/${owner._id}/status`, {
          isActive: false,
        });
      }
      setOwners((prev) =>
        prev.map((o) => (o._id === owner._id ? { ...o, isActive: owner.isActive === false } : o)),
      );
      setSuccess(owner.isActive === false ? "Owner activated with subscription" : "Owner deactivated");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update owner status");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanPriceSave = async (code, price) => {
    try {
      setLoading(true);
      const res = await api.put(`/subscription/admin/plans/${code}`, { price: Number(price) });
      setPlans((prev) => prev.map((p) => (p.code === code ? res.data.plan : p)));
      setSuccess("Plan price updated");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update plan price");
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      setPaymentAction(paymentId);
      await api.post(`/subscription/admin/purchases/${paymentId}/approve`);
      await reloadPayments();
      setSuccess("Payment approved");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to approve payment");
    } finally {
      setPaymentAction("");
    }
  };

  const handleRejectPayment = async (paymentId) => {
    const note = window.prompt("Reject note (optional):", "");
    if (note === null) return;
    try {
      setPaymentAction(paymentId);
      await api.post(`/subscription/admin/purchases/${paymentId}/reject`, {
        reviewNote: note || "",
      });
      await reloadPayments();
      setSuccess("Payment rejected");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reject payment");
    } finally {
      setPaymentAction("");
    }
  };

  const pagedPayments = payments.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(payments.length / pageSize));

  useEffect(() => {
    if (pageIndex > totalPages - 1) setPageIndex(totalPages - 1);
  }, [pageIndex, totalPages]);

  return (
    <div className="admin-page-shell">
      <div className="admin-page-head">
        <div>
          <h1>Admin Panel</h1>
          <p>Manage owner accounts and review details.</p>
        </div>
        <div className="admin-head-actions">
          <button onClick={() => nav("/admin/blogs")} className="btn-secondary admin-blog-action-btn">Manage Blogs</button>
          <button onClick={() => nav("/admin/blogs/new")} className="admin-blog-action-btn">Create Blog</button>
        </div>
      </div>

      <div className="admin-grid">
        <section className="admin-card">
          <h3>Add Owner</h3>
          <form onSubmit={handleSubmit} className="admin-owner-form">
            <input
              name="name"
              placeholder="Owner name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Owner email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Temporary password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Add Owner"}
            </button>
          </form>
          {error && <div className="admin-msg admin-msg--error">{error}</div>}
          {success && <div className="admin-msg admin-msg--ok">{success}</div>}
        </section>

        <section className="admin-card admin-card--wide">
          <div className="admin-list-head">
            <h3>Package Pricing</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 14 }}>
            {plans.map((plan) => (
              <div key={plan.code} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 10 }}>
                <div style={{ fontWeight: 700 }}>{plan.name}</div>
                <div style={{ color: "#6b7280", marginBottom: 8 }}>{plan.durationDays} days</div>
                <input
                  type="number"
                  value={plan.price}
                  onChange={(e) =>
                    setPlans((prev) =>
                      prev.map((p) => (p.code === plan.code ? { ...p, price: Number(e.target.value || 0) } : p)),
                    )
                  }
                />
                <button style={{ marginTop: 8 }} onClick={() => handlePlanPriceSave(plan.code, plan.price)}>
                  Save Price
                </button>
              </div>
            ))}
          </div>

          <div className="admin-list-head">
            <h3>Owners ({filteredOwners.length})</h3>
            <input
              placeholder="Search owners"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="admin-owner-tableWrap">
              <table className="admin-owner-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Owner ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedOwners.map((owner) => (
                    <tr key={owner._id}>
                      <td>{owner.name}</td>
                      <td>{owner.email}</td>
                      <td className="admin-owner-id">{owner._id}</td>
                      <td className="admin-owner-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleToggleOwner(owner)}
                        >
                          {owner.isActive === false ? "Activate" : "Deactivate"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => nav(`/admin/owner/${owner._id}`)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleDelete(owner._id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filteredOwners.length && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "#6b7280" }}>
                        No owners found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {filteredOwners.length > ownerPageSize && (
            <div className="admin-pagination-row admin-pagination-row--left">
              <button
                type="button"
                className="btn-secondary admin-pagination-btn"
                onClick={() => setOwnerPageIndex((p) => Math.max(0, p - 1))}
                disabled={ownerPageIndex === 0}
              >
                Prev
              </button>
              <div className="admin-pagination-info">
                Page {ownerPageIndex + 1} of {ownerTotalPages}
              </div>
              <button
                type="button"
                className="btn-secondary admin-pagination-btn"
                onClick={() => setOwnerPageIndex((p) => Math.min(ownerTotalPages - 1, p + 1))}
                disabled={ownerPageIndex >= ownerTotalPages - 1}
              >
                Next
              </button>
            </div>
          )}
        </section>

        <section className="admin-card admin-card--wide">
          <div className="admin-list-head">
            <h3>Package Payments</h3>
          </div>
          <div className="admin-owner-tableWrap">
            <table className="admin-owner-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Owner</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>View</th>
                  <th>Action</th>
                  <th></th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {pagedPayments.map((pay, idx) => (
                  <tr key={pay._id}>
                    <td>{pageIndex * pageSize + idx + 1}</td>
                    <td>{pay.owner?.name || "-"}</td>
                    <td>{pay.planName}</td>
                    <td>₹{pay.pricePaid}</td>
                    <td>{pay.statusDisplay || pay.status || "-"}</td>
                    <td>
                      <button type="button" className="btn-secondary" onClick={() => setSelectedPayment(pay)}>
                        View
                      </button>
                    </td>
                    <td>
                      {(pay.statusDisplay || pay.status) === "approved" || (pay.statusDisplay || pay.status) === "active" ? (
                        <span style={{ color: "#166534", fontWeight: 600 }}>Approved</span>
                      ) : (pay.statusDisplay || pay.status) === "rejected" ? (
                        <span style={{ color: "#b91c1c", fontWeight: 600 }}>Rejected</span>
                      ) : (
                        <span style={{ color: "#64748b", fontWeight: 600 }}>Pending</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleApprovePayment(pay._id)}
                          disabled={paymentAction === pay._id || pay.status !== "pending"}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleRejectPayment(pay._id)}
                          disabled={paymentAction === pay._id || pay.status === "rejected"}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                    <td>
                      {(pay.statusDisplay || pay.status) !== "pending" ? (
                        <button
                          type="button"
                          onClick={() =>
                            exportSubscriptionReceipt({
                              subscription: pay,
                              owner: pay.owner || null,
                              admin: adminInfo,
                            })
                          }
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ display: "inline-block", verticalAlign: "middle" }}
                          >
                            <path d="M12 3v11m0 0l4-4m-4 4l-4-4" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M4 17v3h16v-3" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
                {!payments.length && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", color: "#6b7280" }}>
                      No package payments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {payments.length > pageSize && (
            <div style={{ display: "flex", justifyContent: "flex-start", gap: 10, marginTop: 12 }}>
              <button type="button" className="btn-secondary admin-pagination-btn" onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={pageIndex === 0}>
                Prev
              </button>
              <div style={{ alignSelf: "center" }}>
                Page {pageIndex + 1} of {totalPages}
              </div>
              <button type="button" className="btn-secondary admin-pagination-btn" onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))} disabled={pageIndex >= totalPages - 1}>
                Next
              </button>
            </div>
          )}
        </section>

        <section className="admin-card admin-card--wide">
          <div className="admin-list-head">
            <h3>Messages ({msgTotal})</h3>
          </div>
          {msgLoading ? (
            <div style={{ color: "#6b7280", padding: "1rem 0" }}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div style={{ color: "#6b7280", padding: "1rem 0" }}>No messages yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  style={{
                    border: msg.resolved ? "1px solid #bbf7d0" : "1px solid #f1deab",
                    borderRadius: 10,
                    padding: "14px 16px",
                    background: msg.resolved ? "#f0fdf4" : "#fffdf4",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => setSelectedMsg(msg)}
                >
                  {msg.resolved && (
                    <span style={{ position: "absolute", top: 10, right: 12, background: "#d1fae5", color: "#065f46", fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "2px 8px" }}>Resolved</span>
                  )}
                  <div style={{ fontWeight: 700, color: "#1f2937", marginBottom: 2 }}>{msg.name}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>{msg.email}{msg.phone ? ` · ${msg.phone}` : ""}</div>
                  {msg.subject && <div style={{ fontSize: 13, fontWeight: 600, color: "#b45309", marginBottom: 4 }}>{msg.subject}</div>}
                  <div style={{ fontSize: 13, color: "#374151", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{msg.message}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(msg.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    {!msg.resolved && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: 12, padding: "4px 10px" }}
                        onClick={(e) => { e.stopPropagation(); handleResolveMsg(msg._id); }}
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {msgTotal > msgPageSize && (
            <div className="admin-pagination-row admin-pagination-row--left" style={{ marginTop: 14 }}>
              <button
                type="button"
                className="btn-secondary admin-pagination-btn"
                onClick={() => { const p = Math.max(0, msgPage - 1); setMsgPage(p); fetchMessages(p); }}
                disabled={msgPage === 0}
              >
                Prev
              </button>
              <div className="admin-pagination-info">Page {msgPage + 1} of {msgTotalPages}</div>
              <button
                type="button"
                className="btn-secondary admin-pagination-btn"
                onClick={() => { const p = Math.min(msgTotalPages - 1, msgPage + 1); setMsgPage(p); fetchMessages(p); }}
                disabled={msgPage >= msgTotalPages - 1}
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Message Detail Modal */}
      {selectedMsg && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1300, padding: 16 }}
          onClick={() => setSelectedMsg(null)}
        >
          <div
            style={{ background: "#fff", maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto", borderRadius: 12, padding: 24, boxSizing: "border-box", boxShadow: "0 4px 32px rgba(0,0,0,0.18)", position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => setSelectedMsg(null)} style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888", lineHeight: 1 }} aria-label="Close">×</button>
            <h3 style={{ color: "#1f2937", marginBottom: 16 }}>Message Details</h3>
            <div style={{ display: "grid", gap: 8, marginBottom: 16, background: "#fffdf4", border: "1px solid #f1deab", borderRadius: 8, padding: "12px 16px" }}>
              <p><strong style={{ color: "#7c5a0e" }}>From:</strong> {selectedMsg.name}</p>
              <p><strong style={{ color: "#7c5a0e" }}>Email:</strong> <a href={`mailto:${selectedMsg.email}`} style={{ color: "#b45309" }}>{selectedMsg.email}</a></p>
              {selectedMsg.phone && <p><strong style={{ color: "#7c5a0e" }}>Phone:</strong> <a href={`tel:${selectedMsg.phone}`} style={{ color: "#b45309" }}>{selectedMsg.phone}</a></p>}
              {selectedMsg.subject && <p><strong style={{ color: "#7c5a0e" }}>Subject:</strong> {selectedMsg.subject}</p>}
              <p style={{ fontSize: 12, color: "#9ca3af" }}><strong>Received:</strong> {new Date(selectedMsg.createdAt).toLocaleString("en-IN")}</p>
              <p><strong style={{ color: "#7c5a0e" }}>Status:</strong>{" "}
                <span style={{ fontWeight: 700, color: selectedMsg.resolved ? "#065f46" : "#b45309" }}>
                  {selectedMsg.resolved ? "✓ Resolved" : "Open"}
                </span>
              </p>
            </div>
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", marginBottom: 16, whiteSpace: "pre-wrap", lineHeight: 1.75, color: "#1f2937" }}>
              {selectedMsg.message}
            </div>
            {!selectedMsg.resolved && (
              <button
                type="button"
                onClick={() => handleResolveMsg(selectedMsg._id)}
                style={{ background: "#059669", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, cursor: "pointer", width: "100%" }}
              >
                Mark as Resolved
              </button>
            )}
          </div>
        </div>
      )}

      {selectedPayment && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: 12,
          }}
          onClick={() => setSelectedPayment(null)}
        >
          <div
            style={{
              background: "#fff",
              maxWidth: 720,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: 10,
              padding: 16,
              boxSizing: "border-box",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <h3 style={{ margin: 0 }}>Package Payment Details</h3>
              <button type="button" onClick={() => setSelectedPayment(null)} style={{ border: "none", background: "transparent", fontSize: 22, cursor: "pointer" }} aria-label="Close">
                x
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <p><strong>Owner:</strong> {selectedPayment.owner?.name || "-"}</p>
              <p><strong>Plan:</strong> {selectedPayment.planName || "-"}</p>
              <p><strong>Amount:</strong> ₹{selectedPayment.pricePaid || 0}</p>
              <p><strong>Status:</strong> {selectedPayment.status || "-"}</p>
              <p><strong>Transaction ID:</strong> {selectedPayment.paymentRef || "-"}</p>
              <p><strong>Invoice:</strong> {selectedPayment.invoiceNumber || "-"}</p>
              <p><strong>Validity:</strong> {selectedPayment.startsAt ? new Date(selectedPayment.startsAt).toLocaleDateString() : "-"} - {selectedPayment.endsAt ? new Date(selectedPayment.endsAt).toLocaleDateString() : "-"}</p>
              <p><strong>Reviewed At:</strong> {selectedPayment.reviewedAt ? new Date(selectedPayment.reviewedAt).toLocaleString() : "-"}</p>
              {selectedPayment.reviewNote ? <p><strong>Review Note:</strong> {selectedPayment.reviewNote}</p> : null}
              {selectedPayment.screenshot ? (
                <div style={{ marginTop: 10 }}>
                  <strong>Payment Proof:</strong>
                  <div style={{ marginTop: 6 }}>
                    <img src={toFileUrl(selectedPayment.screenshot)} alt="Payment Proof" style={{ maxWidth: 320, width: "100%", height: "auto", borderRadius: 6, border: "1px solid #e5e7eb" }} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
