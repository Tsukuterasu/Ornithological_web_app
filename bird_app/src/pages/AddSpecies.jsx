import { useState } from "react";
import { createSpecies, updateSpecies } from "../api.js";

// Intit form state fields
const initialState = {
  common_name: "",
  scientific_name: "",
  conservation_status: "",
  population_estimate: "",
  year_of_discovery: "",
  summary: "",
  taxonomy_kingdom: "",
  taxonomy_phylum: "",
  taxonomy_class: "",
  taxonomy_order: "",
  taxonomy_suborder: "",
  taxonomy_family: "",
  taxonomy_genus: "",
  author_name: "",
  author_email: "",
  author_role: "",
  image_url: "",
  image_alt_text: "",
};

function AddSpecies() {
  const [form, setForm] = useState(initialState);
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [busy, setBusy] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    setBusy(true);

    try {
      const taxonomy = {
        taxonomy_kingdom: form.taxonomy_kingdom,
        taxonomy_phylum: form.taxonomy_phylum,
        taxonomy_class: form.taxonomy_class,
        taxonomy_order: form.taxonomy_order,
        taxonomy_suborder: form.taxonomy_suborder,
        taxonomy_family: form.taxonomy_family,
        taxonomy_genus: form.taxonomy_genus,
      };

      const author = {
        author_name: form.author_name,
        author_email: form.author_email,
        author_role: form.author_role,
      };

      const payload = {
        common_name: form.common_name,
        scientific_name: form.scientific_name,
        conservation_status: form.conservation_status,
        population_estimate: form.population_estimate,
        year_of_discovery: form.year_of_discovery,
        summary: form.summary,
        image_url: form.image_url,
        image_alt_text: form.image_alt_text,
      };

      if (Object.values(taxonomy).some((value) => value)) {
        payload.taxonomy = taxonomy;
      }

      if (Object.values(author).some((value) => value)) {
        payload.author = author;
      }

      if (imageFile) {
        delete payload.image_url;
      }

      const created = await createSpecies(payload, null);

      if (imageFile) {
        await updateSpecies(
          created.species_id,
          { image_alt_text: form.image_alt_text },
          imageFile
        );
      }

      setStatus({
        type: "success",
        message: "Species created successfully.",
      });
      setForm(initialState);
      setImageFile(null);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Unable to create species.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section-shell">
      <div>
        <h1 className="page-title">Add New Species</h1>
        <p className="page-subtitle">
          Use the mockup-inspired form to add a new bird species to the
          database.
        </p>
      </div>

      <div className="card">
        <div className="card-section">
          <div className="grid grid-2">
            <div>
              <div className="badge">Step 1 of 3</div>
              <h2>Identification Details</h2>
              <p className="muted">
                Basic information, conservation status, and discovery date.
              </p>
            </div>
            <div>
              <div className="notice">
                Tip: you can upload an image now, or use the dedicated image
                page later.
              </div>
            </div>
          </div>
        </div>
        <form className="card-section" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Common Name
              <input
                className="input"
                name="common_name"
                placeholder="e.g. Mountain Bluebird"
                value={form.common_name}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Scientific Name
              <input
                className="input"
                name="scientific_name"
                placeholder="e.g. Sialia currucoides"
                value={form.scientific_name}
                onChange={handleChange}
              />
            </label>
            <label>
              Conservation Status
              <select
                className="select"
                name="conservation_status"
                value={form.conservation_status}
                onChange={handleChange}
              >
                <option value="">Select a status</option>
                <option>Least Concern</option>
                <option>Near Threatened</option>
                <option>Vulnerable</option>
                <option>Endangered</option>
                <option>Critically Endangered</option>
                <option>Extinct in the Wild</option>
                <option>Extinct</option>
              </select>
            </label>
            <label>
              Population Estimate
              <input
                className="input"
                name="population_estimate"
                placeholder="e.g. 1500000"
                value={form.population_estimate}
                onChange={handleChange}
              />
            </label>
            <label>
              Year of Discovery
              <input
                className="input"
                name="year_of_discovery"
                placeholder="e.g. 1825"
                value={form.year_of_discovery}
                onChange={handleChange}
              />
            </label>
          </div>

          <label style={{ display: "block", marginTop: "16px" }}>
            Summary
            <textarea
              className="textarea"
              name="summary"
              rows="4"
              placeholder="Short description and key facts."
              value={form.summary}
              onChange={handleChange}
            />
          </label>

          <div className="card" style={{ marginTop: "20px" }}>
            <div className="card-section">
              <h3>Taxonomy</h3>
              <div className="form-row">
                <label>
                  Kingdom
                  <input
                    className="input"
                    name="taxonomy_kingdom"
                    value={form.taxonomy_kingdom}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Phylum
                  <input
                    className="input"
                    name="taxonomy_phylum"
                    value={form.taxonomy_phylum}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Class
                  <input
                    className="input"
                    name="taxonomy_class"
                    value={form.taxonomy_class}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Order
                  <input
                    className="input"
                    name="taxonomy_order"
                    value={form.taxonomy_order}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Suborder
                  <input
                    className="input"
                    name="taxonomy_suborder"
                    value={form.taxonomy_suborder}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Family
                  <input
                    className="input"
                    name="taxonomy_family"
                    value={form.taxonomy_family}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Genus
                  <input
                    className="input"
                    name="taxonomy_genus"
                    value={form.taxonomy_genus}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "20px" }}>
            <div className="card-section">
              <h3>Media</h3>
              <div className="form-row">
                <label>
                  Image URL
                  <input
                    className="input"
                    name="image_url"
                    placeholder="https://example.com/bird.jpg"
                    value={form.image_url}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Image Alt Text
                  <input
                    className="input"
                    name="image_alt_text"
                    placeholder="Describe the image"
                    value={form.image_alt_text}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Upload Image
                  <input
                    className="input"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "20px" }}>
            <div className="card-section">
              <h3>Author (optional)</h3>
              <div className="form-row">
                <label>
                  Name
                  <input
                    className="input"
                    name="author_name"
                    value={form.author_name}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Email
                  <input
                    className="input"
                    type="email"
                    name="author_email"
                    value={form.author_email}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Role
                  <input
                    className="input"
                    name="author_role"
                    value={form.author_role}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>
          </div>

          {status.message && (
            <p
              className={
                status.type === "error" ? "notice notice-error" : "notice"
              }
            >
              {status.message}
            </p>
          )}

          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button className="button button-primary" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Create Species"}
            </button>
            <button
              className="button button-outline"
              type="button"
              onClick={() => {
                setForm(initialState);
                setImageFile(null);
                setStatus({ type: "", message: "" });
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default AddSpecies;
