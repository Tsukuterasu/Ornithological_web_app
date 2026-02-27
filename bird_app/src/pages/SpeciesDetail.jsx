import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchSpeciesById } from "../api.js";

function SpeciesDetail() {
  const { id } = useParams();
  const [species, setSpecies] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchSpeciesById(id)
      .then((data) => {
        if (active) {
          setSpecies(data);
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Unable to load species details.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <section className="section-shell">
        <div className="notice">Loading species profile...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section-shell">
        <div className="notice notice-error">{error}</div>
        <Link className="button button-secondary" to="/">
          Back to directory
        </Link>
      </section>
    );
  }

  if (!species) {
    return null;
  }

  const heroImage =
    species.images?.[0]?.image_url ||
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCEySsTeePZwWDHseTK_KlgDTdUjdGPPHbO-zGhmAM970JxfudNSr1YGv4Had6P8UmefB0u8n-6VPjdpP5GyNAw-30sghHc7x8Hn6eyNRmW_-PHDpUJyWn_pq70DUbS-EDeKc7ScoPNuhQrMfsX09jYPiyx2NRykRCrPuGCL6FVUbqdiQpPTtIX-x125zF0_drgE5ZA8ATJHTIz5J8X7vQ4S9y1mVSLxmlC6CFTybdzeXQhnpryLZEmF_oyaN7l9EaYlytTBt2KiO0";

  return (
    <section className="section-shell">
      <div className="hero">
        <div
          className="hero-image"
          style={{ backgroundImage: `url('${heroImage}')` }}
        />
        <div className="hero-content">
          <span className="badge">{species.conservation_status || "Status"}</span>
          <h1 className="hero-title">{species.common_name}</h1>
          <p className="hero-subtitle">{species.scientific_name}</p>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-column">
          <div className="info-grid">
            <div className="info-card">
              <div className="muted">Population</div>
              <strong>{species.population_estimate || "N/A"}</strong>
            </div>
            <div className="info-card">
              <div className="muted">Discovery</div>
              <strong>{species.year_of_discovery || "N/A"}</strong>
            </div>
            <div className="info-card">
              <div className="muted">Created</div>
              <strong>{species.created_at || "N/A"}</strong>
            </div>
          </div>

          <div className="detail-section" style={{ marginTop: "20px" }}>
            <h2>Summary</h2>
            <p className="muted">
              {species.summary || "No summary provided yet."}
            </p>
          </div>

          <div className="detail-section">
            <h2>Gallery</h2>
            <div className="directory-grid">
              {(species.images || []).map((image) => (
                <div
                  key={image.image_id}
                  className="bird-card-image"
                  style={{
                    backgroundImage: `url('${image.image_url}')`,
                    borderRadius: "14px",
                    height: "160px",
                  }}
                  title={image.image_alt_text}
                />
              ))}
              {(!species.images || species.images.length === 0) && (
                <div className="notice">No images yet for this species.</div>
              )}
            </div>
          </div>
        </div>

        <aside className="sidebar">
          <div className="sidebar-card">
            <h4>Taxonomy</h4>
            {species.taxonomy ? (
              <ul className="muted" style={{ paddingLeft: "16px" }}>
                <li>Kingdom: {species.taxonomy.taxonomy_kingdom || "N/A"}</li>
                <li>Phylum: {species.taxonomy.taxonomy_phylum || "N/A"}</li>
                <li>Class: {species.taxonomy.taxonomy_class || "N/A"}</li>
                <li>Order: {species.taxonomy.taxonomy_order || "N/A"}</li>
                <li>Suborder: {species.taxonomy.taxonomy_suborder || "N/A"}</li>
                <li>Family: {species.taxonomy.taxonomy_family || "N/A"}</li>
                <li>Genus: {species.taxonomy.taxonomy_genus || "N/A"}</li>
              </ul>
            ) : (
              <p className="muted">No taxonomy stored for this species.</p>
            )}
          </div>
          <div className="detail-section">
            <h3>Actions</h3>
            <Link className="button button-primary" to="/add-image">
              Add an image
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default SpeciesDetail;
