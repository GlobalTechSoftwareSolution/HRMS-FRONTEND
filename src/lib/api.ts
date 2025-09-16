// src/lib/api.ts
export async function fetchData(endpoint: string, options: RequestInit = {}) {
  // Accept full URL directly
  const url = endpoint;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Unexpected content type: ${contentType}`);
  }

  return res.json();
}
