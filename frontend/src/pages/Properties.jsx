import { useNavigate } from "react-router-dom";

export default function Properties(){
  const nav = useNavigate();
  const isLoggedIn = () => {
    const t = localStorage.getItem("token");
    return !!t && t !== "undefined" && t !== "null";
  };

  return (
    <div className="page-container" style={{textAlign:'center', padding:'4rem 2rem'}}>
      <h1 style={{fontSize:'2.5rem', marginBottom:'1rem', color: 'var(--text-primary)'}}>
        Property Management Made Simple
      </h1>
      <p style={{color:'var(--text-secondary)', fontSize:'1.125rem', marginBottom:'2.5rem', maxWidth:'500px', margin:'0 auto 2.5rem'}}>
        Streamline your rental business. Manage properties, tenants, and invoices all in one place.
      </p>
      
      {!isLoggedIn() && (
        <div style={{display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap'}}>
          <button onClick={() => nav('/register')} className="btn-lg">
            Get Started Free
          </button>
          <button onClick={() => nav('/login')} className="btn-secondary btn-lg">
            Sign In
          </button>
        </div>
      )}

      {isLoggedIn() && (
        <button onClick={() => nav('/dashboard')} className="btn-lg">
          Go to Dashboard
        </button>
      )}
      
      <div style={{
        display:'grid', 
        gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', 
        gap:'1.5rem', 
        marginTop:'4rem',
        textAlign:'left'
      }}>
        <div className="card">
          <h4 style={{marginBottom:'0.5rem'}}>🏢 Properties</h4>
          <p style={{margin:0, fontSize:'0.875rem'}}>Add and manage multiple properties with ease</p>
        </div>
        <div className="card">
          <h4 style={{marginBottom:'0.5rem'}}>🚪 Units</h4>
          <p style={{margin:0, fontSize:'0.875rem'}}>Create units, set rents, and add amenities</p>
        </div>
        <div className="card">
          <h4 style={{marginBottom:'0.5rem'}}>👥 Tenants</h4>
          <p style={{margin:0, fontSize:'0.875rem'}}>Assign tenants and track occupancy</p>
        </div>
        <div className="card">
          <h4 style={{marginBottom:'0.5rem'}}>📄 Invoices</h4>
          <p style={{margin:0, fontSize:'0.875rem'}}>Auto-generated invoices for tenants</p>
        </div>
      </div>
    </div>
  );
}
