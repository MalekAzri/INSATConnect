export const getBackendBaseUrl = () =>
  (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000").replace(/\/+$/, "");

export const buildBackendUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendBaseUrl()}${normalizedPath}`;
};

export async function backendFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const isFormData = init?.body instanceof FormData;
  const url = buildBackendUrl(path);

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    return await fetch(url, {
      ...init,
      headers,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Impossible de contacter le backend (${url}). Vérifie que le backend Nest est lancé et que NEXT_PUBLIC_BACKEND_URL est correct.`,
      );
    }
    throw error;
  }
}

export async function backendFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await backendFetch(path, init);

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const payload = await response.json();
      if (payload?.message) {
        message = Array.isArray(payload.message)
          ? payload.message.join(", ")
          : String(payload.message);
      }
    } catch {
      // ignore JSON parse errors for non-json responses
    }
    throw new Error(message);
  }

  if (response.status === 204 || response.status === 205) {
    return null as T;
  }

  const raw = await response.text();
  if (!raw.trim()) {
    return null as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Réponse backend non-JSON reçue sur ${path}`);
  }
}
