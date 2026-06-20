import * as api from "./api.js";

// ══════════════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════════════
const state = {
  section:    "reviews",
  reviews:    [],
  products:   [],
  categories: [],
  reviewFilter: "all",   // "all" | "pending" | "approved"
  productFilter: "all",  // "all" | category id
};

// ══════════════════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════════════════
const ICONS = {
  success: `<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  info:    `<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

function toast(msg, type = "info") {
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.innerHTML = `${ICONS[type] || ICONS.info}${msg}`;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    el.addEventListener("animationend", () => el.remove());
  }, 3200);
}

// ══════════════════════════════════════════════════════════════════
//  CONFIRM
// ══════════════════════════════════════════════════════════════════
function confirm(msg, title = "تأیید عملیات") {
  return new Promise((resolve) => {
    const backdrop = document.getElementById("confirm-backdrop");
    document.getElementById("confirm-title").textContent = title;
    document.getElementById("confirm-msg").textContent   = msg;
    backdrop.hidden = false;

    const yes = document.getElementById("confirm-yes");
    const no  = document.getElementById("confirm-no");

    function cleanup(result) {
      backdrop.hidden = true;
      yes.replaceWith(yes.cloneNode(true));
      no.replaceWith(no.cloneNode(true));
      resolve(result);
    }

    document.getElementById("confirm-yes").onclick = () => cleanup(true);
    document.getElementById("confirm-no").onclick  = () => cleanup(false);
  });
}

// ══════════════════════════════════════════════════════════════════
//  MODAL
// ══════════════════════════════════════════════════════════════════
let _modalResolve = null;

function openModal({ title, fields, onSubmit, submitText = "ذخیره", initialValues = {} }) {
  document.getElementById("modal-title").textContent = title;

  const body = document.getElementById("modal-body");
  body.innerHTML = "";

  const form = document.createElement("form");
  form.id = "modal-form";
  form.noValidate = true;

  // Build fields
  const grid = document.createElement("div");
  grid.className = "form-grid";

  fields.forEach((f) => {
    const wrapper = document.createElement("div");
    wrapper.className = `field${f.wide ? " form-grid--single" : ""}`;

    const label = document.createElement("label");
    label.className = "field-label";
    label.htmlFor = `mf-${f.name}`;
    label.innerHTML = f.label + (f.optional ? ` <span class="field-optional">(اختیاری)</span>` : "");
    wrapper.appendChild(label);

    let input;
    if (f.type === "textarea") {
      input = document.createElement("textarea");
      input.className = "field-input field-textarea";
      input.rows = 3;
    } else if (f.type === "select") {
      input = document.createElement("select");
      input.className = "field-input field-select";
      (f.options || []).forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        input.appendChild(o);
      });
    } else {
      input = document.createElement("input");
      input.type = f.type || "text";
      input.className = "field-input";
      if (f.placeholder) input.placeholder = f.placeholder;
    }

    input.id   = `mf-${f.name}`;
    input.name = f.name;
    if (!f.optional && f.type !== "select") input.required = true;
    if (initialValues[f.name] !== undefined) {
      if (f.type === "select") input.value = String(initialValues[f.name]);
      else input.value = initialValues[f.name] ?? "";
    }

    wrapper.appendChild(input);
    grid.appendChild(wrapper);
  });

  form.appendChild(grid);

  // Footer
  const footer = document.createElement("div");
  footer.className = "modal-footer";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "btn btn--ghost";
  cancelBtn.textContent = "انصراف";
  cancelBtn.onclick = closeModal;

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "btn btn--accent";
  submitBtn.innerHTML = `<span class="btn-text">${submitText}</span>`;

  footer.appendChild(cancelBtn);
  footer.appendChild(submitBtn);
  form.appendChild(footer);
  body.appendChild(form);

  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-spinner"></span>`;
    try {
      await onSubmit(data);
      closeModal();
    } catch (err) {
      toast(err.message, "error");
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span class="btn-text">${submitText}</span>`;
    }
  };

  document.getElementById("modal-backdrop").hidden = false;
}

function closeModal() {
  document.getElementById("modal-backdrop").hidden = true;
  document.getElementById("modal-body").innerHTML  = "";
}

// ══════════════════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════════════════
async function navigate(section) {
  state.section = section;

  // Update nav items
  document.querySelectorAll(".nav-item[data-nav]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === section);
  });

  // Show correct section
  document.querySelectorAll(".section").forEach((el) => {
    el.classList.toggle("active", el.id === `section-${section}`);
  });

  await loadSection(section);
}

async function loadSection(section) {
  const el = document.getElementById(`section-${section}`);
  el.innerHTML = `<div class="empty"><div class="skeleton" style="width:120px;height:16px;margin-bottom:.5rem"></div><div class="skeleton" style="width:80px;height:12px"></div></div>`;

  try {
    if (section === "reviews") {
      state.reviews = await api.reviews.getAll();
      renderReviews();
    } else if (section === "products") {
      [state.products, state.categories] = await Promise.all([
        api.products.getAll(),
        api.categories.getAll(),
      ]);
      renderProducts();
    } else if (section === "categories") {
      [state.categories, state.products] = await Promise.all([
        api.categories.getAll(),
        api.products.getAll(),
      ]);
      renderCategories();
    }
  } catch (err) {
    el.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p class="empty-title">خطا در بارگذاری</p><p class="empty-sub">${err.message}</p></div>`;
  }
}

