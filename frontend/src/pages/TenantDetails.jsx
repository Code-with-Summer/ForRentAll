import { useParams } from "react-router-dom";

export default function TenantDetails() {
  const { tenantId } = useParams();

  return (
    <div className="page-container">
      <h1>Tenant Details</h1>
      <p>Tenant ID: {tenantId}</p>
    </div>
  );
}