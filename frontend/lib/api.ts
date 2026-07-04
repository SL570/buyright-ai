const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export async function register(email: string, password: string) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string): Promise<string> {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("token", data.access_token);
  return data.access_token;
}

export function logout() {
  localStorage.removeItem("token");
}

export async function getWishlist() {
  return request("/wishlist");
}

export async function addWishlistItem(name: string, url: string, price: number, target_price?: number) {
  return request("/wishlist", {
    method: "POST",
    body: JSON.stringify({ name, url, price, ...(target_price ? { target_price } : {}) }),
  });
}

export async function deleteWishlistItem(id: number) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/wishlist/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete item");
}
