/**
 * Menu API helpers (page-local).
 * This file is intentionally standalone and NOT imported anywhere automatically.
 */
export async function fetchCategories({ url = "/api/categories", signal } = {}) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.categories ?? [];
}

export async function fetchProducts({ url = "/api/products", signal } = {}) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.products ?? [];
}

