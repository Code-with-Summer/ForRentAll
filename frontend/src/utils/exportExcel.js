/**
 * Export an array of invoice objects to a CSV file (Excel-compatible).
 * No third-party library required.
 * @param {Array} invoices
 */
export function exportInvoicesToExcel(invoices = []) {
  const headers = ["Unit", "Tenant", "Month", "Amount", "Status", "Action", "Txn ID"];
  const keys = ["unitNumber", "tenantName", "month", "amount", "status", "action", "txnId"];

  const escape = (val) => {
    if (val == null) return "";
    const str = String(val).replace(/"/g, '""');
    return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
  };

  const rows = [
    headers.map(escape).join(","),
    ...invoices.map((inv) => keys.map((k) => escape(inv[k])).join(",")),
  ];

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "invoices.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
