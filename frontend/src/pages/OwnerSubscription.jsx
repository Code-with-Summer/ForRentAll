import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { exportSubscriptionReceipt } from "../utils/exportSubscriptionReceipt";

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1200,
  padding: 12,
};

const dialogStyle = {
  width: "100%",
  maxWidth: 680,
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#fff",
  borderRadius: 10,
  padding: 16,
  boxSizing: "border-box",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid #d4d4d8",
  boxSizing: "border-box",
};

function toUrl(pathValue) {
  if (!pathValue) return "";
  if (pathValue.startsWith("http://") || pathValue.startsWith("https://")) return pathValue;
  const base = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
  const normalized = pathValue.startsWith("/") ? pathValue : `/${pathValue}`;
  return `${base}${normalized}`;
}

export default function OwnerSubscription() {
  const nav = useNavigate();
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [txnId, setTxnId] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [ownerUser, setOwnerUser] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "owner") {
      nav("/login");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem("userId");
        const requests = [
          api.get("/subscription/plans"),
          api.get("/subscription/my"),
          api.get("/subscription/payment-info"),
        ];
        if (userId) {
          requests.push(api.get(`/auth/profile/${userId}`));
        }
        const results = await Promise.all(requests);
        const plansRes = results[0];
        const myRes = results[1];
        const infoRes = results[2];
        const profileRes = results[3];
        setPlans(plansRes.data?.plans || []);
        setStatus(myRes.data || null);
        setPaymentInfo(infoRes.data?.paymentInfo || null);
        if (profileRes?.data?.user) {
          setOwnerUser(profileRes.data.user);
        }
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load packages.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [nav]);

  const canSelfPurchase = useMemo(() => status?.selfPurchaseAllowed !== false, [status]);
  const hasAdminPaymentInfo = useMemo(() => {
    if (!paymentInfo) return false;
    return Boolean(
      paymentInfo.bankName ||
      paymentInfo.accountNumber ||
      paymentInfo.ifsc ||
      paymentInfo.upiId ||
      paymentInfo.paymentQr,
    );
  }, [paymentInfo]);

  const closeDialog = () => {
    setShowPurchaseDialog(false);
    setSelectedPlan(null);
    setTxnId("");
    setPaymentScreenshot(null);
  };

  const openPurchaseDialog = async (plan) => {
    if (!canSelfPurchase) return;
    setError("");
    setSuccess("");
    setSelectedPlan(plan);
    setTxnId("");
    setPaymentScreenshot(null);
    setShowPurchaseDialog(true);

    try {
      const infoRes = await api.get("/subscription/payment-info");
      setPaymentInfo(infoRes.data?.paymentInfo || null);
    } catch (_err) {
      setPaymentInfo(null);
    }
  };

  const handlePay = async () => {
    if (!selectedPlan) return;
    if (!txnId.trim()) {
      setError("Transaction ID is required.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setBuying(selectedPlan.code);

      const fd = new FormData();
      fd.append("planCode", selectedPlan.code);
      fd.append("paymentRef", txnId.trim());
      if (paymentScreenshot) fd.append("screenshot", paymentScreenshot);

      await api.post("/subscription/purchase", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const myRes = await api.get("/subscription/my");
      setStatus(myRes.data || null);
      setSuccess("Payment submitted for verification.");
      closeDialog();
    } catch (err) {
      setError(err?.response?.data?.error || "Purchase failed.");
    } finally {
      setBuying("");
    }
  };

  return (
    <div className="page-container mobile-links-page">
      <div className="page-header">
        <h1 className="page-title">Owner Subscription</h1>
        <p className="page-subtitle">Buy a package to access owner panel and list properties.</p>
      </div>

      {loading ? (
        <div>Loading packages...</div>
      ) : (
        <>
          {status?.hasActivePackage && status?.activeSubscription ? (
            <div className="success-msg" style={{ marginBottom: 14 }}>
              Active plan: <strong>{status.activeSubscription.planName}</strong> till{" "}
              <strong>{new Date(status.activeSubscription.endsAt).toLocaleDateString()}</strong>
            </div>
          ) : status?.pendingSubscription ? (
            <div className="success-msg" style={{ marginBottom: 14 }}>
              Payment submitted. Subscription is under verification.
            </div>
          ) : status?.blockedReason === "ADMIN_CANCELLED_SUBSCRIPTION" ? (
            <div className="error-msg" style={{ marginBottom: 14 }}>
              Subscription is cancelled by admin. You cannot activate it on your own.
            </div>
          ) : status?.blockedReason === "PACKAGE_EXPIRED" ? (
            <div className="error-msg" style={{ marginBottom: 14 }}>
              No subscription or subscription expired. Please purchase a new package to continue.
            </div>
          ) : canSelfPurchase ? (
            <div className="error-msg" style={{ marginBottom: 14 }}>
              No active package. Please purchase one to continue.
            </div>
          ) : (
            <div className="error-msg" style={{ marginBottom: 14 }}>
              Subscription is cancelled by admin. You cannot activate it on your own.
            </div>
          )}
          {status?.expiryWarning ? (
            <div className="error-msg" style={{ marginBottom: 14 }}>
              Your subscription expires in {status.expiryWarning.daysLeft} day(s).
            </div>
          ) : null}

          <div style={cardGridStyle}>
            {plans.map((p) => (
              <div key={p.code} className="dash-card" style={{ cursor: "default" }}>
                <h3 style={{ marginBottom: 8 }}>{p.name}</h3>
                <p style={{ marginBottom: 6 }}>Price: Rs {p.price}</p>
                <p style={{ marginBottom: 12 }}>Validity: {p.durationDays} days</p>
                <button onClick={() => openPurchaseDialog(p)} disabled={!canSelfPurchase}>
                  Purchase
                </button>
              </div>
            ))}
          </div>

          {status?.history?.length ? (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 10 }}>Subscription History</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f5f5f5" }}>
                      <th style={{ padding: 8, border: "1px solid #ddd" }}>Plan</th>
                      <th style={{ padding: 8, border: "1px solid #ddd" }}>Amount</th>
                      <th style={{ padding: 8, border: "1px solid #ddd" }}>Status</th>
                      <th style={{ padding: 8, border: "1px solid #ddd" }}>Invoice</th>
                      <th style={{ padding: 8, border: "1px solid #ddd" }}>Txn ID</th>
                      <th style={{ padding: 8, border: "1px solid #ddd" }}>Proof</th>
                      <th style={{ padding: 8, border: "1px solid #ddd" }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status.history.map((h) => (
                      <tr key={h._id}>
                        <td style={{ padding: 8, border: "1px solid #eee" }}>{h.planName || "-"}</td>
                        <td style={{ padding: 8, border: "1px solid #eee" }}>Rs {h.pricePaid || 0}</td>
                        <td style={{ padding: 8, border: "1px solid #eee" }}>{h.status || "-"}</td>
                        <td style={{ padding: 8, border: "1px solid #eee" }}>{h.invoiceNumber || "-"}</td>
                        <td style={{ padding: 8, border: "1px solid #eee" }}>{h.paymentRef || "-"}</td>
                        <td style={{ padding: 8, border: "1px solid #eee" }}>
                          {h.screenshot ? (
                            <a href={toUrl(h.screenshot)} target="_blank" rel="noreferrer">
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #eee" }}>
                          {h.status !== "pending" && h.status !== "rejected" ? (
                            <button
                              type="button"
                              onClick={() =>
                                exportSubscriptionReceipt({
                                  subscription: h,
                                  owner: ownerUser,
                                  admin: paymentInfo,
                                })
                              }
                            >
                              Download
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </>
      )}

      {showPurchaseDialog && selectedPlan && (
        <div style={overlayStyle} onClick={closeDialog}>
          <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>Purchase {selectedPlan.name}</h2>
              <button
                type="button"
                onClick={closeDialog}
                style={{ border: "none", background: "transparent", fontSize: 24, lineHeight: "22px", cursor: "pointer" }}
                aria-label="Close"
              >
                x
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <p style={{ marginBottom: 8 }}>
                Amount: <strong>Rs {selectedPlan.price}</strong>
              </p>
              <p style={{ marginBottom: 12 }}>Validity: {selectedPlan.durationDays} days</p>

              <h3 style={{ marginBottom: 8 }}>Admin Payment Details</h3>
              <p style={{ marginBottom: 6 }}>Bank Name: {paymentInfo?.bankName || "-"}</p>
              <p style={{ marginBottom: 6 }}>Account No: {paymentInfo?.accountNumber || "-"}</p>
              <p style={{ marginBottom: 6 }}>IFSC: {paymentInfo?.ifsc || "-"}</p>
              <p style={{ marginBottom: 6 }}>UPI: {paymentInfo?.upiId || "-"}</p>
              {paymentInfo?.paymentQr ? (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ marginBottom: 6 }}>QR</p>
                  <img
                    src={toUrl(paymentInfo.paymentQr)}
                    alt="Admin payment QR"
                    style={{ maxWidth: 220, width: "100%", height: "auto", borderRadius: 8, border: "1px solid #e4e4e7" }}
                  />
                </div>
              ) : null}
              {!hasAdminPaymentInfo && (
                <div className="error-msg" style={{ marginBottom: 12 }}>
                  Admin payment details are not configured yet.
                </div>
              )}

              <div style={{ marginBottom: 10 }}>
                <label className="form-label">Transaction ID</label>
                <input
                  style={inputStyle}
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  placeholder="Enter transaction ID"
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Payment Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={buying === selectedPlan.code || !txnId.trim() || !canSelfPurchase || !hasAdminPaymentInfo}
                >
                  {buying === selectedPlan.code ? "Processing..." : "Pay"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-msg" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}
      {success && (
        <div className="success-msg" style={{ marginTop: 12 }}>
          {success}
        </div>
      )}
    </div>
  );
}
