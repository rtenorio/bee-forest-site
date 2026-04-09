/* ============================================================
   BEE FOREST — loja.js
   Products rendering, cart (localStorage), Stripe Checkout
   ============================================================ */

(function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────────
  // Stripe public key is injected via meta tag or window variable
  const STRIPE_PUBLIC_KEY = document.querySelector('meta[name="stripe-key"]')?.content
    || window.STRIPE_PUBLIC_KEY
    || '';

  const API_BASE = 'https://bee-forest-app-production.up.railway.app'; // Railway backend

  // ── State ─────────────────────────────────────────────────────
  let products = [];
  let cart     = loadCart();
  let stripe   = null;

  // ── DOM refs ──────────────────────────────────────────────────
  const grid        = document.getElementById('product-grid');
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartItems   = document.getElementById('cart-items');
  const cartTotal   = document.getElementById('cart-total-value');
  const cartBadge   = document.getElementById('cart-badge');
  const cartToggle  = document.getElementById('cart-toggle');
  const cartClose   = document.getElementById('cart-close');
  const checkoutBtn = document.getElementById('checkout-btn');

  // ── Init ──────────────────────────────────────────────────────
  async function init() {
    await loadProducts();
    renderGrid(products);
    renderCart();
    bindCartUI();
    bindFilters();

    // Init Stripe if key available
    if (STRIPE_PUBLIC_KEY && typeof Stripe !== 'undefined') {
      stripe = Stripe(STRIPE_PUBLIC_KEY);
    }
  }

  // ── Load Products ─────────────────────────────────────────────
  async function loadProducts() {
    try {
      const res = await fetch('data/products.json');
      products  = await res.json();
    } catch (e) {
      console.error('Failed to load products.json', e);
      products = [];
    }
  }

  // ── Render Grid ───────────────────────────────────────────────
  function renderGrid(items) {
    if (!grid) return;
    grid.innerHTML = '';

    if (!items.length) {
      grid.innerHTML = '<p class="text-mid" style="padding:2rem 0">Nenhum produto encontrado.</p>';
      return;
    }

    items.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.dataset.category = p.categoria;

      const imgHTML = p.imagem
        ? `<img src="${p.imagem}" alt="${p.nome}" loading="lazy">`
        : `<svg class="product-card__placeholder" viewBox="0 0 80 80" fill="none">
             <circle cx="40" cy="30" r="12" stroke="#C9A84C" stroke-width="2"/>
             <path d="M16 60c0-13.255 10.745-24 24-24s24 10.745 24 24" stroke="#C9A84C" stroke-width="2"/>
           </svg>`;

      const badgeHTML = p.destaque
        ? `<span class="product-card__badge">Destaque</span>`
        : '';

      const ingredientesHTML = p.ingredientes?.length
        ? p.ingredientes.map(i => `<span class="ingredient-tag">${i}</span>`).join('')
        : '';

      card.innerHTML = `
        <div class="product-card__img-wrap">
          ${imgHTML}
          ${badgeHTML}
        </div>
        <div class="product-card__body">
          <div>
            <p class="product-card__category">${p.categoria}</p>
            <h3 class="product-card__name">${p.nome}</h3>
            <p class="product-card__sub">${p.subtitulo}</p>
            <p class="product-card__desc">${p.descricao}</p>
            ${ingredientesHTML ? `<div class="luxe-product-card__ingredients" style="margin-bottom:1rem">${ingredientesHTML}</div>` : ''}
          </div>
          <div class="product-card__footer">
            <div class="product-card__price">
              R$ ${p.preco.toFixed(2).replace('.', ',')}
            </div>
            <button class="btn btn-gold btn-sm add-to-cart" data-id="${p.id}">
              + Carrinho
            </button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    // Bind add-to-cart buttons
    grid.querySelectorAll('.add-to-cart').forEach((btn) => {
      btn.addEventListener('click', () => addToCart(btn.dataset.id));
    });
  }

  // ── Filter ────────────────────────────────────────────────────
  function bindFilters() {
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const cat = btn.dataset.filter;
        const filtered = cat === 'all' ? products : products.filter(p => p.categoria === cat);
        renderGrid(filtered);
      });
    });
  }

  // ── Cart ──────────────────────────────────────────────────────
  function loadCart() {
    try { return JSON.parse(localStorage.getItem('bf_cart') || '[]'); }
    catch { return []; }
  }

  function saveCart() {
    localStorage.setItem('bf_cart', JSON.stringify(cart));
  }

  function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const existing = cart.find(i => i.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: product.id, nome: product.nome, preco: product.preco, imagem: product.imagem, qty: 1 });
    }
    saveCart();
    renderCart();
    openCart();
    window.BF?.toast?.(`${product.nome} adicionado ao carrinho`, 'success');
  }

  function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    renderCart();
  }

  function cartTotal_() {
    return cart.reduce((sum, i) => sum + i.preco * i.qty, 0);
  }

  function renderCart() {
    if (!cartItems) return;

    // Badge
    const count = cart.reduce((s, i) => s + i.qty, 0);
    if (cartBadge) {
      cartBadge.textContent = count > 0 ? count : '';
      cartBadge.dataset.count = count;
    }

    // Items
    if (!cart.length) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty__icon">🛒</div>
          <p class="cart-empty__text">Seu carrinho está vazio</p>
        </div>
      `;
    } else {
      cartItems.innerHTML = cart.map(item => {
        const imgHTML = item.imagem
          ? `<img class="cart-item__img" src="${item.imagem}" alt="${item.nome}">`
          : `<div class="cart-item__img" style="background:var(--cream);display:flex;align-items:center;justify-content:center;font-size:1.5rem">🍯</div>`;
        return `
          <div class="cart-item" data-id="${item.id}">
            ${imgHTML}
            <div>
              <p class="cart-item__name">${item.nome}${item.qty > 1 ? ` ×${item.qty}` : ''}</p>
              <p class="cart-item__price">R$ ${(item.preco * item.qty).toFixed(2).replace('.', ',')}</p>
            </div>
            <button class="cart-item__remove" title="Remover" data-remove="${item.id}">×</button>
          </div>
        `;
      }).join('');

      cartItems.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => removeFromCart(btn.dataset.remove));
      });
    }

    // Total
    if (cartTotal) {
      cartTotal.textContent = `R$ ${cartTotal_().toFixed(2).replace('.', ',')}`;
    }
  }

  function openCart()  {
    cartSidebar?.classList.add('is-open');
    cartOverlay?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    cartSidebar?.classList.remove('is-open');
    cartOverlay?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function bindCartUI() {
    cartToggle?.addEventListener('click', openCart);
    cartClose?.addEventListener('click', closeCart);
    cartOverlay?.addEventListener('click', closeCart);
    checkoutBtn?.addEventListener('click', handleCheckout);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCart();
    });
  }

  // ── Stripe Checkout ───────────────────────────────────────────
  async function handleCheckout() {
    if (!cart.length) {
      window.BF?.toast?.('Adicione produtos ao carrinho primeiro', '');
      return;
    }

    if (!stripe) {
      window.BF?.toast?.('Pagamento não disponível no momento. Entre em contato.', 'error');
      return;
    }

    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Processando…';

    try {
      const res = await fetch(`${API_BASE}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ id: i.id, qty: i.qty })),
          success_url: `${window.location.origin}/loja.html?sucesso=1`,
          cancel_url:  `${window.location.origin}/loja.html?cancelado=1`,
        }),
      });

      if (!res.ok) throw new Error('Erro ao criar sessão de pagamento');
      const { sessionId } = await res.json();
      await stripe.redirectToCheckout({ sessionId });
    } catch (err) {
      window.BF?.toast?.(err.message || 'Erro ao processar pagamento', 'error');
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = 'Finalizar Compra';
    }
  }

  // ── Handle return from Stripe ─────────────────────────────────
  const params = new URLSearchParams(window.location.search);
  if (params.get('sucesso') === '1') {
    cart = [];
    saveCart();
    setTimeout(() => window.BF?.toast?.('Pedido realizado com sucesso! Obrigado 🐝', 'success'), 500);
    history.replaceState({}, '', window.location.pathname);
  } else if (params.get('cancelado') === '1') {
    setTimeout(() => window.BF?.toast?.('Pagamento cancelado. Seu carrinho foi preservado.', ''), 500);
    history.replaceState({}, '', window.location.pathname);
  }

  // ── Start ─────────────────────────────────────────────────────
  init();

})();
