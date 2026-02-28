const STATUS_META = {
  least_concern: {
    className: "status-least-concern",
    label: "Least Concern",
  },
  near_threatened: {
    className: "status-near-threatened",
    label: "Near Threatened",
  },
  vulnerable: {
    className: "status-vulnerable",
    label: "Vulnerable",
  },
  endangered: {
    className: "status-endangered",
    label: "Endangered",
  },
  critically_endangered: {
    className: "status-critically-endangered",
    label: "Critically Endangered",
  },
  extinct_in_the_wild: {
    className: "status-extinct-in-the-wild",
    label: "Extinct in the Wild",
  },
  extinct: {
    className: "status-extinct",
    label: "Extinct",
  },
};

const STATUS_ALIASES = {
  "least concern": "least_concern",
  "near threatened": "near_threatened",
  vulnerable: "vulnerable",
  endangered: "endangered",
  "critically endangered": "critically_endangered",
  "extinct in the wild": "extinct_in_the_wild",
  extinct: "extinct",
};

function normalizeStatusKey(status) {
  if (!status) {
    return "";
  }
  const cleaned = String(status)
    .trim()
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  if (STATUS_ALIASES[cleaned]) {
    return STATUS_ALIASES[cleaned];
  }

  return cleaned.replace(/\s+/g, "_");
}

export function getStatusClass(status) {
  const key = normalizeStatusKey(status);
  return STATUS_META[key]?.className || "";
}

export function formatStatusLabel(status) {
  const key = normalizeStatusKey(status);
  return STATUS_META[key]?.label || status || "Unknown";
}
