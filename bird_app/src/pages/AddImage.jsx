import { useEffect, useState } from "react";
import { fetchSpeciesList, updateSpecies } from "../api.js";

function AddImage() {
  const [speciesList, setSpeciesList] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchSpeciesList()
      .then((data) => setSpeciesList(data))
      .catch(() => setSpeciesList([]));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (!selectedId) {
      setStatus({ type: "error", message: "Select a species first." });
      return;
    }

    if (!imageFile && !imageUrl) {
      setStatus({ type: "error", message: "Provide an image file or URL." });
      return;
    }

    setBusy(true);
    try {
      const payload = {
        image_url: imageUrl,
        image_alt_text: altText,
      };
      await updateSpecies(selectedId, payload, imageFile);
      setStatus({ type: "success", message: "Image added successfully." });
      setImageUrl("");
      setAltText("");
      setImageFile(null);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Unable to add image.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section-shell">
      <div>
        <h1 className="page-title">Add Image to Species</h1>
        <p className="page-subtitle">
          Upload an image or link a URL to an existing species profile.
        </p>
      </div>

      <div className="card">
        <form className="card-section" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Species
              <select
                className="select"
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                <option value="">Select a species</option>
                {speciesList.map((species) => (
                  <option key={species.species_id} value={species.species_id}>
                    {species.common_name} ({species.species_id})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Image URL
              <input
                className="input"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://example.com/bird.jpg"
              />
            </label>
            <label>
              Image Alt Text
              <input
                className="input"
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                placeholder="Short description"
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

          {status.message && (
            <p
              className={
                status.type === "error" ? "notice notice-error" : "notice"
              }
            >
              {status.message}
            </p>
          )}

          <div style={{ display: "flex", gap: "12px" }}>
            <button className="button button-primary" disabled={busy}>
              {busy ? "Uploading..." : "Add Image"}
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={() => {
                setSelectedId("");
                setImageUrl("");
                setAltText("");
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

export default AddImage;
