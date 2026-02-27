import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchSpeciesList } from "../api.js";

function SpeciesTable() {
  const [speciesList, setSpeciesList] = useState([]);
  const [sortBy, setSortBy] = useState("population_estimate");
  const [order, setOrder] = useState("desc");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
            <option value="population_estimate">Population</option>
            <option value="year_of_discovery">Year of Discovery</option>
            <option value="created_at">Created Date</option>
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
              <th>Year of Discovery</th>
              <th>Profile</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((species) => (
              <tr key={species.species_id}>
                <td>{species.common_name}</td>
                <td className="muted">{species.scientific_name || "N/A"}</td>
                <td>
                  <span className="status-pill">
                    {species.conservation_status || "Unknown"}
                  </span>
                </td>
                <td>{species.population_estimate || "N/A"}</td>
                <td>{species.year_of_discovery || "N/A"}</td>
                <td>
                  <Link
                    className="button button-outline"
                    to={`/species/${species.species_id}`}
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan="6">No species available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default SpeciesTable;
