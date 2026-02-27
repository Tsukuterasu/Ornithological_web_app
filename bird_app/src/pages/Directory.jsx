import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSpeciesList, resolveImageUrl } from "../api.js";
import { formatStatusLabel, getStatusClass } from "../status.js";
import baseImage from "../../assets/base_fill.png";

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
          const resolved = resolveImageUrl(species.images?.[0]?.image_url);
          const imageUrl = resolved || baseImage;
          return (
            <Link
              key={species.species_id}
              to={`/species/${species.species_id}`}
              className="bird-card-link"
            >
              <article className="bird-card">
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
                  <div>
                    <span
                      className={`status-pill ${getStatusClass(
                        species.conservation_status
                      )}`}
                    >
                    {formatStatusLabel(species.conservation_status)}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default Directory;
