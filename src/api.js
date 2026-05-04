const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function queryKnowledgeBase(query) {
  const response = await fetch(`${API_BASE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Query request failed");
  }

  return response.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Upload request failed");
  }

  return response.json();
}

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
