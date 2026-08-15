/* =============================================================
   BIO-ARCOIRIS — Tienda virtual (conectado a backend local)
   Depende de common.js (cargado antes que este archivo).
   ============================================================= */

(function () {
  "use strict";

  const ORDER_STATUS_LABEL = { pendiente: "Pendiente", concluido: "Concluido" };

  const state = {
    products: [],
    isAdmin: false,
    search: "",
    currentView: "home",
    currentCategory: null, // slug o null (todos / búsqueda)
    sort: "default",
    cols: 3,
    orders: [],
  };

  const els = {
    searchInput: document.getElementById("searchInput"),
    catalogGrid: document.getElementById("catalogGrid"),
    emptyState: document.getElementById("emptyState"),
    statCount: document.getElementById("statCount"),
    catalogEyebrow: document.getElementById("catalogEyebrow"),
    catalogTitle: document.getElementById("catalogTitle"),
    sortSelect: document.getElementById("sortSelect"),
    adminControls: document.getElementById("adminControls"),
    addProductBtn: document.getElementById("addProductBtn"),

    homeCategoryGrid: document.getElementById("homeCategoryGrid"),
    drawerCategoryLinks: document.getElementById("drawerCategoryLinks"),

    menuBtn: document.getElementById("menuBtn"),
    drawer: document.getElementById("drawer"),
    drawerOverlay: document.getElementById("drawerOverlay"),
    drawerClose: document.getElementById("drawerClose"),
    drawerPedidosLink: document.getElementById("drawerPedidosLink"),
    drawerAdminBtn: document.getElementById("drawerAdminBtn"),
    brandHomeBtn: document.getElementById("brandHomeBtn"),
    cartShortcutBtn: document.getElementById("cartShortcutBtn"),
    wishlistShortcutBtn: document.getElementById("wishlistShortcutBtn"),

    wishlistGrid: document.getElementById("wishlistGrid"),
    wishlistEmptyState: document.getElementById("wishlistEmptyState"),

    cartList: document.getElementById("cartList"),
    cartEmptyState: document.getElementById("cartEmptyState"),
    cartSummary: document.getElementById("cartSummary"),
    cartTotal: document.getElementById("cartTotal"),
    cartOrderBtn: document.getElementById("cartOrderBtn"),

    checkoutForm: document.getElementById("checkoutForm"),
    checkoutName: document.getElementById("checkoutName"),
    checkoutPhone: document.getElementById("checkoutPhone"),
    checkoutEmail: document.getElementById("checkoutEmail"),
    checkoutAddress: document.getElementById("checkoutAddress"),
    checkoutSubmitBtn: document.getElementById("checkoutSubmitBtn"),
    checkoutError: document.getElementById("checkoutError"),

    adminLoginBlock: document.getElementById("adminLoginBlock"),
    adminSessionBlock: document.getElementById("adminSessionBlock"),
    loginForm: document.getElementById("loginForm"),
    loginUsername: document.getElementById("loginUsername"),
    loginPassword: document.getElementById("loginPassword"),
    loginError: document.getElementById("loginError"),
    logoutBtn: document.getElementById("logoutBtn"),

    ordersList: document.getElementById("ordersList"),
    ordersEmptyState: document.getElementById("ordersEmptyState"),

    productModalOverlay: document.getElementById("productModalOverlay"),
    productModalTitle: document.getElementById("productModalTitle"),
    productModalEyebrow: document.getElementById("productModalEyebrow"),
    productForm: document.getElementById("productForm"),
    productId: document.getElementById("productId"),
    productName: document.getElementById("productName"),
    productCategory: document.getElementById("productCategory"),
    productSize: document.getElementById("productSize"),
    productColor: document.getElementById("productColor"),
    productDescription: document.getElementById("productDescription"),
    productPrice: document.getElementById("productPrice"),
    productPriceError: document.getElementById("productPriceError"),
    productImage: document.getElementById("productImage"),
    productImagePreview: document.getElementById("productImagePreview"),
    productImageLabel: document.getElementById("productImageLabel"),
    productImageError: document.getElementById("productImageError"),
    productSubmitBtn: document.getElementById("productSubmitBtn"),

    toast: document.getElementById("toast"),
  };

  let toastTimer = null;
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, 2800);
  }

  /* -----------------------------------------------------------
     Persistencia API
     ----------------------------------------------------------- */
  async function loadProducts() {
    try {
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) throw new Error("Error de red");
      state.products = await response.json();
    } catch (e) {
      console.error("Error al cargar el catálogo:", e);
      state.products = [];
      showToast("No se pudo conectar con el servidor local. ¿Está corriendo el backend?");
    }
    renderCatalog();
    renderWishlistView();
  }

  function loadSession() {
    const token = localStorage.getItem("ba_token");
    state.isAdmin = !!token;
  }

  /* -----------------------------------------------------------
     Catálogos — accesos de inicio y menú (única fuente: CATEGORIES)
     ----------------------------------------------------------- */
  function renderHomeCategoryGrid() {
    els.homeCategoryGrid.innerHTML = CATEGORIES.map((cat) => `
      <button type="button" class="category-tile" data-cat="${cat.slug}">
        <span class="category-tile__icon">${cat.icon}</span>
        <span class="category-tile__label">${escapeHtml(cat.label)}</span>
        <span class="category-tile__cta">Ver catálogo →</span>
      </button>
    `).join("");
  }

  function renderDrawerCategoryLinks() {
    els.drawerCategoryLinks.innerHTML = CATEGORIES.map((cat) => `
      <button type="button" class="drawer__link" data-cat="${cat.slug}">
        <span class="drawer__icon">${cat.icon}</span>
        <span>${escapeHtml(cat.label)}</span>
      </button>
    `).join("");
  }

  els.homeCategoryGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    showView("catalogo", { cat: btn.dataset.cat });
  });

  els.drawerCategoryLinks.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    showView("catalogo", { cat: btn.dataset.cat });
  });

  /* -----------------------------------------------------------
     Carrito — helpers de UI (usan common.js)
     ----------------------------------------------------------- */
  function cartQtyFor(productId) {
    const item = loadCart().find((c) => c.id == productId);
    return item ? item.qty : 0;
  }

  function cartTotalAmount() {
    return loadCart().reduce((sum, c) => sum + Number(c.price) * c.qty, 0);
  }

  function addToCart(product) {
    addProductToCart(product, 1);
    refreshSharedBadges();
    renderCatalog();
    renderWishlistView();
    renderCart();
  }

  function decrementCart(productId) {
    const cart = loadCart();
    const item = cart.find((c) => c.id == productId);
    if (!item) return;
    item.qty -= 1;
    const next = item.qty <= 0 ? cart.filter((c) => c.id != productId) : cart;
    saveCart(next);
    refreshSharedBadges();
    renderCatalog();
    renderWishlistView();
    renderCart();
  }

  function removeFromCart(productId) {
    saveCart(loadCart().filter((c) => c.id != productId));
    refreshSharedBadges();
    renderCatalog();
    renderWishlistView();
    renderCart();
  }

  /* -----------------------------------------------------------
     Render — catálogo
     ----------------------------------------------------------- */
  function getFilteredProducts() {
    let list = state.products;
    const term = normalize(state.search.trim());

    if (term) {
      return list.filter((p) => (
        normalize(p.name).includes(term) || normalize(p.color).includes(term) ||
        normalize(p.size).includes(term) || normalize(p.description || "").includes(term)
      ));
    }

    if (state.currentCategory) {
      list = list.filter((p) => (p.category || "accesorios") === state.currentCategory);
    }
    return list;
  }

  function getSortedProducts(list) {
    const sorted = list.slice();
    if (state.sort === "price-asc") {
      sorted.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (state.sort === "price-desc") {
      sorted.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (state.sort === "recent") {
      sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
    // "default" conserva el orden tal cual llega del servidor.
    return sorted;
  }

  function cartControlsTemplate(product) {
    const qty = cartQtyFor(product.id);
    if (qty === 0) {
      return `<button type="button" class="btn btn--primary btn--sm tag-card__add-btn" data-action="add-cart" data-id="${product.id}">Añadir al carrito</button>`;
    }
    return `
      <div class="tag-card__cart-row">
        <div class="qty-stepper">
          <button type="button" data-action="cart-minus" data-id="${product.id}" aria-label="Quitar una unidad">−</button>
          <span>${qty}</span>
          <button type="button" data-action="cart-plus" data-id="${product.id}" aria-label="Añadir una unidad">+</button>
        </div>
        <button type="button" class="cart-item__remove" data-action="cart-remove" data-id="${product.id}">Quitar</button>
      </div>
    `;
  }

  function wishlistBtnTemplate(product) {
    const active = isInWishlist(product.id);
    return `
      <button type="button" class="wishlist-btn ${active ? "is-active" : ""}" data-action="toggle-wishlist" data-id="${product.id}" aria-pressed="${active}" aria-label="${active ? "Quitar de la lista de deseos" : "Añadir a la lista de deseos"}" title="Lista de deseos">
        <svg viewBox="0 0 24 24" fill="${active ? "currentColor" : "none"}" aria-hidden="true"><path d="M12 20.2s-7.5-4.7-7.5-9.9A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3.3c0 5.2-7.5 9.9-7.5 9.9Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      </button>
    `;
  }

  function cardTemplate(product) {
    const swatch = swatchFor(product.color);
    const priceBadge = `<span class="tag-card__price">${formatBs(product.price)}</span>`;
    const adminButtons = state.isAdmin
      ? `<div class="tag-card__admin">
           <button type="button" class="tag-card__admin-btn" data-action="edit" data-id="${product.id}">Editar</button>
           <button type="button" class="tag-card__admin-btn tag-card__admin-btn--danger" data-action="delete" data-id="${product.id}">Eliminar</button>
         </div>`
      : "";

    return `
      <article class="tag-card" data-id="${product.id}">
        ${wishlistBtnTemplate(product)}
        <a class="tag-card__link" href="product.html?id=${encodeURIComponent(product.id)}" target="_blank" rel="noopener">
          <img class="tag-card__image" src="${imageUrl(product)}" alt="${escapeHtml(product.name)}" loading="lazy">
          <span class="tag-card__perforation" aria-hidden="true"></span>
          <div class="tag-card__top">
            <h3 class="tag-card__name">${escapeHtml(product.name)}</h3>
            ${priceBadge}
          </div>
          <div class="tag-card__meta">
            <span class="chip">Talla ${escapeHtml(product.size)}</span>
            <span class="chip"><i class="chip__swatch" style="background:${swatch}"></i>${escapeHtml(product.color)}</span>
          </div>
          <p class="tag-card__desc">${escapeHtml(product.description || "")}</p>
        </a>
        <div class="tag-card__cart">${cartControlsTemplate(product)}</div>
        ${adminButtons}
      </article>
    `;
  }

  function catalogTitleFor() {
    const term = state.search.trim();
    if (term) return { eyebrow: "Resultados de búsqueda", title: `“${term}”` };
    if (state.currentCategory) return { eyebrow: "Catálogo", title: categoryLabel(state.currentCategory) };
    return { eyebrow: "Catálogo", title: "Todos los productos" };
  }

  function renderCatalog() {
    const filtered = getSortedProducts(getFilteredProducts());
    els.catalogGrid.innerHTML = filtered.map(cardTemplate).join("");
    els.emptyState.hidden = filtered.length !== 0;
    els.statCount.textContent = filtered.length;

    const { eyebrow, title } = catalogTitleFor();
    els.catalogEyebrow.textContent = eyebrow;
    els.catalogTitle.textContent = title;
  }

  function renderWishlistView() {
    if (!els.wishlistGrid) return;
    const ids = loadWishlist();
    const items = state.products.filter((p) => ids.some((id) => id == p.id));
    els.wishlistGrid.innerHTML = items.map(cardTemplate).join("");
    els.wishlistEmptyState.hidden = items.length !== 0;
  }

  els.sortSelect.addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderCatalog();
  });

  document.querySelectorAll(".view-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-mode-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      state.cols = Number(btn.dataset.cols);
      els.catalogGrid.className = "catalog-grid catalog-grid--cols-" + state.cols;
    });
  });

  /* -----------------------------------------------------------
     Render — carrito
     ----------------------------------------------------------- */
  function renderCart() {
    if (!els.cartList) return;
    const cart = loadCart();
    if (cart.length === 0) {
      els.cartList.innerHTML = "";
      els.cartEmptyState.hidden = false;
      els.cartSummary.hidden = true;
      return;
    }
    els.cartEmptyState.hidden = true;
    els.cartSummary.hidden = false;

    els.cartList.innerHTML = cart.map((item) => `
      <div class="cart-item" data-id="${item.id}">
        <img class="cart-item__image" src="${item.image_url || PLACEHOLDER_IMAGE}" alt="${escapeHtml(item.name)}">
        <div class="cart-item__info">
          <p class="cart-item__name">${escapeHtml(item.name)}</p>
          <span class="cart-item__meta">Talla ${escapeHtml(item.size)} · ${escapeHtml(item.color)}</span>
        </div>
        <div class="qty-stepper">
          <button type="button" data-action="cart-minus" data-id="${item.id}" aria-label="Quitar una unidad">−</button>
          <span>${item.qty}</span>
          <button type="button" data-action="cart-plus" data-id="${item.id}" aria-label="Añadir una unidad">+</button>
        </div>
        <span class="cart-item__price">${formatBs(item.price * item.qty)}</span>
        <button type="button" class="cart-item__remove" data-action="cart-remove" data-id="${item.id}">Quitar</button>
      </div>
    `).join("");

    els.cartTotal.textContent = formatBs(cartTotalAmount());
  }

  /* -----------------------------------------------------------
     Vistas / navegación
     ----------------------------------------------------------- */
  function showView(viewName, opts) {
    opts = opts || {};
    document.querySelectorAll(".view").forEach((v) => { v.hidden = true; });
    const target = document.getElementById("view-" + viewName);
    if (target) target.hidden = false;
    state.currentView = viewName;
    document.body.dataset.view = viewName;

    if (viewName === "catalogo") {
      state.currentCategory = "cat" in opts ? opts.cat : state.currentCategory;
      if (opts.cat !== undefined) {
        state.search = "";
        els.searchInput.value = "";
      }
    }

    document.querySelectorAll(".drawer__link[data-view]").forEach((link) => {
      link.classList.toggle("is-active", link.dataset.view === viewName);
    });
    document.querySelectorAll(".drawer__link[data-cat]").forEach((link) => {
      link.classList.toggle("is-active", viewName === "catalogo" && link.dataset.cat === state.currentCategory);
    });

    closeDrawer();

    if (viewName === "catalogo") renderCatalog();
    if (viewName === "lista-deseos") renderWishlistView();
    if (viewName === "carrito") renderCart();
    if (viewName === "administracion") renderAdminView();
    if (viewName === "pedidos") loadOrders();

    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function openDrawer() {
    els.drawer.hidden = false;
    els.drawerOverlay.hidden = false;
    els.drawer.setAttribute("aria-hidden", "false");
  }
  function closeDrawer() {
    els.drawer.hidden = true;
    els.drawerOverlay.hidden = true;
    els.drawer.setAttribute("aria-hidden", "true");
  }

  els.menuBtn.addEventListener("click", openDrawer);
  els.drawerClose.addEventListener("click", closeDrawer);
  els.drawerOverlay.addEventListener("click", closeDrawer);

  document.querySelectorAll(".drawer__link[data-view]").forEach((link) => {
    link.addEventListener("click", () => showView(link.dataset.view));
  });

  els.drawerAdminBtn.addEventListener("click", () => showView("administracion"));
  els.brandHomeBtn.addEventListener("click", () => showView("home"));
  els.cartShortcutBtn.addEventListener("click", () => showView("carrito"));
  els.wishlistShortcutBtn.addEventListener("click", () => showView("lista-deseos"));

  /* -----------------------------------------------------------
     Modales genéricos
     ----------------------------------------------------------- */
  function closeModal(overlay) { overlay.hidden = true; }

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(document.getElementById(btn.dataset.close)));
  });
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(overlay); });
  });

  /* -----------------------------------------------------------
     Administración — login / sesión
     ----------------------------------------------------------- */
  function updateAuthUI() {
    els.adminControls.hidden = !state.isAdmin;
    els.drawerPedidosLink.hidden = !state.isAdmin;
    els.drawerAdminBtn.classList.toggle("is-admin", state.isAdmin);
  }

  function renderAdminView() {
    if (state.isAdmin) {
      els.adminLoginBlock.hidden = true;
      els.adminSessionBlock.hidden = false;
    } else {
      els.adminLoginBlock.hidden = false;
      els.adminSessionBlock.hidden = true;
      els.loginForm.reset();
      els.loginError.hidden = true;
    }
  }

  els.loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = els.loginUsername.value.trim();
    const password = els.loginPassword.value;

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Credenciales inválidas.");

      localStorage.setItem("ba_token", data.token);
      state.isAdmin = true;
      updateAuthUI();
      renderAdminView();
      renderCatalog();
      showToast("Bienvenido, administrador.");
    } catch (error) {
      els.loginError.textContent = error.message;
      els.loginError.hidden = false;
    }
  });

  els.logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("ba_token");
    state.isAdmin = false;
    updateAuthUI();
    renderAdminView();
    renderCatalog();
    if (state.currentView === "pedidos") showView("home");
    showToast("Sesión cerrada.");
  });

  /* -----------------------------------------------------------
     Alta / edición de producto
     ----------------------------------------------------------- */
  function populateCategorySelect() {
    els.productCategory.innerHTML = CATEGORIES.map((c) => `<option value="${c.slug}">${escapeHtml(c.label)}</option>`).join("");
  }
  populateCategorySelect();

  function openProductModal(product) {
    els.productForm.reset();
    els.productImageError.hidden = true;
    els.productImagePreview.hidden = true;
    els.productImagePreview.removeAttribute("src");
    els.productPriceError.hidden = true;

    if (product) {
      els.productModalEyebrow.textContent = "Editar ficha";
      els.productModalTitle.textContent = "Editar producto";
      els.productSubmitBtn.textContent = "Guardar cambios";
      els.productImageLabel.textContent = "Imagen (deja vacío para conservar la actual)";
      els.productId.value = product.id;
      els.productName.value = product.name;
      els.productCategory.value = product.category || "accesorios";
      els.productSize.value = product.size;
      els.productColor.value = product.color;
      els.productDescription.value = product.description;
      els.productPrice.value = product.price;
      if (product.image_url) {
        els.productImagePreview.src = imageUrl(product);
        els.productImagePreview.hidden = false;
      }
    } else {
      els.productModalEyebrow.textContent = "Nueva ficha";
      els.productModalTitle.textContent = "Añadir producto";
      els.productSubmitBtn.textContent = "Guardar producto";
      els.productImageLabel.textContent = "Imagen (obligatoria)";
      els.productId.value = "";
      els.productCategory.value = state.currentCategory || "accesorios";
    }
    els.productModalOverlay.hidden = false;
    els.productName.focus();
  }

  els.productImage.addEventListener("change", () => {
    const file = els.productImage.files[0];
    els.productImageError.hidden = true;
    if (!file) return;
    els.productImagePreview.src = URL.createObjectURL(file);
    els.productImagePreview.hidden = false;
  });

  els.addProductBtn.addEventListener("click", () => openProductModal(null));

  els.productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.isAdmin) return;

    const id = els.productId.value;
    const imageFile = els.productImage.files[0];

    if (!id && !imageFile) {
      els.productImageError.textContent = "Debes subir una imagen para el producto.";
      els.productImageError.hidden = false;
      els.productImage.focus();
      return;
    }

    els.productPriceError.hidden = true;
    const priceValue = parsePriceInput(els.productPrice.value);
    if (priceValue === null) {
      els.productPriceError.textContent = "Ingresa un precio válido (ej. 150.00 o 150,00).";
      els.productPriceError.hidden = false;
      els.productPrice.focus();
      return;
    }

    const token = localStorage.getItem("ba_token");
    const formData = new FormData();
    formData.append("name", els.productName.value.trim());
    formData.append("category", els.productCategory.value);
    formData.append("size", els.productSize.value.trim());
    formData.append("color", els.productColor.value.trim());
    formData.append("description", els.productDescription.value.trim());
    formData.append("price", String(priceValue));
    if (imageFile) formData.append("image", imageFile);

    try {
      const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;
      const method = id ? "PUT" : "POST";
      const response = await fetch(url, {
        method: method,
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Error al guardar");

      showToast(id ? "Producto actualizado." : "Producto añadido al catálogo.");
      closeModal(els.productModalOverlay);
      loadProducts();
    } catch (error) {
      showToast(error.message || "No se pudo completar la operación.");
    }
  });

  /* -----------------------------------------------------------
     Delegación de eventos — catálogo / lista de deseos (carrito, admin, deseos)
     ----------------------------------------------------------- */
  function handleGridClick(e) {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    const id = actionEl.dataset.id;
    const product = state.products.find((p) => p.id == id);

    if (action === "edit" || action === "delete") {
      e.preventDefault();
      if (!product) return;
      if (action === "edit") {
        openProductModal(product);
      } else {
        if (window.confirm(`¿Eliminar "${product.name}"?`)) {
          (async () => {
            try {
              const token = localStorage.getItem("ba_token");
              await fetch(`${API_URL}/products/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
              });
              loadProducts();
              showToast("Producto eliminado.");
            } catch (error) { showToast("Error al eliminar."); }
          })();
        }
      }
    } else if (action === "add-cart" || action === "cart-plus") {
      e.preventDefault();
      if (product) addToCart(product);
    } else if (action === "cart-minus") {
      e.preventDefault();
      decrementCart(id);
    } else if (action === "cart-remove") {
      e.preventDefault();
      removeFromCart(id);
    } else if (action === "toggle-wishlist") {
      e.preventDefault();
      toggleWishlist(id);
      refreshSharedBadges();
      renderCatalog();
      renderWishlistView();
    }
  }

  els.catalogGrid.addEventListener("click", handleGridClick);
  els.wishlistGrid.addEventListener("click", handleGridClick);

  els.searchInput.addEventListener("input", (e) => {
    state.search = e.target.value;
    if (state.currentView !== "catalogo") showView("catalogo");
    else renderCatalog();
  });

  /* -----------------------------------------------------------
     Delegación de eventos — carrito
     ----------------------------------------------------------- */
  els.cartList.addEventListener("click", (e) => {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const id = actionEl.dataset.id;
    const action = actionEl.dataset.action;
    if (action === "cart-plus") {
      const product = state.products.find((p) => p.id == id);
      if (product) addToCart(product);
    } else if (action === "cart-minus") {
      decrementCart(id);
    } else if (action === "cart-remove") {
      removeFromCart(id);
    }
  });

  els.cartOrderBtn.addEventListener("click", () => {
    if (loadCart().length === 0) return;
    showView("checkout");
  });

  /* -----------------------------------------------------------
     Checkout — formulario de pedido
     ----------------------------------------------------------- */
  function checkoutFieldsFilled() {
    return (
      els.checkoutName.value.trim() !== "" &&
      els.checkoutPhone.value.trim() !== "" &&
      els.checkoutEmail.value.trim() !== "" &&
      els.checkoutAddress.value.trim() !== ""
    );
  }

  function updateCheckoutSubmitState() {
    els.checkoutSubmitBtn.disabled = !checkoutFieldsFilled();
  }

  [els.checkoutName, els.checkoutPhone, els.checkoutEmail, els.checkoutAddress].forEach((input) => {
    input.addEventListener("input", updateCheckoutSubmitState);
  });

  els.checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cart = loadCart();
    if (!checkoutFieldsFilled() || cart.length === 0) return;

    els.checkoutError.hidden = true;
    els.checkoutSubmitBtn.disabled = true;
    els.checkoutSubmitBtn.textContent = "Enviando…";

    const payload = {
      full_name: els.checkoutName.value.trim(),
      phone: els.checkoutPhone.value.trim(),
      email: els.checkoutEmail.value.trim(),
      address: els.checkoutAddress.value.trim(),
      items: cart.map((c) => ({
        product_id: c.id, name: c.name, size: c.size, color: c.color,
        price: c.price, qty: c.qty,
      })),
      total: cartTotalAmount(),
    };

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo enviar el pedido.");

      saveCart([]);
      refreshSharedBadges();
      renderCart();
      renderCatalog();
      els.checkoutForm.reset();
      showToast("Pedido enviado. Nos pondremos en contacto contigo.");
      showView("home");
    } catch (error) {
      els.checkoutError.textContent = error.message || "No se pudo enviar el pedido.";
      els.checkoutError.hidden = false;
    } finally {
      els.checkoutSubmitBtn.textContent = "Pedir";
      updateCheckoutSubmitState();
    }
  });

  /* -----------------------------------------------------------
     Pedidos (solo admin)
     ----------------------------------------------------------- */
  async function loadOrders() {
    if (!state.isAdmin) return;
    const token = localStorage.getItem("ba_token");
    try {
      const response = await fetch(`${API_URL}/orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("No se pudieron cargar los pedidos.");
      state.orders = await response.json();
    } catch (error) {
      state.orders = [];
      showToast(error.message || "Error al cargar pedidos.");
    }
    renderOrders();
  }

  function renderOrders() {
    if (!els.ordersList) return;
    if (state.orders.length === 0) {
      els.ordersList.innerHTML = "";
      els.ordersEmptyState.hidden = false;
      return;
    }
    els.ordersEmptyState.hidden = true;
    els.ordersList.innerHTML = state.orders.map((order) => {
      let items = order.items;
      if (typeof items === "string") {
        try { items = JSON.parse(items); } catch (e) { items = []; }
      }
      items = Array.isArray(items) ? items : [];
      const date = order.created_at ? new Date(order.created_at).toLocaleString("es-BO") : "";
      const itemsHtml = items.map((it) => `
        <div class="order-card__item-row">
          <span>${escapeHtml(it.name)} · Talla ${escapeHtml(it.size || "")} · ${escapeHtml(it.color || "")} × ${it.qty}</span>
          <span>${formatBs(Number(it.price) * Number(it.qty))}</span>
        </div>
      `).join("");
      const status = order.status === "concluido" ? "concluido" : "pendiente";
      const isDone = status === "concluido";

      return `
        <article class="order-card ${isDone ? "order-card--done" : ""}" data-id="${order.id}">
          <div class="order-card__top">
            <span class="order-card__customer">${escapeHtml(order.full_name)}</span>
            <span class="order-status order-status--${status}">${ORDER_STATUS_LABEL[status]}</span>
          </div>
          <p class="order-card__contact">
            ${escapeHtml(order.phone)} · ${escapeHtml(order.email)}<br>
            ${escapeHtml(order.address)}
          </p>
          <div class="order-card__items">${itemsHtml}</div>
          <div class="order-card__total"><span>Total</span><span>${formatBs(order.total)}</span></div>
          <div class="order-card__actions">
            <span class="order-card__date">${escapeHtml(date)}</span>
            <div class="order-card__buttons">
              ${isDone
                ? `<button type="button" class="order-card__action-btn" data-action="order-uncomplete" data-id="${order.id}">Desmarcar</button>`
                : `<button type="button" class="order-card__action-btn order-card__action-btn--ok" data-action="order-complete" data-id="${order.id}">Concluir</button>`
              }
              <button type="button" class="order-card__action-btn order-card__action-btn--danger" data-action="order-delete" data-id="${order.id}">Eliminar</button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  els.ordersList.addEventListener("click", async (e) => {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const id = actionEl.dataset.id;
    const action = actionEl.dataset.action;
    const token = localStorage.getItem("ba_token");

    if (action === "order-delete") {
      if (!window.confirm("¿Eliminar este pedido por completo?")) return;
      actionEl.disabled = true;
      try {
        const response = await fetch(`${API_URL}/orders/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("No se pudo eliminar el pedido.");
        state.orders = state.orders.filter((o) => o.id != id);
        renderOrders();
        showToast("Pedido eliminado.");
      } catch (error) {
        showToast(error.message || "Error al eliminar el pedido.");
        actionEl.disabled = false;
      }
    } else if (action === "order-complete") {
      actionEl.disabled = true;
      try {
        const response = await fetch(`${API_URL}/orders/${id}/complete`, {
          method: "PATCH",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("No se pudo concluir el pedido.");
        const order = state.orders.find((o) => o.id == id);
        if (order) order.status = "concluido";
        renderOrders();
        showToast("Pedido marcado como concluido.");
      } catch (error) {
        showToast(error.message || "Error al concluir el pedido.");
        actionEl.disabled = false;
      }
    } else if (action === "order-uncomplete") {
      actionEl.disabled = true;
      try {
        const response = await fetch(`${API_URL}/orders/${id}/uncomplete`, {
          method: "PATCH",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("No se pudo desmarcar el pedido.");
        const order = state.orders.find((o) => o.id == id);
        if (order) order.status = "pendiente";
        renderOrders();
        showToast("Pedido marcado como pendiente.");
      } catch (error) {
        showToast(error.message || "Error al desmarcar el pedido.");
        actionEl.disabled = false;
      }
    }
  });

  /* -----------------------------------------------------------
     Init
     ----------------------------------------------------------- */
  async function init() {
    loadSession();
    updateAuthUI();
    refreshSharedBadges();
    renderHomeCategoryGrid();
    renderDrawerCategoryLinks();
    await loadProducts();
    renderCart();

    // Si venimos de "Comprar ahora" en la ficha de producto, saltamos
    // directo al formulario de pedido.
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get("cat");
    if (localStorage.getItem("ba_direct_checkout") === "1") {
      localStorage.removeItem("ba_direct_checkout");
      showView("checkout");
    } else if (catParam) {
      showView("catalogo", { cat: catParam });
    } else {
      showView("home");
    }
  }
  init();
})();