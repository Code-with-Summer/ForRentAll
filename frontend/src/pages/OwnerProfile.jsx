export default function OwnerProfile({ owner }) {
  return (
    <div className="page-container">
      <h1>Owner Profile</h1>
      <p>Name: {owner?.name || "N/A"}</p>
      <p>Email: {owner?.email || "N/A"}</p>
      <p>Phone: {owner?.phone || "N/A"}</p>
    </div>
  );
}