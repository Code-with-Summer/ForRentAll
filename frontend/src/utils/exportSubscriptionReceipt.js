import jsPDF from "jspdf";

export const exportSubscriptionReceipt = ({ subscription, owner, admin }) => {
  if (!subscription) return;
  const doc = new jsPDF();

  const margin = 14;
  let y = 16;

  doc.setFontSize(16);
  doc.text("Subscription Receipt", margin, y);
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
