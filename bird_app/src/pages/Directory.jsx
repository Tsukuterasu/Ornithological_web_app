import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSpeciesList } from "../api.js";

const placeholderImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCf29KECLnc3hqFWdT0ru-LCqpLAxS0KDWJr5xO4jcfTEV6dbGSzih58wF8pblutQfL3si3X8lS1FFitmkirjdnid2Dnbk28U0oPkujBwTA6--9R8Hy6p4fiVYwVLt3C7cDxCg9dPRfhkyEmQk0dhcf-SJBd7Mkax4_bBUWMp3ZZajY_WYqJyw2QZOTO95ERmi6nXuRKhhqROoNl0eI4s2dX4wBTVTsgpEHsWuQkX0d4q6DKrv-Rq-AmZsFSFCIv56AfIOegTo0AAY",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC9sEHXsfTzwX4KscJc1FdiLq6Xgn1EuHLUpQigV-TDar60JOgV-8H8RNXbGcxPK_OESXT6MtGO8x2GMG9-evrIMnkjDS7pkm6UXg4ltlEuBZUMFoK7Xfkz6KsetdcmV1HUon6j0VhrAIo9x8mlsnZyZx8dkEwZ4sUfGX861-ezVDwOW9lNBaHP_d1VifbS7kMgGA7fJexvUuA0Epr-UtCm8gGnTqxh5fAJF6a7Mao18AZ5ojvgOQCxbDsS4yvsJSf0KLeqx5gmsoo",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAy6ImyfjgxW2yfGE_8vNYTOp1uyYmt450GrIVN_XtsOMPQlfPljp8AlgSZtqVYDq1NRe9WABhLLWrH9kOaJYx2WCqrTFuRFU6Vwo7ikXMNfEM5qZH4V1yjI1pxHRiLC7CB2awYah3PHNo7SU9jr1DQV5zBO5xbsJsqqMx4EoEaQwBqQBxwLw90oin9Ypt7XE9smmjepJxrr1lTciV92o8ac0KY8q5zgrEIZyYF2NsVx9LWvOhIOg4yDG557h0IhgO8l_EYPoD_KrA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCHuxTVZYtMCrE5zKd56lmgGNm2dsN78ahGVMxL1C0AyeYSt_6zFax1AZdwcl0TwoO-VEwfChXN9XR_ulLsVWRs2wyvNYjPWxnTTP8trJ0MmUMG3g4XJGhfA9SfLbidvO9IpbVy0wfJcH-0xOYs9MxoSmN7jXkZFer1_WLUDqU8BFFdK9D2IbwIayj5GxhC3YMzvmQ__APuzLMFDvKWzieRkMfMYsMTYkqRuMA7SETgjCmlt884WjcPSmjBRxmXGY2Q5YliqJFAQK4",
];

function Directory() {
  const [speciesList, setSpeciesList] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchSpeciesList()
      .then((data) => {
        if (active) {
          setSpeciesList(data);
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Unable to load species.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredList = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return speciesList;
    return speciesList.filter((species) => {
      return (
        species.common_name?.toLowerCase().includes(term) ||
        species.scientific_name?.toLowerCase().includes(term)
      );
    });
  }, [query, speciesList]);

  return (
    <section className="section-shell">
      <div>
        <h1 className="page-title">Bird Directory</h1>
        <p className="page-subtitle">
          Explore the catalog and open any species for a detailed profile.
        </p>
      </div>

      <div className="filters-bar">
        <input
          className="input"
          placeholder="Search by common or scientific name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className="badge">{filteredList.length} species</span>
      </div>

      {error && <div className="notice notice-error">{error}</div>}
      {loading && <div className="notice">Loading species...</div>}

      <div className="directory-grid">
        {filteredList.map((species, index) => {
          const imageUrl =
            species.images?.[0]?.image_url ||
            placeholderImages[index % placeholderImages.length];
          return (
            <article className="bird-card" key={species.species_id}>
              <div
                className="bird-card-image"
                style={{ backgroundImage: `url('${imageUrl}')` }}
              />
              <div className="bird-card-body">
                <div>
                  <h3 className="bird-card-title">{species.common_name}</h3>
                  <div className="bird-card-meta">
                    {species.scientific_name || "Scientific name pending"}
                  </div>
                </div>
                <div className="muted">
                  Status: {species.conservation_status || "Unknown"}
                </div>
                <Link
                  className="button button-secondary"
                  to={`/species/${species.species_id}`}
                >
                  View Profile
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default Directory;
