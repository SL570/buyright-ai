const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function request(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    const detail = data.detail;
    const msg = Array.isArray(detail)
      ? detail.map((e: any) => e.msg).join(", ")
      : typeof detail === "string" ? detail : "Request failed";
    throw new Error(msg);
  }
  return data;
}

export async function getWishlist(token: string) {
  return request("/wishlist", token);
}

export async function addWishlistItem(
  token: string,
  name: string,
  url: string,
  price: number,
  target_price?: number,
) {
  return request("/wishlist", token, {
    method: "POST",
    body: JSON.stringify({ name, url, price, ...(target_price ? { target_price } : {}) }),
  });
}

export async function deleteWishlistItem(token: string, id: number) {
  const res = await fetch(`${BASE_URL}/wishlist/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete item");
}