// ══════════════════════════════════════════════════════════════════
//  REVIEWS
// ══════════════════════════════════════════════════════════════════
function renderReviews() {
  const el = document.getElementById("section-reviews");
  const all = state.reviews;
  const pending  = all.filter(r => !r.visible);
  const approved = all.filter(r =>  r.visible);

  // Update pending badge in sidebar
  const badge = document.getElementById("nav-badge-reviews");
  badge.textContent = pending.length || "";

  // Filter
  let list = state.reviewFilter === "pending"  ? pending
           : state.reviewFilter === "approved" ? approved
           : all;

  el.innerHTML = "";

  // Header
  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1 class="section-title">نظرات</h1>
      <p class="section-sub">${all.length} نظر ثبت شده</p>
    </div>`;
  el.appendChild(header);

  // Stats
  const stats = document.createElement("div");
  stats.className = "stats-row";
  stats.innerHTML = `
    <div class="stat-card"><div class="stat-label">کل</div><div class="stat-value">${all.length}</div></div>
    <div class="stat-card stat-card--pending"><div class="stat-label">در انتظار</div><div class="stat-value">${pending.length}</div></div>
    <div class="stat-card stat-card--approved"><div class="stat-label">تأیید شده</div><div class="stat-value">${approved.length}</div></div>`;
  el.appendChild(stats);

  // Tabs
  const tabs = document.createElement("div");
  tabs.className = "tabs";
  [["all","همه"],["pending","در انتظار"],["approved","تأیید شده"]].forEach(([val, label]) => {
    const btn = document.createElement("button");
    btn.className = `tab${state.reviewFilter === val ? " active" : ""}`;
    btn.textContent = label;
    btn.onclick = () => { state.reviewFilter = val; renderReviews(); };
    tabs.appendChild(btn);
  });
  el.appendChild(tabs);

  // List
  if (list.length === 0) {
    el.appendChild(emptyState("هیچ نظری پیدا نشد", "در این دسته‌بندی نظری وجود ندارد"));
    return;
  }

  const listEl = document.createElement("div");
  listEl.className = "reviews-list";

  list.forEach((r) => {
    const initials = r.name ? r.name.trim()[0] : "؟";
    const dateStr  = r.createdAt ? new Date(r.createdAt).toLocaleDateString("fa-IR") : "—";

    const card = document.createElement("div");
    card.className = `review-card review-card--${r.visible ? "approved" : "pending"}`;
    card.innerHTML = `
      <div class="review-top">
        <div class="review-author">
          <div class="review-avatar">${initials}</div>
          <div>
            <div class="review-name">${r.name || "ناشناس"}</div>
            <div class="review-date">${dateStr}</div>
          </div>
        </div>
        <span class="badge badge--${r.visible ? "approved" : "pending"}">${r.visible ? "تأیید شده" : "در انتظار"}</span>
      </div>
      <p class="review-text">${r.text}</p>
      ${r.reply ? `<div class="review-reply"><div class="review-reply-label">پاسخ روف</div>${r.reply}</div>` : ""}
      <div class="review-actions"></div>`;

    const actions = card.querySelector(".review-actions");

    if (!r.visible) {
      const approveBtn = mkBtn("تأیید", "btn--success btn--sm", `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`);
      approveBtn.onclick = () => approveReview(r.id);
      actions.appendChild(approveBtn);
    } else {
      const rejectBtn = mkBtn("رد کردن", "btn--ghost btn--sm", `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`);
      rejectBtn.onclick = () => rejectReview(r.id);
      actions.appendChild(rejectBtn);
    }

    const replyBtn = mkBtn(r.reply ? "ویرایش پاسخ" : "پاسخ", "btn--ghost btn--sm", `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`);
    replyBtn.onclick = () => replyToReview(r);
    actions.appendChild(replyBtn);

    const deleteBtn = mkBtn("حذف", "btn--danger btn--sm", `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`);
    deleteBtn.onclick = () => deleteReview(r.id);
    actions.appendChild(deleteBtn);

    listEl.appendChild(card);
  });

  el.appendChild(listEl);
}

async function approveReview(id) {
  try {
    await api.reviews.update(id, { visible: true });
    toast("نظر تأیید شد", "success");
    state.reviews = await api.reviews.getAll();
    renderReviews();
  } catch (e) { toast(e.message, "error"); }
}

async function rejectReview(id) {
  try {
    await api.reviews.update(id, { visible: false });
    toast("نظر رد شد", "info");
    state.reviews = await api.reviews.getAll();
    renderReviews();
  } catch (e) { toast(e.message, "error"); }
}

function replyToReview(r) {
  openModal({
    title: "پاسخ به نظر",
    fields: [
      { name: "reply", label: "متن پاسخ", type: "textarea", wide: true, placeholder: "پاسخ روف..." },
    ],
    initialValues: { reply: r.reply || "" },
    submitText: "ارسال پاسخ",
    onSubmit: async ({ reply }) => {
      await api.reviews.update(r.id, { reply: reply.trim() || null });
      toast("پاسخ ثبت شد", "success");
      state.reviews = await api.reviews.getAll();
      renderReviews();
    },
  });
}

async function deleteReview(id) {
  const ok = await confirm("این نظر برای همیشه حذف می‌شود. ادامه می‌دهید؟", "حذف نظر");
  if (!ok) return;
  try {
    await api.reviews.delete(id);
    toast("نظر حذف شد", "success");
    state.reviews = await api.reviews.getAll();
    renderReviews();
  } catch (e) { toast(e.message, "error"); }
}

// ══════════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════════
function getCatName(id) {
  const c = state.categories.find(c => c.id === id);
  return c ? c.name : "—";
}
function getCatType(id) {
  const c = state.categories.find(c => c.id === id);
  return c ? c.type : "";
}

function renderProducts() {
  const el = document.getElementById("section-products");
  el.innerHTML = "";

  // Header
  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1 class="section-title">محصولات</h1>
      <p class="section-sub">${state.products.length} محصول</p>
    </div>`;

  const addBtn = mkBtn("محصول جدید", "btn--accent", `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`);
  addBtn.onclick = () => addProduct();
  header.appendChild(addBtn);
  el.appendChild(header);

  // Category filter tabs
  const tabs = document.createElement("div");
  tabs.className = "tabs";
  tabs.style.marginBottom = "1.25rem";
  [["all", "همه"], ...state.categories.map(c => [String(c.id), c.name])].forEach(([val, label]) => {
    const btn = document.createElement("button");
    btn.className = `tab${state.productFilter === val ? " active" : ""}`;
    btn.textContent = label;
    btn.onclick = () => { state.productFilter = val; renderProducts(); };
    tabs.appendChild(btn);
  });
  el.appendChild(tabs);

  // Filtered list
  const filtered = state.productFilter === "all"
    ? state.products
    : state.products.filter(p => String(p.categoryId) === state.productFilter);

  if (filtered.length === 0) { el.appendChild(emptyState("محصولی پیدا نشد", "در این دسته‌بندی محصولی وجود ندارد")); return; }

  const grid = document.createElement("div");
  grid.className = "products-grid";

  filtered.forEach((p) => {
    const type = getCatType(p.categoryId);
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-img">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
      <div class="product-body">
        <div class="product-cat">${getCatName(p.categoryId)} <span class="badge badge--${type}">${type === "cafe" ? "کافه" : type === "restaurant" ? "رستوران" : "صبحانه"}</span></div>
        <div class="product-name">${p.name}</div>
        <div class="product-price">${Number(p.price).toLocaleString("fa-IR")} تومان</div>
      </div>
      <div class="product-actions"></div>`;

    const actions = card.querySelector(".product-actions");

    const editBtn = mkBtn("ویرایش", "btn--ghost btn--sm");
    editBtn.onclick = () => editProduct(p);
    actions.appendChild(editBtn);

    const delBtn = mkBtn("حذف", "btn--danger btn--sm");
    delBtn.onclick = () => deleteProduct(p.id);
    actions.appendChild(delBtn);

    grid.appendChild(card);
  });

  el.appendChild(grid);
}

function productFields() {
  return [
    { name: "name",        label: "نام محصول",    placeholder: "مثال: لاته" },
    { name: "price",       label: "قیمت (تومان)", type: "number", placeholder: "120000" },
    { name: "categoryId",  label: "دسته‌بندی",    type: "select", options: state.categories.map(c => ({ value: String(c.id), label: c.name })) },
    { name: "description", label: "توضیحات",     type: "textarea", wide: true, optional: true },
    { name: "image",       label: "نام فایل تصویر", placeholder: "coffee.jpg", optional: true },
  ];
}

function addProduct() {
  openModal({
    title: "محصول جدید",
    fields: productFields(),
    submitText: "افزودن",
    onSubmit: async (data) => {
      await api.products.create({ ...data, price: Number(data.price), categoryId: Number(data.categoryId) });
      toast("محصول اضافه شد", "success");
      state.products = await api.products.getAll();
      renderProducts();
    },
  });
}

function editProduct(p) {
  openModal({
    title: "ویرایش محصول",
    fields: productFields(),
    initialValues: { ...p, categoryId: String(p.categoryId) },
    submitText: "ذخیره تغییرات",
    onSubmit: async (data) => {
      await api.products.update(p.id, { ...data, price: Number(data.price), categoryId: Number(data.categoryId) });
      toast("محصول ویرایش شد", "success");
      state.products = await api.products.getAll();
      renderProducts();
    },
  });
}

async function deleteProduct(id) {
  const ok = await confirm("این محصول حذف می‌شود. مطمئنید؟", "حذف محصول");
  if (!ok) return;
  try {
    await api.products.delete(id);
    toast("محصول حذف شد", "success");
    state.products = await api.products.getAll();
    renderProducts();
  } catch (e) { toast(e.message, "error"); }
}

// ══════════════════════════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════════════════════════
const TYPE_LABELS = { cafe: "کافه", restaurant: "رستوران", breakfast: "صبحانه" };

function renderCategories() {
  const el = document.getElementById("section-categories");
  el.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div>
      <h1 class="section-title">دسته‌بندی‌ها</h1>
      <p class="section-sub">${state.categories.length} دسته</p>
    </div>`;

  const addBtn = mkBtn("دسته جدید", "btn--accent", `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`);
  addBtn.onclick = () => addCategory();
  header.appendChild(addBtn);
  el.appendChild(header);

  if (state.categories.length === 0) { el.appendChild(emptyState("دسته‌بندی پیدا نشد", "هنوز دسته‌ای ایجاد نشده")); return; }

  const list = document.createElement("div");
  list.className = "categories-list";

  state.categories.forEach((c) => {
    const count = state.products.filter(p => p.categoryId === c.id).length;
    const row = document.createElement("div");
    row.className = "category-row";
    row.innerHTML = `
      <div class="category-info">
        <span class="badge badge--${c.type}">${TYPE_LABELS[c.type] || c.type}</span>
        <span class="category-name">${c.name}</span>
        <span style="color:var(--t3);font-size:.75rem">${count} محصول</span>
      </div>
      <div class="category-actions"></div>`;

    const actions = row.querySelector(".category-actions");

    const editBtn = mkBtn("ویرایش", "btn--ghost btn--sm");
    editBtn.onclick = () => editCategory(c);
    actions.appendChild(editBtn);

    const delBtn = mkBtn("حذف", "btn--danger btn--sm");
    delBtn.onclick = () => deleteCategory(c.id, count);
    actions.appendChild(delBtn);

    list.appendChild(row);
  });

  el.appendChild(list);
}

const catFields = () => [
  { name: "name", label: "نام دسته‌بندی", placeholder: "مثال: قهوه" },
  { name: "type", label: "نوع", type: "select", options: [
    { value: "cafe", label: "کافه" },
    { value: "restaurant", label: "رستوران" },
    { value: "breakfast", label: "صبحانه" },
  ]},
];

function addCategory() {
  openModal({
    title: "دسته‌بندی جدید", fields: catFields(), submitText: "افزودن",
    onSubmit: async (data) => {
      await api.categories.create(data);
      toast("دسته‌بندی اضافه شد", "success");
      [state.categories, state.products] = await Promise.all([api.categories.getAll(), api.products.getAll()]);
      renderCategories();
    },
  });
}

function editCategory(c) {
  openModal({
    title: "ویرایش دسته‌بندی", fields: catFields(), initialValues: c, submitText: "ذخیره",
    onSubmit: async (data) => {
      await api.categories.update(c.id, data);
      toast("دسته‌بندی ویرایش شد", "success");
      [state.categories, state.products] = await Promise.all([api.categories.getAll(), api.products.getAll()]);
      renderCategories();
    },
  });
}

async function deleteCategory(id, count) {
  if (count > 0) {
    const ok = await confirm(`این دسته‌بندی ${count} محصول دارد. با حذف آن ممکن است محصولات بدون دسته بمانند. ادامه می‌دهید؟`, "حذف دسته‌بندی");
    if (!ok) return;
  } else {
    const ok = await confirm("این دسته‌بندی حذف می‌شود. مطمئنید؟", "حذف دسته‌بندی");
    if (!ok) return;
  }
  try {
    await api.categories.delete(id);
    toast("دسته‌بندی حذف شد", "success");
    [state.categories, state.products] = await Promise.all([api.categories.getAll(), api.products.getAll()]);
    renderCategories();
  } catch (e) { toast(e.message, "error"); }
}

// ══════════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════════
async function handleLogin(e) {
  e.preventDefault();
  const form   = e.target;
  const btn    = document.getElementById("login-btn");
  const errEl  = document.getElementById("login-error");
  const spinner = btn.querySelector(".btn-spinner");
  const text    = btn.querySelector(".btn-text");

  errEl.hidden  = true;
  text.hidden   = true;
  spinner.hidden = false;
  btn.disabled  = true;

  try {
    const { username, password } = Object.fromEntries(new FormData(form));
    const { token } = await api.login(username, password);
    api.token.set(token);
    // On successful login redirect to the dashboard page (separate file)
    const dashUrl = 'dashboard.html';
    window.location.href = dashUrl;
  } catch (err) {
    errEl.textContent = err.message;
    errEl.hidden = false;
  } finally {
    text.hidden   = false;
    spinner.hidden = true;
    btn.disabled  = false;
  }
}

function showDashboard(username) {
  // If dashboard markup exists on the current page, show it and start nav.
  const dashEl = document.getElementById("dashboard-view");
  if (dashEl) {
    const loginViewEl = document.getElementById("login-view");
    if (loginViewEl) loginViewEl.hidden = true;
    dashEl.hidden = false;
    const userEl = document.getElementById("sidebar-username");
    if (userEl) userEl.textContent = username || "ادمین";
    navigate("reviews");
    return;
  }
  // Otherwise redirect to the dashboard page
  window.location.href = 'dashboard.html';
}

function logout() {
  api.token.remove();
  // If we're on dashboard page, redirect to login; otherwise ensure we land on login.
  window.location.href = 'index.html';
}

// ══════════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════════
function mkBtn(text, classes = "", icon = "") {
  const btn = document.createElement("button");
  btn.className = `btn ${classes}`;
  btn.innerHTML = (icon ? icon : "") + (text ? `<span>${text}</span>` : "");
  return btn;
}

function emptyState(title, sub) {
  const el = document.createElement("div");
  el.className = "empty";
  el.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
    <p class="empty-title">${title}</p>
    <p class="empty-sub">${sub}</p>`;
  return el;
}

// ══════════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════════
function init() {
  // Attach login handler if present (login page)
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
    // If already logged in, go straight to dashboard
    if (api.token.exists()) window.location.href = 'dashboard.html';
  }

  // If dashboard markup exists, initialize dashboard interactions
  const dashEl = document.getElementById("dashboard-view");
  if (dashEl) {
    // Require authentication
    if (!api.token.exists()) {
      window.location.href = 'index.html';
      return;
    }

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);

    // Restore compact mode preference
    if (localStorage.getItem("dashboard_compact") === "1") dashEl.classList.add("compact");

    // Compact toggle (collapse sidebar)
    const compactBtn = document.getElementById("compact-toggle");
    if (compactBtn) {
      compactBtn.addEventListener("click", () => {
        const is = dashEl.classList.toggle("compact");
        compactBtn.setAttribute("aria-pressed", String(is));
        localStorage.setItem("dashboard_compact", is ? "1" : "0");
      });
    }

    // Sidebar element and mobile toggle
    const sidebar = document.querySelector(".sidebar");
    const sidebarToggle = document.getElementById("sidebar-toggle");
    if (sidebar) {
      if (!sidebar.classList.contains("visible")) sidebar.classList.add("hidden");
    }
    if (sidebarToggle) {
      const mq = window.matchMedia('(max-width:720px)');
      const updateToggle = () => {
        const mobile = mq.matches;
        sidebarToggle.hidden = !mobile;
        if (!mobile) {
          sidebar?.classList.remove('hidden');
          sidebar?.classList.remove('visible');
        } else {
          if (sidebar && !sidebar.classList.contains('visible')) sidebar.classList.add('hidden');
        }
      };
      updateToggle();
      if (mq.addEventListener) mq.addEventListener('change', updateToggle); else mq.addListener(updateToggle);

      sidebarToggle.addEventListener("click", () => {
        const isVisible = sidebar.classList.toggle("visible");
        sidebar.classList.toggle("hidden", !isVisible);
        sidebarToggle.setAttribute("aria-expanded", String(isVisible));
      });
    }

    // Sidebar navigation (also close sidebar on mobile after navigation)
    document.querySelectorAll(".nav-item[data-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        navigate(btn.dataset.nav);
        if (window.matchMedia("(max-width:720px)").matches && sidebar) {
          sidebar.classList.remove("visible");
          sidebar.classList.add("hidden");
          sidebarToggle?.setAttribute("aria-expanded", "false");
        }
      });
    });

    // Modal close handlers (if present)
    const modalClose = document.getElementById("modal-close");
    if (modalClose) modalClose.addEventListener("click", closeModal);
    const modalBackdrop = document.getElementById("modal-backdrop");
    if (modalBackdrop) modalBackdrop.addEventListener("click", (e) => { if (e.target === e.currentTarget) closeModal(); });

    // Start on the reviews section
    navigate("reviews");
  }
}

document.addEventListener("DOMContentLoaded", init);
