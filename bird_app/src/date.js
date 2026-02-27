export function formatYear(value) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  const text = String(value).trim();
  if (/^\d{4}$/.test(text)) {
    return text;
  }

  const match = text.match(/^(\d{4})/);
  if (match) {
    return match[1];
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return String(parsed.getFullYear());
  }

  return text;
}
