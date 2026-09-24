(function () {
  const products = window.FB_PRODUCTS || [];
  const sizes = window.FB_SIZES || [];
  const cartKey = "fb_cart_v1";

  const money = value => `${value} ₼`;
  const productUrl = product => `product-${product.id}.html`;
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
    const availableSizes = product.sizes || sizes;
    return `<article class="product-card" data-category="${product.category}" data-color="${product.color.toLowerCase()}">
      <a class="product-image" href="${productUrl(product)}" aria-label="${product.name}">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <span class="product-type">${product.type}</span>
      </a>
      <div class="product-copy">
        <div class="product-row"><h3><a href="${productUrl(product)}">${product.name}</a></h3><strong>${money(product.price)}</strong></div>
        <p>${product.description}</p>
        <div class="product-actions"><span>${product.color} · ${availableSizes[0]}–${availableSizes[availableSizes.length - 1]}</span><a href="${productUrl(product)}">Ətraflı bax →</a></div>
      </div>
    </article>`;
  }

  function renderProductGrid() {
    const grid = document.querySelector("[data-product-grid]");
    if (!grid) return;
    const limit = Number(grid.dataset.limit || products.length);
    const bar = document.querySelector(".filter-bar");
    if (!bar) {
      grid.innerHTML = products.slice(0, limit).map(productCard).join("");
      return;
    }

    const categories = [["all", "Hamısı"], ["loafer", "Loafer"], ["classic", "Klassik"], ["sneaker", "Sneaker"]];
    const colors = [...new Set(products.map(product => product.color))];
    const swatches = {"Qara":"#202020","Lacivərd":"#25354b","Qəhvəyi":"#79543b","Bej":"#d9c6a8","Boz":"#969696","Zeytun":"#74754c","Mavi":"#719cb8","Fıstıq yaşılı":"#b1bd8e"};
    const params = new URLSearchParams(location.search);
    let category = categories.some(([key]) => key === params.get("category")) ? params.get("category") : "all";
    let color = colors.includes(params.get("color")) ? params.get("color") : "all";
    bar.className = "catalog-filters";
    bar.innerHTML = '<fieldset><legend>Kateqoriya</legend><div class="catalog-filter-options">' +
      categories.map(([key, label]) => '<button type="button" data-category-filter="' + key + '">' + label + '</button>').join("") +
      '</div></fieldset><fieldset><legend>Rəng</legend><div class="catalog-filter-options"><button type="button" data-color-filter="all">Bütün rənglər</button>' +
      colors.map(label => '<button type="button" data-color-filter="' + label + '"><span class="color-swatch" aria-hidden="true" style="background:' + (swatches[label] || "#ccc") + '"></span>' + label + '</button>').join("") +
      '</div></fieldset><div class="catalog-filter-summary"><span data-filter-count role="status" aria-live="polite"></span><button type="button" data-filter-reset>Filtrləri sıfırla</button></div>';
    const style = document.createElement("style");
    style.textContent = '.catalog-filters{margin-bottom:34px}.catalog-filters fieldset{border:0;padding:0;margin:0 0 22px;min-width:0}.catalog-filters legend{font-size:16px;font-weight:600;margin-bottom:10px}.catalog-filter-options{display:flex;flex-wrap:wrap;gap:8px}.catalog-filters button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;border:1px solid var(--line);background:transparent;color:var(--ink);padding:10px 16px;font-size:14px;cursor:pointer}.catalog-filters button[aria-pressed="true"]{background:var(--espresso);color:#fff;border-color:var(--espresso)}.catalog-filters button:focus-visible{outline:2px solid var(--gold);outline-offset:3px}.color-swatch{width:16px;height:16px;flex-shrink:0;border-radius:50%;border:1px solid rgba(128,128,128,.6)}.catalog-filter-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:14px}.catalog-filters [data-filter-reset]{text-decoration:underline;border:0;padding:8px 0}.catalog-filters [hidden]{display:none}.catalog-empty{grid-column:1/-1;padding:40px 20px;text-align:center;border:1px solid var(--line)}';
    document.head.appendChild(style);

    function render(syncUrl) {
      const filtered = products.filter(product =>
        (category === "all" || product.category === category) &&
        (color === "all" || product.color === color));
      grid.innerHTML = filtered.length ? filtered.map(productCard).join("") :
        '<div class="catalog-empty"><p>Bu seçimə uyğun model tapılmadı.</p><button class="button dark" type="button" data-empty-reset>Filtrləri sıfırla</button></div>';
      bar.querySelector("[data-filter-count]").textContent = filtered.length + " model";
      bar.querySelector("[data-filter-reset]").hidden = category === "all" && color === "all";
      bar.querySelectorAll("[data-category-filter]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.categoryFilter === category)));
      bar.querySelectorAll("[data-color-filter]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.colorFilter === color)));
      if (syncUrl) {
        const url = new URL(location.href);
        if (category === "all") url.searchParams.delete("category");
        else url.searchParams.set("category", category);
        if (color === "all") url.searchParams.delete("color");
        else url.searchParams.set("color", color);
        history.replaceState(null, "", url);
      }
    }
    bar.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button || !bar.contains(button)) return;
      if (button.hasAttribute("data-category-filter")) category = button.dataset.categoryFilter;
      else if (button.hasAttribute("data-color-filter")) color = button.dataset.colorFilter;
      else if (button.hasAttribute("data-filter-reset")) { category = "all"; color = "all"; }
      else return;
      render(true);
    });
    grid.addEventListener("click", event => {
      if (event.target.closest("[data-empty-reset]")) {
        category = "all"; color = "all"; render(true);
        bar.querySelector("[data-category-filter]").focus();
      }
    });
    render(false);
  }

  function renderProductPage() {
    const root = document.querySelector("[data-product-page]");
    if (!root) return;
    if (!document.querySelector(".site-header")) {
      document.body.insertAdjacentHTML("afterbegin", `<header class="site-header"><div class="container header-inner"><a class="brand" href="index.html"><img src="assets/images/logo.png?v=601dc107bcbf" alt="Fabio Borrelli"></a><nav class="main-nav"><a href="index.html">Ana səhifə</a><a class="active" href="catalog.html">Kolleksiya</a><a href="about.html">Haqqımızda</a></nav><div class="header-tools"><a class="phone-link" href="tel:+994504890001">+994 50 489 00 01</a><a class="cart-link" href="cart.html">Səbət <span class="cart-count" data-cart-count hidden>0</span></a></div></div></header>`);
      document.body.insertAdjacentHTML("beforeend", `<footer class="site-footer"><div class="container"><div class="footer-bottom"><span>© 2026 Fabio Borrelli</span><span>Qapıda ödəniş · Ölçü dəyişdirmə mümkündür</span></div></div></footer>`);
      updateCartBadges();
    }
    const id = root.dataset.productId || new URLSearchParams(location.search).get("id") || products[0]?.id;
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
        <div class="size-picker"><span>Ölçünü seçin</span><div>${(product.sizes || sizes).map(size => `<button type="button" data-size="${size}">${size}</button>`).join("")}</div><small>Ölçü uyğun gəlmədikdə dəyişdirmə mümkündür.</small></div>
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
        <div class="cart-copy"><h3><a href="${productUrl(product)}">${product.name}</a></h3><p>${product.type} · ${product.color}</p><span>Ölçü: ${item.size}</span></div>
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
