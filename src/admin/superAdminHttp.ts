import { BASE_URL } from "@/api/client";

const apiHostNeedsNgrokBypass =
  /ngrok/i.test(BASE_URL) || /ngrok-free\.app/i.test(BASE_URL);

export async function superAdminHttpJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init?.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
    ...(apiHostNeedsNgrokBypass ? { "ngrok-skip-browser-warning": "true" } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = { message: res.statusText };
    }
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: unknown }).message)
        : res.statusText;
    const err = new Error(message) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
