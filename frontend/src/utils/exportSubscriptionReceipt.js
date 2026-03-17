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

export const exportSubscriptionReceipt = async ({ subscription, owner, admin }) => {
  if (!subscription) return;
  const doc = new jsPDF();

  const margin = 14;
  let y = 16;

  try {
    const logoDataUrl = await loadImageAsDataUrl(logoStrip);
    const logoWidth = 58;
    const logoHeight = 16;
    doc.addImage(logoDataUrl, "JPEG", margin, y, logoWidth, logoHeight);
    y += logoHeight + 6;
  } catch (_err) {
    // Keep receipt export working even if logo cannot be loaded.
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Subscription Receipt", margin, y);
  doc.setFont("helvetica", "normal");
  y += 8;

  doc.setFontSize(10);
  doc.text(`Invoice: ${subscription.invoiceNumber || "-"}`, margin, y);
  y += 6;
  const paidAt = subscription.reviewedAt || subscription.updatedAt || subscription.createdAt;
  doc.text(`Date: ${paidAt ? new Date(paidAt).toLocaleDateString() : "-"}`, margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.text("Billed By (Admin)", margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(`Name: ${admin?.adminName || "-"}`, margin, y);
  y += 5;
  doc.text(`Email: ${admin?.adminEmail || "-"}`, margin, y);
  y += 5;
  doc.text(`Phone: ${admin?.adminPhone || "-"}`, margin, y);
  y += 5;
  doc.text(`Address: ${admin?.officeAddress || "-"}`, margin, y);
  y += 8;

  doc.setFontSize(12);
  doc.text("Billed To (Owner)", margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(`Name: ${owner?.name || "-"}`, margin, y);
  y += 5;
  doc.text(`Email: ${owner?.email || "-"}`, margin, y);
  y += 5;
  doc.text(`Phone: ${owner?.phone || "-"}`, margin, y);
  y += 8;

  doc.setFontSize(12);
  doc.text("Subscription Details", margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(`Plan: ${subscription.planName || "-"}`, margin, y);
  y += 5;
  doc.text(`Duration: ${subscription.durationDays || "-"} days`, margin, y);
  y += 5;
  doc.text(`Status: ${subscription.status || "-"}`, margin, y);
  y += 5;
  doc.text(`Transaction ID: ${subscription.paymentRef || "-"}`, margin, y);
  y += 8;

  const amount = Number(subscription.pricePaid || 0);
  doc.setFontSize(12);
  doc.text("Amount Summary (GST-ready)", margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(`Subtotal: Rs ${amount.toFixed(2)}`, margin, y);
  y += 5;
  doc.text("CGST (0%): Rs 0.00", margin, y);
  y += 5;
  doc.text("SGST (0%): Rs 0.00", margin, y);
  y += 5;
  doc.text(`Total: Rs ${amount.toFixed(2)}`, margin, y);

  doc.setFontSize(9);
  doc.text("This receipt acknowledges payment for subscription access.", margin, 280);

  const fileName = `subscription-receipt-${subscription.invoiceNumber || "invoice"}.pdf`;
  doc.save(fileName);
};
