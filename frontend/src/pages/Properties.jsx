import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import api from "../api";

const whyChooseCards = [
  {
    title: "Smart Property Discovery",
    text: "Find rental properties quickly using powerful filters designed to match tenants with the right homes.",
  },
  {
    title: "Easy Property Listings",
    text: "Property owners can list their properties in minutes with photos, pricing, and full property details.",
  },
  {
    title: "Complete Rental Management",
    text: "Track payments, maintenance requests, and tenant communication from one dashboard.",
  },
  {
    title: "Secure and Transparent",
    text: "RentForAll connects verified users and provides a reliable environment for rental transactions.",
  },
];

const flowSteps = [
  {
    step: "STEP 01",
    title: "THE SEARCH",
    subtitle: "Find your perfect match.",
    text: "Our smart filters connect tenants to their ideal space instantly.",
  },
  {
    step: "STEP 02",
    title: "THE LISTING",
    subtitle: "Showcase your property.",
    text: "Create professional listings that reach the right tenants quickly.",
  },
  {
    step: "STEP 03",
    title: "THE MANAGEMENT",
    subtitle: "Total control, zero stress.",
    text: "Manage rent payments, maintenance, and tenant communication in one place.",
  },
  {
    step: "STEP 04",
    title: "THE RESULT",
    subtitle: "Exceptional Renting, Open to All.",
    text: "A seamless experience for both tenants and property owners.",
  },
];

const ownerBenefits = [
  "Create professional property listings",
  "Manage rental payments easily",
  "Track tenant requests and communication",
  "Increase property visibility",
];

