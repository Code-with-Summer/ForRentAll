import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api";

// Utility: non-mutating shuffle (Fisher-Yates)
function shuffleArray(arr) {
  const a = Array.isArray(arr) ? arr.slice() : [];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Properties(){
  const nav = useNavigate();
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const locations = {
    India: {
      Maharashtra: ["Mumbai", "Pune"],
      Karnataka: ["Bengaluru", "Mysore"]
    },
    USA: {
      California: ["Los Angeles", "San Francisco"],
      Texas: ["Houston", "Austin"]
    }
  };

  const availableStates = country ? Object.keys(locations[country] || {}) : [];
  const availableCities = country && state ? (locations[country][state] || []) : [];

  // pagination state and sample data (replace with API data as needed)
  const [currentPage, setCurrentPage] = useState(0);

  const sampleUnits = Array.from({ length: 24 }).map((_, i) => ({
    id: i + 1,
    photo: `https://via.placeholder.com/480x320?text=Unit+${i + 1}`,
    address: `Unit ${i + 1}, Example Street ${i + 10}, City`,
    ownerName: `Owner ${i + 1}`,
    ownerPhone: `+1-555-010${String(i).padStart(2, "0")}`,
  }));

  const [units, setUnits] = useState(() => shuffleArray(sampleUnits));
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [modalUnit, setModalUnit] = useState(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    // implement actual search behavior as needed
    console.log("Search", { country, state, city });
    // example: navigate to results page with query params
    // nav(`/property/all?country=${country}&state=${state}&city=${city}`);
  };

  const handleReset = () => {
    setCountry("");
    setState("");
    setCity("");
  };
  const isLoggedIn = () => {
    const t = localStorage.getItem("token");
    return !!t && t !== "undefined" && t !== "null";
  };

  useEffect(() => {
    const fetchUnits = async () => {
      // Load public properties and display them (no auth required)
      setLoadingUnits(true);
      try {
        const propsRes = await api.get("/property");
        const props = propsRes.data || [];
        const allItems = props.map(p => {
          const placeholder = `https://via.placeholder.com/480x320?text=Property+${p._id}`;
          let photo = placeholder;
          if (p.images && p.images.length) {
            const img = p.images[0];
            photo = img && img.startsWith("/") ? `${api.defaults.baseURL}${img}` : (img || placeholder);
          }

          return {
            id: p._id,
            photo,
            address: p.address || p.name || `Property ${p._id}`,
            ownerName: p.owner?.name || p.ownerName || "Owner",
            ownerPhone: p.owner?.phone || "",
            ownerEmail: p.owner?.email || "",
            raw: p
          };
        });

        if (allItems.length) setUnits(shuffleArray(allItems));
      } catch (err) {
        console.error("Failed to fetch properties:", err);
      } finally {
        setLoadingUnits(false);
      }
    };

    fetchUnits();
  }, []);

  const openContact = (u) => {
    // If owner has email, open in-modal form; otherwise fall back to tel
    if (u.ownerEmail) {
      setModalUnit(u);
      setContactName("");
      setContactEmail("");
      setContactMessage(`Hi ${u.ownerName || ""},\n\nI am interested in ${u.address || "this unit"}.`);
      setShowContactModal(true);
    } else if (u.ownerPhone) {
      window.location.href = `tel:${u.ownerPhone}`;
    } else {
      alert("No contact information available for this owner.");
    }
  };

  const submitContact = (e) => {
    e.preventDefault();
    if (!modalUnit) return;
    const to = modalUnit.ownerEmail;
    const subject = encodeURIComponent(`Inquiry about ${modalUnit.address}`);
    const body = encodeURIComponent(`${contactMessage}\n\nFrom: ${contactName} <${contactEmail}>`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    setShowContactModal(false);
  };

  return (
    <div className="page-container">
      <div className="searchSection" style={{marginBottom:'2rem'}}>
        <p className="p1">
          Explore Available Properties Instantly
        </p>
        <div style={{marginTop:8}}>
          <Link to="/blogs">Read our Blog</Link>
        </div>
        <p className="p2">
          Your complete property overview with photos, amenities, and key details.
        </p>
          <form className="searchBox" onSubmit={handleSearch}>
            <div >
              <label>
                <span >Select Country</span>
                <select value={country} onChange={(e)=>{setCountry(e.target.value); setState(''); setCity('')}}>
                  <option value="">-- Country --</option>
                  {Object.keys(locations).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label >
                <span >Select State</span>
                <select value={state} onChange={(e)=>{setState(e.target.value); setCity('')}} disabled={!availableStates.length}>
                  <option value="">-- State --</option>
                  {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>

              <label >
                <span >Select City</span>
                <select value={city} onChange={(e)=>setCity(e.target.value)}  disabled={!availableCities.length}>
                  <option value="">-- City --</option>
                  {availableCities.map(ci => <option key={ci} value={ci}>{ci}</option>)}
                </select>
              </label>
            </div>

            <div>
              <button type="submit" style={{cursor:'pointer'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>Search</span>
              </button>

              <button type="button" onClick={handleReset} style= {{cursor:'pointer'}}>Reset</button>
            </div>
          </form>
      </div>

      <div>
        <p className="h4">
          Find Your Perfect Property
        </p>
      </div>
      <div className="propGrid">
        {/** Units grid with pagination - show 8 per page */}
        {(() => {
          const itemsPerPage = 8;
          const unitsList = units;
          if (loadingUnits) return <div>Loading units...</div>;
          const totalPages = Math.ceil(unitsList.length / itemsPerPage);
          const start = currentPage * itemsPerPage;
          const pageItems = unitsList.slice(start, start + itemsPerPage);

          return (
            <>
              <div className="propGrid__cards">
                {pageItems.map((u) => (
                  <div className="propCard" key={u.id}>
                    <div className="propCard__imgWrap">
                      <img src={u.photo} alt="unit" className="propCard__img" />
                    </div>
                    <div className="propCard__body">
                      <div className="propCard__address">{u.address}</div>
                      <div className="propCard__owner">Owner: {u.ownerName}</div>
                      <div className="propCard__phone">{u.ownerPhone}</div>
                    </div>
                      <div className="propCard__footer">
                      <button className="propCard__contact" onClick={() => openContact(u)}>
                        Contact Owner
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="propGrid__pager">
                <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} className="pagerBtn">Previous</button>
                <div className="pagerInfo">{currentPage + 1} / {Math.max(1, totalPages)}</div>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="pagerBtn">Next</button>
              </div>
            </>
          );
        })()}
        </div>

        <footer className="site-footer">
          <div className="site-footer__inner">
            <div className="site-footer__col">
              <ul>
                <li><a href="/tos">Terms of Service (TOS)</a></li>
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/legal">Legal & Info</a></li>
              </ul>
            </div>

            <div className="site-footer__col">
              <h4>Company</h4>
              <p>ForRentAll</p>
              <p>123 Main Street, Suite 100</p>
              <p>City, State ZIP</p>
            </div>

            <div className="site-footer__col">
              <h4>Contact</h4>
              <p>Email: <a href="mailto:contact@forrentall.example">contact@forrentall.example</a></p>
              <p>Phone: <a href="tel:+15550123456">+1 (555) 012-3456</a></p>
            </div>
          </div>

          <div className="site-footer__bottom">
            <small>© {new Date().getFullYear()} ForRentAll. All rights reserved.</small>
          </div>
        </footer>


      {showContactModal && modalUnit && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Contact {modalUnit.ownerName}</h3>
              <button className="modal-close" type="button" onClick={() => setShowContactModal(false)}>&times;</button>
            </div>
            <form onSubmit={submitContact}>
              <div className="form-row" style={{display:'block'}}>
                <label style={{display:'block', marginBottom:'.5rem'}}>
                  Your name
                  <input value={contactName} onChange={e=>setContactName(e.target.value)} required />
                </label>
                <label style={{display:'block', marginBottom:'.5rem'}}>
                  Your email
                  <input type="email" value={contactEmail} onChange={e=>setContactEmail(e.target.value)} required />
                </label>
                <label style={{display:'block', marginBottom:'.5rem'}}>
                  Message
                  <textarea value={contactMessage} onChange={e=>setContactMessage(e.target.value)} rows={6} />
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={()=>setShowContactModal(false)}>Cancel</button>
                <button type="submit">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
