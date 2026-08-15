/* =============================================================
   BIO-ARCOIRIS — Ficha de producto (pestaña independiente)
   Depende de common.js (cargado antes que este archivo).
   ============================================================= */

(function () {
  "use strict";

  const els = {
    pageTitle: document.getElementById("pageTitle"),
    breadcrumb: document.getElementById("breadcrumb"),
    loading: document.getElementById("productLoading"),
    error: document.getElementById("productError"),
    detail: document.getElementById("productDetail"),
    image: document.getElementById("detailImage"),
    name: document.getElementById("detailName"),
    code: document.getElementById("detailCode"),
    meta: document.getElementById("detailMeta"),
    price: document.getElementById("detailPrice"),
    description: document.getElementById("detailDescription"),
    wishlistBtn: document.getElementById("wishlistToggleBtn"),
    addCartBtn: document.getElementById("addCartBtn"),
    buyNowBtn: document.getElementById("buyNowBtn"),
    recentSection: document.getElementById("recentViewedSection"),
    recentGrid: document.getElementById("recentViewedGrid"),
    toast: document.getElementById("toast"),
  };

  let toastTimer = null;
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, 2800);
  }

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  let currentProduct = null;

  function updateWishlistBtn() {
    if (!currentProduct) return;
    const active = isInWishlist(currentProduct.id);
    els.wishlistBtn.textContent = active ? "Quitar de la lista de deseos" : "Añadir a la lista de deseos";
    els.wishlistBtn.classList.toggle("is-active", active);
  }

  function renderRecentlyViewed() {
    const recent = loadRecentlyViewed().filter((id) => id != productId).slice(0, 2);
    if (recent.length === 0) {
      els.recentSection.hidden = true;
      return;
    }
    els.recentSection.hidden = false;
    els.recentGrid.innerHTML = "";

    Promise.all(recent.map((id) =>
      fetch(`${API_URL}/products/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    )).then((products) => {
      const valid = products.filter(Boolean);
      if (valid.length === 0) { els.recentSection.hidden = true; return; }
      els.recentGrid.innerHTML = valid.map((p) => `
        <a class="recent-viewed__card" href="product.html?id=${encodeURIComponent(p.id)}">
          <img src="${imageUrl(p)}" alt="${escapeHtml(p.name)}" loading="lazy">
          <div>
            <p class="recent-viewed__name">${escapeHtml(p.name)}</p>
            <span class="recent-viewed__price">${formatBs(p.price)}</span>
          </div>
        </a>
      `).join("");
    });
  }

  async function loadProduct() {
    if (!productId) {
      els.loading.hidden = true;
      els.error.hidden = false;
      return;
    }
    try {
      const response = await fetch(`${API_URL}/products/${encodeURIComponent(productId)}`);
      if (!response.ok) throw new Error("No encontrado");
      currentProduct = await response.json();
    } catch (e) {
      els.loading.hidden = true;
      els.error.hidden = false;
      return;
    }

    els.loading.hidden = true;
    els.detail.hidden = false;

    els.pageTitle.textContent = `${currentProduct.name} · Bio-Arcoiris`;
    els.breadcrumb.innerHTML = `<a href="index.html">Inicio</a> / <a href="index.html?cat=${encodeURIComponent(currentProduct.category || "accesorios")}">${escapeHtml(categoryLabel(currentProduct.category))}</a> / ${escapeHtml(currentProduct.name)}`;

    els.image.src = imageUrl(currentProduct);
    els.image.alt = currentProduct.name;
    els.name.textContent = currentProduct.name;
    els.code.textContent = currentProduct.id;
    els.price.textContent = formatBs(currentProduct.price);
    els.description.textContent = currentProduct.description || "Sin descripción disponible.";

    const swatch = swatchFor(currentProduct.color);
    els.meta.innerHTML = `
      <span class="chip">Talla ${escapeHtml(currentProduct.size)}</span>
      <span class="chip"><i class="chip__swatch" style="background:${swatch}"></i>${escapeHtml(currentProduct.color)}</span>
    `;

    updateWishlistBtn();

    // Guarda esta ficha como "recientemente visitada" y muestra las 2 anteriores.
    renderRecentlyViewed();
    pushRecentlyViewed(currentProduct.id);
  }

  els.wishlistBtn.addEventListener("click", () => {
    if (!currentProduct) return;
    toggleWishlist(currentProduct.id);
    updateWishlistBtn();
    refreshSharedBadges();
  });

  els.addCartBtn.addEventListener("click", () => {
    if (!currentProduct) return;
    addProductToCart(currentProduct, 1);
    refreshSharedBadges();
    showToast("Añadido al carrito.");
  });

  els.buyNowBtn.addEventListener("click", () => {
    if (!currentProduct) return;
    addProductToCart(currentProduct, 1);
    localStorage.setItem("ba_direct_checkout", "1");
    window.location.href = "index.html";
  });

  refreshSharedBadges();
  loadProduct();
})();