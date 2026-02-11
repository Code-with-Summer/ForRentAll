import * as XLSX from "xlsx";

export function exportInvoicesToExcel(invoices) {
  const wsData = [
    ["Tenant", "Unit", "Month", "Amount", "Status", "Action"],
    ...invoices.map(inv => [
      inv.tenantName || "-",
      inv.unitNumber || "-",
      inv.month || "-",
      `₹${inv.amount || 0}`,
      inv.status || "due",
      inv.action || "pending"
    ])
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Invoices");
  XLSX.writeFile(wb, "invoices.xls", { bookType: "xls" });
}
