export const state = {
  section: 'reviews',
  reviews: [],
  products: [],
  categories: [],
  reviewFilter: 'all',
  productFilter: 'all',
};

export function getCatName(id) {
  const c = state.categories.find((c) => c.id === id);
  return c ? c.name : '—';
}

export function getCatType(id) {
  const c = state.categories.find((c) => c.id === id);
  return c ? c.type : '';
}
