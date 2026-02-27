const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return response.json();
}

/* API functions */

// Fetch species list with optional query parameters
export async function fetchSpeciesList(params = {}) {
  const url = new URL(`${API_BASE}/api/species`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  const response = await fetch(url);
  return handleResponse(response);
}

export async function fetchSpeciesById(id) {
  const response = await fetch(`${API_BASE}/api/species/${id}`);
  return handleResponse(response);
}

export async function createSpecies(payload, imageFile) {
  if (imageFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value);
      }
    });
    formData.append("image", imageFile);
    const response = await fetch(`${API_BASE}/api/species`, {
      method: "POST",
      body: formData,
    });
    return handleResponse(response);
  }

  const response = await fetch(`${API_BASE}/api/species`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateSpecies(id, payload, imageFile) {
  if (imageFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value);
      }
    });
    formData.append("image", imageFile);
    const response = await fetch(`${API_BASE}/api/species/${id}`, {
      method: "PUT",
      body: formData,
    });
    return handleResponse(response);
  }

  const response = await fetch(`${API_BASE}/api/species/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}
