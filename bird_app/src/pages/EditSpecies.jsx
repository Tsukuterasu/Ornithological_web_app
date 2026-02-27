import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchSpeciesById, updateSpecies } from "../api.js";

const initialState = {
  common_name: "",
  scientific_name: "",
  conservation_status: "",
  population_estimate: "",
  height_cm: "",
  weight_g: "",
  longevity_years: "",
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

function EditSpecies() {
  const { id } = useParams();
  const [form, setForm] = useState(initialState);
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalImageUrl, setOriginalImageUrl] = useState("");
  const [originalAltText, setOriginalAltText] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchSpeciesById(id)
      .then((data) => {
        if (!active) return;
        const firstImage = data.images?.[0];
        const imageAuthor = firstImage?.author || {};
        const taxonomy = data.taxonomy || {};

        setForm({
          common_name: data.common_name || "",
          scientific_name: data.scientific_name || "",
          conservation_status: data.conservation_status || "",
          population_estimate: data.population_estimate ?? "",
          height_cm: data.height_cm ?? "",
          weight_g: data.weight_g ?? "",
          longevity_years: data.longevity_years ?? "",
          year_of_discovery: data.year_of_discovery
            ? String(data.year_of_discovery).slice(0, 4)
            : "",
          summary: data.summary || "",
          taxonomy_kingdom: taxonomy.taxonomy_kingdom || "",
          taxonomy_phylum: taxonomy.taxonomy_phylum || "",
          taxonomy_class: taxonomy.taxonomy_class || "",
          taxonomy_order: taxonomy.taxonomy_order || "",
          taxonomy_suborder: taxonomy.taxonomy_suborder || "",
          taxonomy_family: taxonomy.taxonomy_family || "",
          taxonomy_genus: taxonomy.taxonomy_genus || "",
          author_name: imageAuthor.author_name || "",
          author_email: imageAuthor.author_email || "",
          author_role: imageAuthor.author_role || "",
          image_url: firstImage?.image_url || "",
          image_alt_text: firstImage?.image_alt_text || "",
        });
        setOriginalImageUrl(firstImage?.image_url || "");
        setOriginalAltText(firstImage?.image_alt_text || "");
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setStatus({
            type: "error",
            message: "Unable to load species for editing.",
          });
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    setBusy(true);

    try {
      const requiredFields = [
        "common_name",
        "scientific_name",
        "conservation_status",
        "population_estimate",
        "height_cm",
        "weight_g",
        "longevity_years",
        "year_of_discovery",
        "summary",
        "taxonomy_kingdom",
        "taxonomy_phylum",
        "taxonomy_class",
        "taxonomy_order",
        "taxonomy_suborder",
        "taxonomy_family",
        "taxonomy_genus",
        "author_name",
        "author_email",
        "author_role",
        "image_alt_text",
      ];

      const missingField = requiredFields.find(
        (field) => !String(form[field]).trim()
      );
      if (missingField) {
        setStatus({
          type: "error",
          message: "All fields are required.",
        });
        setBusy(false);
        return;
      }

      if (!imageFile && !form.image_url.trim()) {
        setStatus({
          type: "error",
          message: "Provide an image URL or upload a file.",
        });
        setBusy(false);
        return;
      }

      const popValue = Number(form.population_estimate);
      if (!Number.isInteger(popValue)) {
        setStatus({
          type: "error",
          message: "Population estimate must be an integer.",
        });
        setBusy(false);
        return;
      }

      const yearValue = Number(form.year_of_discovery);
      if (!Number.isInteger(yearValue)) {
        setStatus({
          type: "error",
          message: "Year of discovery must be an integer.",
        });
        setBusy(false);
        return;
      }

      const heightValue = Number(form.height_cm);
      if (!Number.isFinite(heightValue)) {
        setStatus({
          type: "error",
          message: "Height must be a number.",
        });
        setBusy(false);
        return;
      }

      const weightValue = Number(form.weight_g);
      if (!Number.isFinite(weightValue)) {
        setStatus({
          type: "error",
          message: "Weight must be a number.",
        });
        setBusy(false);
        return;
      }

      const longevityValue = Number(form.longevity_years);
      if (!Number.isInteger(longevityValue)) {
        setStatus({
          type: "error",
          message: "Longevity must be an integer.",
        });
        setBusy(false);
        return;
      }

      const taxonomy = {
        taxonomy_kingdom: form.taxonomy_kingdom.trim(),
        taxonomy_phylum: form.taxonomy_phylum.trim(),
        taxonomy_class: form.taxonomy_class.trim(),
        taxonomy_order: form.taxonomy_order.trim(),
        taxonomy_suborder: form.taxonomy_suborder.trim(),
        taxonomy_family: form.taxonomy_family.trim(),
        taxonomy_genus: form.taxonomy_genus.trim(),
      };

      const author = {
        author_name: form.author_name.trim(),
        author_email: form.author_email.trim(),
        author_role: form.author_role.trim(),
      };

      const payload = {
        common_name: form.common_name.trim(),
        scientific_name: form.scientific_name.trim(),
        conservation_status: form.conservation_status.trim(),
        population_estimate: popValue,
        height_cm: heightValue,
        weight_g: weightValue,
        longevity_years: longevityValue,
        year_of_discovery: String(yearValue),
        summary: form.summary.trim(),
        taxonomy,
        author,
      };

      const imageUrlChanged = form.image_url.trim() !== originalImageUrl;
      const altTextChanged = form.image_alt_text.trim() !== originalAltText;
      if (imageFile) {
        payload.image_alt_text = form.image_alt_text.trim();
      } else if (imageUrlChanged || altTextChanged) {
        payload.image_url = form.image_url.trim();
        payload.image_alt_text = form.image_alt_text.trim();
      }

      await updateSpecies(id, payload, imageFile);
      setOriginalImageUrl(form.image_url.trim());
      setOriginalAltText(form.image_alt_text.trim());
      setImageFile(null);
      setStatus({
        type: "success",
        message: "Species updated successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Unable to update species.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <section className="section-shell">
        <div className="notice">Loading species...</div>
      </section>
    );
  }

  return (
    <section className="section-shell">
      <div>
        <h1 className="page-title">Edit Species</h1>
        <p className="page-subtitle">
          Update all fields below. The form is prefilled with existing data.
        </p>
      </div>

      <div className="card">
        <form className="card-section" onSubmit={handleSubmit}>
          <div className="notice" style={{ marginBottom: "16px" }}>
            All fields are required. Provide a new image URL or upload if you
            want to change the image.
          </div>

          <div className="card">
            <div className="card-section">
              <h3>Basic Information</h3>
              <div className="form-row">
                <label>
                  Common Name
                  <input
                    className="input"
                    name="common_name"
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
                    value={form.scientific_name}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label>
                  Conservation Status
                  <select
                    className="select"
                    name="conservation_status"
                    value={form.conservation_status}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a status</option>
                    <option value="least_concern">Least Concern</option>
                    <option value="near_threatened">Near Threatened</option>
                    <option value="vulnerable">Vulnerable</option>
                    <option value="endangered">Endangered</option>
                    <option value="critically_endangered">
                      Critically Endangered
                    </option>
                    <option value="extinct_in_the_wild">
                      Extinct in the Wild
                    </option>
                    <option value="extinct">Extinct</option>
                  </select>
                </label>
                <label>
                  Population Estimate
                  <input
                    className="input"
                    name="population_estimate"
                    value={form.population_estimate}
                    onChange={handleChange}
                    type="number"
                    step="1"
                    required
                  />
                </label>
                <label>
                  Height (cm)
                  <input
                    className="input"
                    name="height_cm"
                    value={form.height_cm}
                    onChange={handleChange}
                    type="number"
                    step="0.1"
                    required
                  />
                </label>
                <label>
                  Weight (g)
                  <input
                    className="input"
                    name="weight_g"
                    value={form.weight_g}
                    onChange={handleChange}
                    type="number"
                    step="0.1"
                    required
                  />
                </label>
                <label>
                  Longevity (years)
                  <input
                    className="input"
                    name="longevity_years"
                    value={form.longevity_years}
                    onChange={handleChange}
                    type="number"
                    step="1"
                    required
                  />
                </label>
                <label>
                  Year of Discovery
                  <input
                    className="input"
                    name="year_of_discovery"
                    value={form.year_of_discovery}
                    onChange={handleChange}
                    type="number"
                    step="1"
                    required
                  />
                </label>
              </div>

              <label style={{ display: "block", marginTop: "16px" }}>
                Summary
                <textarea
                  className="textarea"
                  name="summary"
                  rows="4"
                  value={form.summary}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>
          </div>

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
                    required
                  />
                </label>
                <label>
                  Phylum
                  <input
                    className="input"
                    name="taxonomy_phylum"
                    value={form.taxonomy_phylum}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label>
                  Class
                  <input
                    className="input"
                    name="taxonomy_class"
                    value={form.taxonomy_class}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label>
                  Order
                  <input
                    className="input"
                    name="taxonomy_order"
                    value={form.taxonomy_order}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label>
                  Suborder
                  <input
                    className="input"
                    name="taxonomy_suborder"
                    value={form.taxonomy_suborder}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label>
                  Family
                  <input
                    className="input"
                    name="taxonomy_family"
                    value={form.taxonomy_family}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label>
                  Genus
                  <input
                    className="input"
                    name="taxonomy_genus"
                    value={form.taxonomy_genus}
                    onChange={handleChange}
                    required
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
                    value={form.image_url}
                    onChange={handleChange}
                    required={!imageFile}
                  />
                </label>
                <label>
                  Image Alt Text
                  <input
                    className="input"
                    name="image_alt_text"
                    value={form.image_alt_text}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label>
                  Upload Image
                  <input
                    className="input"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0])}
                    required={!form.image_url}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: "20px" }}>
            <div className="card-section">
              <h3>Author</h3>
              <div className="form-row">
                <label>
                  Name
                  <input
                    className="input"
                    name="author_name"
                    value={form.author_name}
                    onChange={handleChange}
                    required
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
                    required
                  />
                </label>
                <label>
                  Role
                  <input
                    className="input"
                    name="author_role"
                    value={form.author_role}
                    onChange={handleChange}
                    required
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
              {busy ? "Saving..." : "Save Changes"}
            </button>
            <Link className="button button-outline" to={`/species/${id}`}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

export default EditSpecies;
