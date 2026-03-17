import jsPDF from "jspdf";
import logoStrip from "../images/logo strip.jpeg";

function loadImageAsDataUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Export an array of invoice objects to a PDF file.
 * @param {Array} invoices
 */
export async function exportInvoicesToPDF(invoices = []) {
  const doc = new jsPDF({ orientation: "landscape" });

  const margin = 14;
  let y = 16;

  try {
    const logoDataUrl = await loadImageAsDataUrl(logoStrip);
    const logoWidth = 54;
    const logoHeight = 16;
    doc.addImage(logoDataUrl, "JPEG", margin, y, logoWidth, logoHeight);
    y += logoHeight + 6;
  } catch (_err) {
    // Keep PDF export working even if logo cannot be loaded.
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Report", margin, y);
  doc.setFont("helvetica", "normal");
  y += 10;

  // Column definitions
  const cols = [
    { header: "Unit", key: "unitNumber", w: 20 },
    { header: "Tenant", key: "tenantName", w: 40 },
    { header: "Month", key: "month", w: 28 },
    { header: "Amount", key: "amount", w: 28 },
    { header: "Status", key: "status", w: 24 },
    { header: "Action", key: "action", w: 24 },
    { header: "Txn ID", key: "txnId", w: 40 },
  ];

  // Header row
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  let x = margin;
  cols.forEach((col) => {
    doc.text(col.header, x, y);
    x += col.w;
  });
  y += 6;
  doc.setFont("helvetica", "normal");

  // Data rows
  invoices.forEach((inv) => {
    if (y > 185) {
      doc.addPage();
      y = 16;
    }
    x = margin;
    cols.forEach((col) => {
      const val = inv[col.key] != null ? String(inv[col.key]) : "-";
      doc.text(val.slice(0, Math.floor(col.w / 4)), x, y);
      x += col.w;
    });
    y += 6;
  });

  doc.save("invoices.pdf");
}
