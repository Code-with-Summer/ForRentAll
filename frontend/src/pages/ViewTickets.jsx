import React, { useEffect, useState } from "react";
import api from "../api";

export default function ViewTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await api.get("/ticket");
        setTickets(res.data || []);
      } catch (err) {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", background: "#fff", borderRadius: 10, boxShadow: "0 2px 16px #0001", padding: 32 }}>
      <h2 style={{ color: "#0e7490", marginBottom: 18 }}>All Tickets</h2>
      {loading ? (
        <div>Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div>No tickets found.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={{ padding: "8px", border: "1px solid #eee" }}>Subject</th>
              <th style={{ padding: "8px", border: "1px solid #eee" }}>Description</th>
              <th style={{ padding: "8px", border: "1px solid #eee" }}>Status</th>
              <th style={{ padding: "8px", border: "1px solid #eee" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t, idx) => (
              <tr key={idx} style={{ background: idx % 2 === 0 ? "#f9fafb" : "#fff" }}>
                <td>{t.subject}</td>
                <td>{t.description}</td>
                <td>{t.status || "Open"}</td>
                <td>{t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
