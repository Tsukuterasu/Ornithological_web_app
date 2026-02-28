import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchSpeciesList } from "../api.js";
import { formatYear } from "../date.js";
import { formatStatusLabel, getStatusClass } from "../status.js";

function SpeciesTable() {
  const [speciesList, setSpeciesList] = useState([]);
  const [sortBy, setSortBy] = useState("population_estimate");
  const [order, setOrder] = useState("desc");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchSpeciesList({ sort: sortBy, order })
      .then((data) => {
        if (active) {
          setSpeciesList(data);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load species.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sortBy, order]);


  const rows = speciesList.slice(0, 20);

  return (
    <section className="section-shell">
      <div>
        <h1 className="page-title">Birds Table</h1>
        <p className="page-subtitle">
          The first 20 species with sorting controls inspired by the mockup
          requirement.
        </p>
      </div>

      <div className="filters-bar">
        <label>
          Sort by
          <select
            className="select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="common_name">Common Name</option>
            <option value="population_estimate">Population</option>
            <option value="height_cm">Height</option>
            <option value="weight_g">Weight</option>
            <option value="longevity_years">Longevity</option>
            <option value="year_of_discovery">Year of Discovery</option>
            <option value="created_at">Entry creation date</option>
          </select>
        </label>
        <label>
          Order
          <select
            className="select"
            value={order}
            onChange={(event) => setOrder(event.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </div>

      {error && <div className="notice notice-error">{error}</div>}
      {loading && <div className="notice">Loading table...</div>}

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Common Name</th>
              <th>Scientific Name</th>
              <th>Status</th>
              <th>Population</th>
              <th>Height (cm)</th>
              <th>Weight (g)</th>
              <th>Longevity (years)</th>
              <th>Year of Discovery</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((species) => (
              <tr
                key={species.species_id}
                className="table-row-link"
                onClick={() => navigate(`/species/${species.species_id}`)}
                role="link"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    navigate(`/species/${species.species_id}`);
                  }
                }}
              >
                <td>{species.common_name}</td>
                <td className="muted">{species.scientific_name || "N/A"}</td>
                <td>
                  <span
                    className={`status-pill ${getStatusClass(
                      species.conservation_status
                    )}`}
                  >
                    {formatStatusLabel(species.conservation_status)}
                  </span>
                </td>
                <td>{species.population_estimate || "N/A"}</td>
                <td>
                  {species.height_cm !== null && species.height_cm !== undefined
                    ? species.height_cm
                    : "N/A"}
                </td>
                <td>
                  {species.weight_g !== null && species.weight_g !== undefined
                    ? species.weight_g
                    : "N/A"}
                </td>
                <td>
                  {species.longevity_years !== null &&
                  species.longevity_years !== undefined
                    ? species.longevity_years
                    : "N/A"}
                </td>
                <td>{formatYear(species.year_of_discovery)}</td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan="9">No species available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default SpeciesTable;
