import * as api from './api.js';
import { state, getCatName, getCatType } from './state.js';
import { mkBtn, emptyState } from './helpers.js';
import { openModal, toast, confirm, ICONS } from './ui.js';

export async function loadProducts() {
  state.products = await api.products.getAll();
}

export function productFields() {
  return [
    { name: 'name', label: 'نام محصول', placeholder: 'مثال: لاته' },
    { name: 'price', label: 'قیمت (تومان)', type: 'number', placeholder: '120000' },
    { name: 'categoryId', label: 'دسته‌بندی', type: 'select', options: state.categories.map(c => ({ value: String(c.id), label: c.name })) },
    { name: 'description', label: 'توضیحات', type: 'textarea', wide: true, optional: true },
    { name: 'image', label: 'نام فایل تصویر', placeholder: 'coffee.jpg', optional: true },
  ];
}

export function renderProducts() {
  const el = document.getElementById('section-products');
  el.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = `\n    <div>\n      <h1 class="section-title">محصولات</h1>\n      <p class="section-sub">${state.products.length} محصول</p>\n    </div>`;
  const addBtn = mkBtn('محصول جدید', 'btn--accent');
  addBtn.onclick = () => addProduct();
  header.appendChild(addBtn);
  el.appendChild(header);

  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  tabs.style.marginBottom = '1.25rem';
  [['all', 'همه'], ...state.categories.map(c => [String(c.id), c.name])].forEach(([val, label]) => {
    const btn = document.createElement('button');
    btn.className = `tab${state.productFilter === val ? ' active' : ''}`;
    btn.textContent = label;
    btn.onclick = () => { state.productFilter = val; renderProducts(); };
    tabs.appendChild(btn);
  });
  el.appendChild(tabs);

  const filtered = state.productFilter === 'all' ? state.products : state.products.filter(p => String(p.categoryId) === state.productFilter);
  if (filtered.length === 0) { el.appendChild(emptyState('محصولی پیدا نشد', 'در این دسته‌بندی محصولی وجود ندارد')); return; }

  const grid = document.createElement('div');
  grid.className = 'products-grid';

  filtered.forEach((p) => {
    const type = getCatType(p.categoryId);
    const card = document.createElement('div');
    card.className = 'product-card';
    const hasImage = p.image && p.image !== 'placeholder.png';
    const _img = hasImage ? `<img src="/assets/images/products/${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">` : ICONS.picture;

    const imgWrap = document.createElement('div');
    imgWrap.className = 'product-img';
    imgWrap.innerHTML = _img;

    const body = document.createElement('div');
    body.className = 'product-body';
    const catDiv = document.createElement('div');
    catDiv.className = 'product-cat';
    const catName = document.createElement('span');
    catName.innerHTML = escapeHtml(getCatName(p.categoryId));
    const badge = document.createElement('span');
    badge.className = `badge badge--${escapeHtml(type)}`;
    badge.innerHTML = escapeHtml(type === 'cafe' ? 'کافه' : type === 'restaurant' ? 'رستوران' : 'صبحانه');
    catDiv.appendChild(catName);
    catDiv.appendChild(document.createTextNode(' '));
    catDiv.appendChild(badge);

    const nameDiv = document.createElement('div');
    nameDiv.className = 'product-name';
    nameDiv.textContent = p.name;
    const priceDiv = document.createElement('div');
    priceDiv.className = 'product-price';
    priceDiv.textContent = `${Number(p.price).toLocaleString('fa-IR')} تومان`;

    body.appendChild(nameDiv);
    body.appendChild(catDiv);
    body.appendChild(priceDiv);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'product-actions';

    card.innerHTML = '';
    card.appendChild(imgWrap);
    card.appendChild(body);
    card.appendChild(actionsDiv);

    const editBtn = mkBtn('ویرایش', 'btn--ghost btn--sm');
    editBtn.onclick = () => editProduct(p);
    actionsDiv.appendChild(editBtn);

    const delBtn = mkBtn('حذف', 'btn--danger btn--sm');
    delBtn.onclick = () => deleteProduct(p.id);
    actionsDiv.appendChild(delBtn);

    grid.appendChild(card);
  });

  el.appendChild(grid);
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function addProduct() {
  openModal({
    title: 'محصول جدید',
    fields: productFields(),
    submitText: 'افزودن',
    onSubmit: async (data) => {
      await api.products.create({ ...data, price: Number(data.price), categoryId: Number(data.categoryId) });
      toast('محصول اضافه شد', 'success');
      state.products = await api.products.getAll();
      renderProducts();
    },
  });
  injectImageUpload(null);
}

export function editProduct(p) {
  openModal({
    title: 'ویرایش محصول',
    fields: productFields(),
    initialValues: { ...p, categoryId: String(p.categoryId) },
    submitText: 'ذخیره تغییرات',
    onSubmit: async (data) => {
      await api.products.update(p.id, { ...data, price: Number(data.price), categoryId: Number(data.categoryId) });
      toast('محصول ویرایش شد', 'success');
      state.products = await api.products.getAll();
      renderProducts();
    },
  });
  injectImageUpload(p.image);
}

export function injectImageUpload(currentImage) {
  const imageInput = document.querySelector('#modal-form [name="image"]');
  if (!imageInput) return;
  imageInput.style.display = 'none';
  const wrapper = imageInput.parentElement;
  const preview = document.createElement('div');
  preview.className = 'img-preview';
  if (currentImage && currentImage !== 'placeholder.png') {
    const img = document.createElement('img');
    img.src = '/assets/images/products/' + currentImage;
    img.alt = 'تصویر فعلی';
    preview.appendChild(img);
  } else {
    preview.innerHTML = ICONS.picture;
  }
  const fileInput = document.createElement('input');
  fileInput.type = 'file'; fileInput.accept = 'image/jpeg,image/png,image/webp,image/gif'; fileInput.style.display = 'none';
  const uploadBtn = document.createElement('button'); uploadBtn.type = 'button'; uploadBtn.className = 'btn btn--ghost btn--sm';
  const removeBtn = document.createElement('button'); removeBtn.type = 'button'; removeBtn.className = 'btn btn--ghost btn--sm'; removeBtn.textContent = 'حذف تصویر';
  removeBtn.onclick = () => { imageInput.value = 'placeholder.png'; preview.innerHTML = ICONS.picture; setStatus('تصویر حذف شد', 'var(--green)'); };
  const status = document.createElement('span'); status.className = 'upload-status';
  function setStatus(text, color) { status.textContent = text; status.style.color = color; }
  fileInput.onchange = async () => {
    const file = fileInput.files[0]; if (!file) return; uploadBtn.disabled = true; setStatus('در حال آپلود...', 'var(--tertiary-text-color)');
    try { const { filename } = await api.uploadImage(file); imageInput.value = filename; preview.innerHTML = ''; const img = document.createElement('img'); img.src = '/assets/images/products/' + filename; img.alt = 'تصویر جدید'; preview.appendChild(img); setStatus('✓ آپلود شد', 'var(--green)'); } catch (err) { setStatus(err.message, 'var(--red)'); } finally { uploadBtn.disabled = false; }
  };
  uploadBtn.onclick = () => fileInput.click();
  uploadBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>انتخاب تصویر</span>`;
  wrapper.appendChild(preview); wrapper.appendChild(fileInput); wrapper.appendChild(uploadBtn); wrapper.appendChild(removeBtn); wrapper.appendChild(status);
}

export async function deleteProduct(id) {
  const ok = await confirm('این محصول حذف می‌شود. مطمئنید؟', 'حذف محصول'); if (!ok) return;
  try { await api.products.delete(id); toast('محصول حذف شد', 'success'); state.products = await api.products.getAll(); renderProducts(); } catch (e) { toast(e.message, 'error'); }
}