// Utility: non-mutating shuffle (Fisher-Yates)
function shuffleArray(arr) {
  const a = Array.isArray(arr) ? arr.slice() : [];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Properties() {
  const nav = useNavigate();
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [allUnitsData, setAllUnitsData] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [roomsFilter, setRoomsFilter] = useState("");
  const [bathroomsFilter, setBathroomsFilter] = useState("");
  const [balconyFilter, setBalconyFilter] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Pagination state for public property browsing
  const [currentPage, setCurrentPage] = useState(0);
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const firstWords = (text, count = 10) => {
    const words = String(text || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!words.length) return "No description available.";
    if (words.length <= count) return words.join(" ");
    return `${words.slice(0, count).join(" ")}...`;
  };

  const toUnitCard = (u) => {
    const placeholder = `https://via.placeholder.com/480x320?text=Unit+${u._id}`;
    let photo = placeholder;
    if (u.photos && u.photos.length) {
      const img = u.photos[0];
      photo =
        img && img.startsWith("/")
          ? `${api.defaults.baseURL}${img}`
          : img
            ? `${api.defaults.baseURL}/${img}`
            : placeholder;
    } else if (u.property?.images && u.property.images.length) {
      const img = u.property.images[0];
      photo =
        img && img.startsWith("/")
          ? `${api.defaults.baseURL}${img}`
          : img || placeholder;
    }

    return {
      id: u._id,
      photo,
      unitNumber: u.number || "-",
      descriptionPreview: firstWords(u.description, 10),
      fullAddress: [
        u.property?.address,
        u.property?.area,
        u.property?.city,
        u.property?.state,
      ]
        .filter(Boolean)
        .join(", "),
      raw: u,
    };
  };

  const availableStates = Array.from(
    new Set(
      allUnitsData.map((u) => (u.property?.state || "").trim()).filter(Boolean),
    ),
  ).sort();

  const availableCities = Array.from(
    new Set(
      allUnitsData
        .filter((u) => !state || u.property?.state === state)
        .map((u) => (u.property?.city || "").trim())
        .filter(Boolean),
    ),
  ).sort();

  const availableAreas = Array.from(
    new Set(
      allUnitsData
        .filter(
          (u) =>
            (!state || u.property?.state === state) &&
            (!city || u.property?.city === city),
        )
        .map((u) => (u.property?.area || "").trim())
        .filter(Boolean),
    ),
  ).sort();

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const amenityOptions = useMemo(() => {
    const values = allUnitsData.flatMap((u) => [
      u.amenity1,
      u.amenity2,
      u.amenity3,
      u.amenity4,
    ]);
    return Array.from(
      new Set(values.map((v) => String(v || "").trim()).filter(Boolean)),
    ).sort();
  }, [allUnitsData]);

  const roomOptions = useMemo(() => {
    return Array.from(
      new Set(
        allUnitsData
          .map((u) => Number(u.rooms))
          .filter((n) => Number.isFinite(n) && n >= 0),
      ),
    ).sort((a, b) => a - b);
  }, [allUnitsData]);

  const bathroomOptions = useMemo(() => {
    return Array.from(
      new Set(
        allUnitsData
          .map((u) => Number(u.bathrooms))
          .filter((n) => Number.isFinite(n) && n >= 0),
      ),
    ).sort((a, b) => a - b);
  }, [allUnitsData]);

  const filteredUnits = useMemo(() => {
    return allUnitsData.filter((u) => {
      const matchLocation =
        (!state || u.property?.state === state) &&
        (!city || u.property?.city === city) &&
        (!area || u.property?.area === area);

      const unitAmenities = [u.amenity1, u.amenity2, u.amenity3, u.amenity4]
        .map((a) =>
          String(a || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean);

      const matchAmenities =
        selectedAmenities.length === 0 ||
        selectedAmenities.every((selected) =>
          unitAmenities.includes(String(selected).toLowerCase()),
        );

      const matchRooms =
        !roomsFilter || Number(u.rooms) === Number(roomsFilter);
      const matchBathrooms =
        !bathroomsFilter || Number(u.bathrooms) === Number(bathroomsFilter);
      const matchBalcony =
        !balconyFilter ||
        String(u.balcony || "").toLowerCase() ===
          String(balconyFilter).toLowerCase();

      return (
        matchLocation &&
        matchAmenities &&
        matchRooms &&
        matchBathrooms &&
        matchBalcony
      );
    });
  }, [
    allUnitsData,
    state,
    city,
    area,
    selectedAmenities,
    roomsFilter,
    bathroomsFilter,
    balconyFilter,
  ]);

  useEffect(() => {
    const allItems = filteredUnits.map(toUnitCard);
    setUnits(shuffleArray(allItems));
    setCurrentPage(0);
  }, [filteredUnits]);

  const handleReset = () => {
    setState("");
    setCity("");
    setArea("");
    setSelectedAmenities([]);
    setRoomsFilter("");
    setBathroomsFilter("");    setBalconyFilter("");
    setUnits(shuffleArray(allUnitsData.map(toUnitCard)));
    setCurrentPage(0);
  };

  useEffect(() => {
    const fetchUnits = async () => {
      setLoadingUnits(true);
      try {
        const unitsRes = await api.get("/unit/public");
        const units = unitsRes.data || [];
        setAllUnitsData(units);
        const allItems = units.map(toUnitCard);

        if (allItems.length) setUnits(shuffleArray(allItems));
        else setUnits([]);
      } catch (err) {
        console.error("Failed to fetch properties:", err);
      } finally {
        setLoadingUnits(false);
      }
    };

    fetchUnits();
  }, []);

  const renderFilters = (extraClass = "", mobileControlled = false) => {
    const hiddenClass =
      mobileControlled && !mobileFiltersOpen
        ? "property-filter-mobile-hidden"
        : "";
    return (
      <aside
        className={`property-filter-panel property-filter-full ${extraClass} ${hiddenClass}`.trim()}
      >
        <h3>Filters</h3>
        <div className="property-filter-group">
          <label>Amenities</label>
          <div className="property-filter-amenities">
            {amenityOptions.length === 0 ? (
              <div className="property-filter-empty">No amenities found</div>
            ) : (
              amenityOptions.map((amenity) => (
                <label key={amenity} className="property-filter-check">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={(e) => {
                      setSelectedAmenities((prev) =>
                        e.target.checked
                          ? [...prev, amenity]
                          : prev.filter((a) => a !== amenity),
                      );
                    }}
                  />
                  <span>{amenity}</span>
                </label>
              ))
            )}
          </div>
        </div>
        <div className="property-filter-group">
          <label>Bedrooms</label>
          <select
            value={roomsFilter}
            onChange={(e) => setRoomsFilter(e.target.value)}
          >
            <option value="">Any</option>
            {roomOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="property-filter-group">
          <label>Bathrooms</label>
          <select
            value={bathroomsFilter}
            onChange={(e) => setBathroomsFilter(e.target.value)}
          >
            <option value="">Any</option>
            {bathroomOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="property-filter-group">
          <label>Balcony</label>
          <select
            value={balconyFilter}
            onChange={(e) => setBalconyFilter(e.target.value)}
          >
            <option value="">Any</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <button
          type="button"
          className="property-filter-reset"
          onClick={handleReset}
        >
          Clear Filters
        </button>
      </aside>
    );
  };

  const isGuest = !localStorage.getItem("token");
  return (
    <div className={isGuest ? "properties-guest-layout" : undefined}>
      <div className="page-container">
        <section className="home-hero">
          <div className="home-hero__copy">
            <p className="home-kicker">RentForAll</p>
            <h1 className="home-hero__title">
              Find Your Perfect Rental Property Without the Stress
            </h1>
            <p className="home-hero__subtitle">
              RentForAll connects tenants and property owners through a smart
              platform that makes searching, listing, and managing rental
              properties simple and transparent.
            </p>
          </div>
          <div className="home-hero__contact">
            <span className="home-hero__contact-label">Talk to us</span>
            <a href="tel:+919039252504" className="home-hero__contact-link">
              +91 90392 52504
            </a>
          </div>
        </section>

        <div className="searchSection searchSection--home">
          <p className="p1">Featured Search: Discover Rentals That Fit You</p>
          <p className="p2">
            Use smart filters to compare homes by location, amenities, and
            layout in just a few clicks.
          </p>
          <div className="search-with-filter">
            {isGuest && (
              <div className="search-with-filter__desktop">
                {renderFilters("property-filter-desktop")}
              </div>
            )}
            <form
              className="searchBox search-with-filter__form"
              onSubmit={handleSearch}
            >
              <div>
                <label>
                  <span>Select State</span>
                  <select
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      setCity("");
                      setArea("");
                    }}
                    disabled={!availableStates.length}
                  >
                    <option value="">-- State --</option>
                    {availableStates.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Select City</span>
                  <select
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setArea("");
                    }}
                    disabled={!availableCities.length}
                  >
                    <option value="">-- City --</option>
                    {availableCities.map((ci) => (
                      <option key={ci} value={ci}>
                        {ci}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Select Area</span>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    disabled={!availableAreas.length}
                  >
                    <option value="">-- Area --</option>
                    {availableAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <button type="submit" className="search-action-btn">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 21l-4.35-4.35"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="11"
                      cy="11"
                      r="6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Search</span>
                </button>

                <button
                  type="button"
                  className="search-action-btn"
                  onClick={handleReset}
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
          {isGuest && (
            <>
              <button
                type="button"
                className="mobile-filter-toggle"
                onClick={() => setMobileFiltersOpen((prev) => !prev)}
              >
                {mobileFiltersOpen ? "Hide Filters" : "Show Filters"}
              </button>
              {renderFilters("property-filter-inline-mobile", true)}
            </>
          )}
        </div>
        <div>
          <p className="h4" >Find Your Perfect Property</p>
        </div>
        <div className="propGrid">
          {/** Units grid with pagination - show 8 per page */}
          {(() => {
            const itemsPerPage = 8;
            const unitsList = units;
            if (loadingUnits) return <div>Loading units...</div>;

            if (!unitsList.length) {
              return <div className="no-properties">No units available</div>;
            }

            const totalPages = Math.ceil(unitsList.length / itemsPerPage);
            const start = currentPage * itemsPerPage;
            const pageItems = unitsList.slice(start, start + itemsPerPage);

            return (
              <>
                <div className="propGrid__cards">
                  {pageItems.map((u) => (
                    <div
                      className="propCard"
                      key={u.id}
                      onClick={() => nav(`/unit/${u.id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="propCard__imgWrap">
                        <img
                          src={u.photo}
                          alt="unit"
                          className="propCard__img"
                        />
                      </div>
                      <div className="propCard__body">
                        <div className="propCard__unitNo">
                          Unit {u.unitNumber}
                        </div>
                        <div className="propCard__desc">
                          {u.descriptionPreview}
                        </div>
                        <hr className="propCard__divider" />
                        <div className="propCard__addressRow">
                          <span
                            className="propCard__locationIcon"
                            aria-hidden="true"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <circle
                                cx="12"
                                cy="10"
                                r="2.5"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                            </svg>
                          </span>
                          <span>
                            {u.fullAddress || "Address not available"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="propGrid__pager">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="pagerBtn"
                  >
                    Previous
                  </button>
                  <div className="pagerInfo">
                    {currentPage + 1} / {Math.max(1, totalPages)}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={currentPage >= totalPages - 1}
                    className="pagerBtn"
                  >
                    Next
                  </button>
                </div>
              </>
            );
          })()}
        </div>

        <section className="home-section home-section--why">
          <div className="home-section__head">
            <h2 className="home-section__title home-section__eyebrow">Why Choose RentForAll</h2>
          </div>
          <div className="home-card-grid">
            {whyChooseCards.map((card) => (
              <article key={card.title} className="home-info-card">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section home-section--flow">
          <div className="home-section__head">
            <h2 className="home-section__title home-section__eyebrow">
              The RentForAll Flow: How We Work
            </h2>
          </div>
          <div className="home-flow-grid">
            {flowSteps.map((item) => (
              <article key={item.step} className="home-flow-card">
                <p className="home-flow-card__step">{item.step}</p>
                <h3>{item.title}</h3>
                <h4>{item.subtitle}</h4>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-owner-cta">
          <div className="home-owner-cta__content">
            <h2 className="home-section__title home-section__eyebrow">
              List Your Property and Reach More Tenants
            </h2>
            <p className="home-owner-cta__text">
              RentForAll helps property owners showcase their rental spaces to a
              wider audience and manage tenants efficiently.
            </p>
            <ul className="home-owner-cta__list">
              {ownerBenefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
            <div className="home-owner-cta__actions">
              <button
                type="button"
                className="home-owner-cta__button"
                onClick={() => nav("/login")}
              >
                List Your Property
              </button>
              <p className="home-owner-cta__support">
                Need help getting started? Call{" "}
                <a href="tel:+919039252504">+91 90392 52504</a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
