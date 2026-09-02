(function () {
  const products = window.FB_PRODUCTS || [];
  const sizes = window.FB_SIZES || [];
  const cartKey = "fb_cart_v1";

  const money = value => `${value} ₼`;
  const getCart = () => {
    try { return JSON.parse(localStorage.getItem(cartKey)) || []; }
    catch (_) { return []; }
  };
  const saveCart = cart => {
    localStorage.setItem(cartKey, JSON.stringify(cart));
    updateCartBadges();
  };
  const cartCount = () => getCart().reduce((sum, item) => sum + item.qty, 0);
  const findProduct = id => products.find(product => product.id === id);

  function updateCartBadges() {
    document.querySelectorAll("[data-cart-count]").forEach(el => {
      const count = cartCount();
      el.textContent = count;
      el.hidden = count === 0;
    });
  }

  function addToCart(id, size, qty = 1) {
    const cart = getCart();
    const existing = cart.find(item => item.id === id && item.size === Number(size));
    if (existing) existing.qty += qty;
    else cart.push({ id, size: Number(size), qty });
    saveCart(cart);
    showToast("Məhsul səbətə əlavə edildi");
  }

  function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.__fbToastTimer);
    window.__fbToastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function productCard(product) {
    return `<article class="product-card" data-category="${product.category}" data-color="${product.color.toLowerCase()}">
      <a class="product-image" href="product.html?id=${product.id}" aria-label="${product.name}">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <span class="product-type">${product.type}</span>
      </a>
      <div class="product-copy">
        <div class="product-row"><h3><a href="product.html?id=${product.id}">${product.name}</a></h3><strong>${money(product.price)}</strong></div>
        <p>${product.description}</p>
        <div class="product-actions"><span>${product.color} · 39–45</span><a href="product.html?id=${product.id}">Ətraflı bax →</a></div>
      </div>
    </article>`;
  }

  function renderProductGrid() {
    const grid = document.querySelector("[data-product-grid]");
    if (!grid) return;
    const limit = Number(grid.dataset.limit || products.length);
    grid.innerHTML = products.slice(0, limit).map(productCard).join("");

    const buttons = document.querySelectorAll("[data-filter]");
    buttons.forEach(button => button.addEventListener("click", () => {
      buttons.forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      const filter = button.dataset.filter;
      grid.innerHTML = products
        .filter(product => filter === "all" || product.category === filter || product.color.toLowerCase() === filter)
        .map(productCard).join("");
    }));
  }

  function renderProductPage() {
    const root = document.querySelector("[data-product-page]");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id") || products[0]?.id;
    const product = findProduct(id);
    if (!product) {
      root.innerHTML = `<div class="empty-state"><h1>Məhsul tapılmadı</h1><a class="button dark" href="catalog.html">Kataloqa qayıt</a></div>`;
      return;
    }
    document.title = `${product.name} — Fabio Borrelli`;
    root.innerHTML = `<div class="product-detail-grid">
      <div class="detail-image"><img src="${product.image}" alt="${product.name}"></div>
      <div class="detail-copy">
        <nav class="breadcrumbs" aria-label="Naviqasiya"><a href="index.html">Ana səhifə</a><span>/</span><a href="catalog.html">Kolleksiya</a><span>/</span><span>${product.name}</span></nav>
        <span class="eyebrow">${product.type} · ${product.color}</span>
        <h1>${product.name}</h1>
        <div class="detail-price">${money(product.price)}</div>
        <p class="detail-lede">${product.description}</p>
        <dl class="specs"><div><dt>Material</dt><dd>${product.material}</dd></div><div><dt>Detal</dt><dd>${product.accent}</dd></div><div><dt>Çatdırılma</dt><dd>Bakı daxili</dd></div><div><dt>Ödəniş</dt><dd>Qapıda nağd / kart</dd></div></dl>
        <div class="size-picker"><span>Ölçünü seçin</span><div>${sizes.map(size => `<button type="button" data-size="${size}">${size}</button>`).join("")}</div><small>Ölçü uyğun gəlmədikdə dəyişdirmə mümkündür.</small></div>
        <button class="button dark wide" type="button" data-add-product disabled>Səbətə əlavə et</button>
        <a class="text-link" href="tel:+994504890001">Ölçü ilə bağlı məsləhət alın: +994 50 489 00 01</a>
      </div>
    </div>`;

    let selectedSize = null;
    const addButton = root.querySelector("[data-add-product]");
    root.querySelectorAll("[data-size]").forEach(button => button.addEventListener("click", () => {
      root.querySelectorAll("[data-size]").forEach(item => item.classList.remove("selected"));
      button.classList.add("selected");
      selectedSize = button.dataset.size;
      addButton.disabled = false;
    }));
    addButton.addEventListener("click", () => {
      addToCart(product.id, selectedSize);
      addButton.textContent = "Səbətə əlavə edildi ✓";
      setTimeout(() => addButton.textContent = "Səbətə əlavə et", 1800);
    });
  }

  function renderCart() {
    const root = document.querySelector("[data-cart-page]");
    if (!root) return;
    const cart = getCart();
    if (!cart.length) {
      root.innerHTML = `<div class="empty-state"><span class="eyebrow">Səbət</span><h1>Səbətiniz boşdur</h1><p>Kolleksiyadan bəyəndiyiniz modeli və ölçünü seçin.</p><a class="button dark" href="catalog.html">Kolleksiyaya bax</a></div>`;
      return;
    }

    const rows = cart.map((item, index) => {
      const product = findProduct(item.id);
      if (!product) return "";
      return `<article class="cart-item">
        <img src="${product.image}" alt="${product.name}">
        <div class="cart-copy"><h3><a href="product.html?id=${product.id}">${product.name}</a></h3><p>${product.type} · ${product.color}</p><span>Ölçü: ${item.size}</span></div>
        <div class="qty-control"><button type="button" data-qty="minus" data-index="${index}" aria-label="Azalt">−</button><span>${item.qty}</span><button type="button" data-qty="plus" data-index="${index}" aria-label="Artır">+</button></div>
        <strong>${money(product.price * item.qty)}</strong>
        <button class="remove-item" type="button" data-remove="${index}">Sil</button>
      </article>`;
    }).join("");
    const total = cart.reduce((sum, item) => sum + (findProduct(item.id)?.price || 0) * item.qty, 0);
    root.innerHTML = `<div class="cart-layout"><div><span class="eyebrow">Səbətiniz</span><h1>${cartCount()} məhsul</h1><div class="cart-list">${rows}</div></div><aside class="order-summary"><h2>Sifariş xülasəsi</h2><div><span>Məhsullar</span><strong>${money(total)}</strong></div><div><span>Bakı daxili çatdırılma</span><strong>0 ₼</strong></div><div class="summary-total"><span>Cəmi</span><strong>${money(total)}</strong></div><a class="button gold wide" href="checkout.html">Sifarişi rəsmiləşdir</a><a class="text-link center" href="catalog.html">Alış-verişə davam et</a></aside></div>`;

    root.querySelectorAll("[data-qty]").forEach(button => button.addEventListener("click", () => {
      const current = getCart();
      const index = Number(button.dataset.index);
      current[index].qty += button.dataset.qty === "plus" ? 1 : -1;
      if (current[index].qty <= 0) current.splice(index, 1);
      saveCart(current); renderCart();
    }));
    root.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", () => {
      const current = getCart(); current.splice(Number(button.dataset.remove), 1); saveCart(current); renderCart();
    }));
  }

  function renderCheckout() {
    const root = document.querySelector("[data-checkout-summary]");
    const form = document.querySelector("[data-checkout-form]");
    if (!root || !form) return;
    const cart = getCart();
    if (!cart.length) {
      location.replace("cart.html");
      return;
    }
    const total = cart.reduce((sum, item) => sum + (findProduct(item.id)?.price || 0) * item.qty, 0);
    root.innerHTML = `<h2>Sifarişiniz</h2>${cart.map(item => { const p = findProduct(item.id); return `<div class="checkout-line"><img src="${p.image}" alt=""><span><b>${p.name}</b><small>Ölçü ${item.size} · ${item.qty} ədəd</small></span><strong>${money(p.price * item.qty)}</strong></div>`; }).join("")}<div class="summary-total"><span>Cəmi</span><strong>${money(total)}</strong></div><p class="summary-note">Çatdırılma və uyğun vaxt sifariş təsdiqlənərkən dəqiqləşdirilir.</p>`;

    form.addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(form);
      const lines = cart.map(item => {
        const p = findProduct(item.id);
        return `• ${p.name}, ölçü ${item.size}, ${item.qty} ədəd — ${money(p.price * item.qty)}`;
      });
      const message = [
        "Salam! Fabio Borrelli saytından sifariş vermək istəyirəm:", "", ...lines, "", `Cəmi: ${money(total)}`, "",
        `Ad: ${data.get("name")}`, `Telefon: ${data.get("phone")}`, `Ünvan: ${data.get("address")}`, data.get("note") ? `Qeyd: ${data.get("note")}` : ""
      ].filter(Boolean).join("\n");
      window.open(`https://wa.me/994504890001?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    });
  }

  function initNavigation() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-mobile-menu]");
    if (toggle && menu) {
      toggle.addEventListener("click", () => {
        const open = menu.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    }
  }

  initNavigation();
  updateCartBadges();
  renderProductGrid();
  renderProductPage();
  renderCart();
  renderCheckout();
})();
