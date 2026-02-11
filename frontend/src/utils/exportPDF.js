import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportInvoicesToPDF = (invoices) => {
  const doc = new jsPDF();

  autoTable(doc, {
    startY: 24,
    head: [["Tenant", "Unit", "Month", "Amount", "Status", "Action"]],
    body: invoices.map(inv => [
      inv.tenantName || "-",
      inv.unitNumber || "-",
      inv.month || "-",
      `₹${inv.amount || 0}`,
      inv.status || "due",
      inv.action || "pending"
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [8, 145, 178] },
    didDrawPage: () => {
      doc.text("All Tenant Invoices", 14, 16);
    }
  });

  try {
    doc.save("invoices.pdf");
  } catch (e) {
    const pdfBlob = doc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
