// Thin fetch wrapper: talks to the Django API through Vite's dev proxy
// (see vite.config.js), so cookies stay same-origin in development.

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

let csrfPrimed = false;

async function primeCsrf() {
  if (csrfPrimed && getCookie("csrftoken")) return;
  await fetch("/api/auth/csrf/", { credentials: "include" });
  csrfPrimed = true;
}

async function request(path, { method = "GET", body, params } = {}) {
  const needsCsrf = method !== "GET" && method !== "HEAD";
  if (needsCsrf) await primeCsrf();

  let url = path.startsWith("/api") ? path : `/api${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (needsCsrf) headers["X-CSRFToken"] = getCookie("csrftoken") || "";

  const res = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const error = new Error("Request failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (path, params) => request(path, { method: "GET", params }),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  del: (path) => request(path, { method: "DELETE" }),
};

/** Flattens DRF's {field: ["msg"]} validation errors into one readable string. */
export function formatApiError(err, fallback = "Something went wrong. Please try again.") {
  if (!err) return fallback;
  const data = err.data;
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;
  const messages = [];
  for (const [field, value] of Object.entries(data)) {
    const text = Array.isArray(value) ? value.join(" ") : String(value);
    messages.push(field === "non_field_errors" ? text : `${field}: ${text}`);
  }
  return messages.join(" ") || fallback;
}
