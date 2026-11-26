// ============================================================================
// 1. DEFAULT SEED DATA & STATE MANAGEMENT
// ============================================================================
const STORAGE_KEY_PRODUCTS = 'fitshop_products_v1';
const STORAGE_KEY_SETTINGS = 'fitshop_settings_v1';
const STORAGE_KEY_ORDERS = 'fitshop_orders_v1';
const STORAGE_KEY_CART = 'fitshop_cart_v1';
const STORAGE_KEY_THEME = 'fitshop_theme_v1';
const STORAGE_KEY_AUTH = 'fitshop_owner_auth_v1';

const OWNER_CREDENTIALS = {
  username: 'owner@fitshop.com',
  password: 'FITSHOP2026'
};

const DEFAULT_SETTINGS = {
  brandName: 'FITSHOP',
  heroTitleLine1: 'ELEVATE',
  heroTitleLine2: 'EVERY WORKOUT!',
  heroDescription:
    'Discover high-performance gym wear designed for strength, comfort, and durability. From breathable fabrics to sleek fits, our collection helps you push limits while looking your best inside and outside the gym.',
  heroImage:
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1000&q=85',
  heroRating: '4.9 / 5',
  heroReviewCount: '1,200+ reviews',
  showcaseWatermark: 'FITSHOP',
  showcaseLeftImg:
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=85',
  showcaseCenterImg:
    'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=900&q=85',
  showcaseRightImg:
    'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=800&q=85',
  showcaseLeftCaption:
    'Engineered for peak performance, our gym clothes are crafted from lightweight, sweat-wicking fabrics that move with you.',
  showcaseRightCaption:
    'With supportive compression and breathable stretch, every piece is designed to boost endurance and keep you cool through every set.',
  editorialTitle: 'Performance-Driven Apparel',
  editorialBody:
    'Built with advanced moisture-wicking fabrics and ergonomic seams, every stitch is engineered to eliminate distractions during heavy compound lifts, high-intensity intervals, and everyday recovery.',
  editorialImg:
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=85',
  bannerTitle: 'PUSH YOUR LIMITS IN STYLE',
  bannerSubtitle:
    'Upgrade your training rotation with four-way stretch compression layers built for modern athletes.',
  bannerImg:
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=85',
  promoTitle: 'GET 25% OFF YOUR FIRST ORDER',
  promoSubtitle:
    'Join the FITSHOP training club for early drops, restock alerts, and 25% off your first gear bundle.',
  supportEmail: 'support@fitshop.com',
  supportPhone: '+1 (800) 555-0199',
  hqLocation: '742 Performance Way, Austin, TX'
};

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'FlexCore Seamless Leggings',
    category: 'Women',
    price: 68.0,
    compareAtPrice: 82.0,
    stock: 42,
    badge: 'BESTSELLER',
    featured: true,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Slate Blue', 'Obsidian Black', 'Sage Mist'],
    image:
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=85',
    description:
      'Second-skin sculpted high-waisted leggings crafted with ultra-breathable 4-way stretch knit and zero front seam for unrestricted squat confidence.'
  },
  {
    id: 'prod-2',
    name: 'AeroTech Compression Tee',
    category: 'Men',
    price: 45.0,
    compareAtPrice: null,
    stock: 64,
    badge: 'NEW',
    featured: true,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Glacier Ice', 'Charcoal', 'Navy'],
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85',
    description:
      'Targeted muscle-mapping compression top with laser-perforated back ventilation zones that accelerate sweat evaporation during intense conditioning.'
  },
  {
    id: 'prod-3',
    name: 'PowerLift Pro Training Shorts',
    category: 'Men',
    price: 52.0,
    compareAtPrice: 60.0,
    stock: 31,
    badge: 'TOP RATED',
    featured: true,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Graphite', 'Ice Grey', 'Olive'],
    image:
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=85',
    description:
      '7-inch inseam athletic shorts featuring ripstop outer shell, internal compression liner, and zippered side pockets for secure phone storage.'
  },
  {
    id: 'prod-4',
    name: 'Velocity Sculpt Sports Bra',
    category: 'Women',
    price: 42.0,
    compareAtPrice: null,
    stock: 55,
    badge: 'ESSENTIAL',
    featured: true,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Arctic Mist', 'Carbon', 'Blush'],
    image:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=85',
    description:
      'Medium-to-high impact racerback support bra with removable molded pads and brushed soft-touch interior band.'
  },
  {
    id: 'prod-5',
    name: 'Hyperion Zip Training Hoodie',
    category: 'Men',
    price: 78.0,
    compareAtPrice: 92.0,
    stock: 19,
    badge: 'LIMITED',
    featured: false,
    sizes: ['M', 'L', 'XL'],
    colors: ['Storm Grey', 'Jet Black'],
    image:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=85',
    description:
      'Lightweight thermo-regulating warmup hoodie engineered with articulated raglan sleeves and matte waterproof zippers.'
  },
  {
    id: 'prod-6',
    name: 'Apex Carbon Gym Duffel 40L',
    category: 'Accessories',
    price: 89.0,
    compareAtPrice: null,
    stock: 24,
    badge: 'PRO GEAR',
    featured: false,
    sizes: ['One Size'],
    colors: ['Stealth Black', 'Slate'],
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=85',
    description:
      'Weather-resistant 40L gym duffel with ventilated shoe compartment, insulated shaker sleeve, and padded laptop divider.'
  },
  {
    id: 'prod-7',
    name: 'Strive Ribbed Crop Tank',
    category: 'Women',
    price: 38.0,
    compareAtPrice: null,
    stock: 48,
    badge: 'NEW',
    featured: false,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Cloud White', 'Steel Blue', 'Black'],
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=85',
    description:
      'Seamless micro-ribbed studio and lifting tank with built-in shelf support and anti-odor silver-ion finish.'
  },
  {
    id: 'prod-8',
    name: 'Titan Lever Lifting Belt 10mm',
    category: 'Accessories',
    price: 95.0,
    compareAtPrice: 115.0,
    stock: 14,
    badge: 'HEAVY DUTY',
    featured: false,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Matte Black'],
    image:
      'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=800&q=85',
    description:
      'Competition-grade 10mm vegetable-tanned suede leather belt with quick-release cast alloy lever for maximal intra-abdominal bracing.'
  }
];

const DEFAULT_ORDERS = [
  {
    id: 'ORD-8942',
    customerName: 'Marcus Vance',
    customerEmail: 'marcus.vance@example.com',
    address: '410 Mercer St, New York, NY 10013',
    date: '2026-05-12',
    status: 'Delivered',
    total: 142.0,
    items: [
      { name: 'AeroTech Compression Tee', size: 'L', qty: 2, price: 45.0 },
      { name: 'PowerLift Pro Training Shorts', size: 'L', qty: 1, price: 52.0 }
    ]
  },
  {
    id: 'ORD-8943',
    customerName: 'Elena Rostova',
    customerEmail: 'elena.r@example.com',
    address: '882 Sunset Blvd, Los Angeles, CA 90069',
    date: '2026-05-14',
    status: 'Shipped',
    total: 110.0,
    items: [
      { name: 'FlexCore Seamless Leggings', size: 'S', qty: 1, price: 68.0 },
      { name: 'Velocity Sculpt Sports Bra', size: 'S', qty: 1, price: 42.0 }
    ]
  },
  {
    id: 'ORD-8944',
    customerName: 'Devon Brooks',
    customerEmail: 'dbrooks.fit@example.com',
    address: '1902 Congress Ave, Austin, TX 78701',
    date: '2026-05-15',
    status: 'Processing',
    total: 184.0,
    items: [
      { name: 'Titan Lever Lifting Belt 10mm', size: 'M', qty: 1, price: 95.0 },
      { name: 'Apex Carbon Gym Duffel 40L', size: 'One Size', qty: 1, price: 89.0 }
    ]
  }
];

// ============================================================================
// 2. LOAD & PERSIST STATE HELPERS
// ============================================================================
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return JSON.parse(JSON.stringify(fallback));
    return JSON.parse(raw);
  } catch (e) {
    return JSON.parse(JSON.stringify(fallback));
  }
}

const state = {
  products: loadFromStorage(STORAGE_KEY_PRODUCTS, DEFAULT_PRODUCTS),
  siteSettings: { ...DEFAULT_SETTINGS, ...loadFromStorage(STORAGE_KEY_SETTINGS, DEFAULT_SETTINGS) },
  orders: loadFromStorage(STORAGE_KEY_ORDERS, DEFAULT_ORDERS),
  cart: loadFromStorage(STORAGE_KEY_CART, []),
  theme: localStorage.getItem(STORAGE_KEY_THEME) || 'light',
  isOwnerAuthenticated: sessionStorage.getItem(STORAGE_KEY_AUTH) === 'true',
  activeView: 'home', // 'home' | 'shop' | 'login' | 'dashboard'
  activeCategory: 'All', // 'All' | 'Men' | 'Women' | 'Accessories'
  searchQuery: '',
  selectedProductModal: null,
  selectedModalSize: null,
  selectedModalColor: null,
  isCartOpen: false,
  isCheckoutOpen: false,
  checkoutSuccessOrder: null,
  dashboardTab: 'overview', // 'overview' | 'products' | 'orders' | 'content'
  editingProduct: null, // null | 'new' | productObj
  adminSearchQuery: '',
  loginError: '',
  heroAnimPlayed: false
};

function saveProducts() {
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(state.products));
}
function saveSettings() {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(state.siteSettings));
}
function saveOrders() {
  localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(state.orders));
}
function saveCart() {
  localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(state.cart));
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMoney(amount) {
  return '$' + Number(amount || 0).toFixed(2);
}

// ============================================================================
// 3. TOAST NOTIFICATIONS & THEME
// ============================================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const bgClass =
    type === 'error'
      ? 'bg-red-600 text-white'
      : state.theme === 'dark'
      ? 'bg-white text-zinc-900'
      : 'bg-[#111315] text-white';

  toast.className = `${bgClass} px-4 py-3 rounded-xl shadow-xl text-xs font-semibold tracking-wide flex items-center gap-2.5 transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto border border-black/10`;
  toast.innerHTML = `
    <span class="w-2 h-2 rounded-full ${type === 'error' ? 'bg-white' : 'bg-[#6E92B5]'}"></span>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem(STORAGE_KEY_THEME, state.theme);
  applyThemeClass();
  render();
}

function applyThemeClass() {
  if (state.theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.className =
      'bg-[#121216] text-[#F3F4F6] antialiased selection:bg-[#6E92B5] selection:text-white transition-colors duration-300';
  } else {
    document.documentElement.classList.remove('dark');
    document.body.className =
      'bg-[#F4F5F7] text-[#111315] antialiased selection:bg-[#6E92B5] selection:text-white transition-colors duration-300';
  }
}

// ============================================================================
// 4. CART & CHECKOUT ACTIONS
// ============================================================================
function getCartCount() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

function getCartSubtotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function addToCart(productId, size = null, color = null, qty = 1) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;
  if (product.stock <= 0) {
    showToast('This item is currently out of stock.', 'error');
    return;
  }

  const chosenSize = size || (product.sizes && product.sizes[0]) || 'M';
  const chosenColor = color || (product.colors && product.colors[0]) || 'Standard';

  const existing = state.cart.find(
    (item) =>
      item.productId === productId &&
      item.size === chosenSize &&
      item.color === chosenColor
  );

  if (existing) {
    existing.qty = Math.min(product.stock, existing.qty + qty);
  } else {
    state.cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: chosenSize,
      color: chosenColor,
      qty: Math.min(product.stock, qty)
    });
  }

  saveCart();
  state.selectedProductModal = null;
  state.isCartOpen = true;
  render();
  showToast(`Added ${product.name} (${chosenSize}) to your bag`);
}

function updateCartQty(index, delta) {
  const item = state.cart[index];
  if (!item) return;
  const product = state.products.find((p) => p.id === item.productId);
  const maxStock = product ? product.stock : 99;

  const nextQty = item.qty + delta;
  if (nextQty <= 0) {
    state.cart.splice(index, 1);
  } else if (nextQty <= maxStock) {
    item.qty = nextQty;
  } else {
    showToast(`Only ${maxStock} units available in stock`, 'error');
  }
  saveCart();
  render();
}

function removeCartItem(index) {
  state.cart.splice(index, 1);
  saveCart();
  render();
}

function submitCheckoutOrder(e) {
  e.preventDefault();
  const form = e.target;
  const customerName = form.customerName.value.trim();
  const customerEmail = form.customerEmail.value.trim();
  const address = form.address.value.trim();
  const promoCode = form.promoCode.value.trim().toUpperCase();

  if (!customerName || !customerEmail || !address) {
    showToast('Please complete all required shipping fields.', 'error');
    return;
  }

  let subtotal = getCartSubtotal();
  if (promoCode === 'FIT25') {
    subtotal = subtotal * 0.75;
  }
  const shipping = subtotal >= 100 ? 0 : 8.0;
  const total = subtotal + shipping;

  // Decrement product inventory
  state.cart.forEach((cartItem) => {
    const prod = state.products.find((p) => p.id === cartItem.productId);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - cartItem.qty);
    }
  });
  saveProducts();

  const newOrder = {
    id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
    customerName,
    customerEmail,
    address,
    date: new Date().toISOString().slice(0, 10),
    status: 'Processing',
    total,
    items: state.cart.map((c) => ({
      name: c.name,
      size: c.size,
      qty: c.qty,
      price: c.price
    }))
  };

  state.orders.unshift(newOrder);
  saveOrders();

  state.cart = [];
  saveCart();
  state.isCheckoutOpen = false;
  state.checkoutSuccessOrder = newOrder;
  render();
  showToast(`Order ${newOrder.id} confirmed!`);
}

// ============================================================================
// 5. STOREFRONT NAVIGATION & MODAL ACTIONS
// ============================================================================
function navigateTo(view, category = null) {
  state.activeView = view;
  if (category) {
    state.activeCategory = category;
  }
  state.isCartOpen = false;
  state.selectedProductModal = null;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openProductModal(productId) {
  const prod = state.products.find((p) => p.id === productId);
  if (!prod) return;
  state.selectedProductModal = prod;
  state.selectedModalSize = prod.sizes && prod.sizes[0] ? prod.sizes[0] : 'M';
  state.selectedModalColor = prod.colors && prod.colors[0] ? prod.colors[0] : 'Standard';
  render();
}

function scrollToSection(sectionId) {
  if (state.activeView !== 'home') {
    state.activeView = 'home';
    render();
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  } else {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}

// ============================================================================
// 6. OWNER AUTHENTICATION & ADMIN CRUD ACTIONS
// ============================================================================
function handleOwnerLogin(e) {
  e.preventDefault();
  const username = e.target.username.value.trim();
  const password = e.target.password.value.trim();

  if (username === OWNER_CREDENTIALS.username && password === OWNER_CREDENTIALS.password) {
    state.isOwnerAuthenticated = true;
    state.loginError = '';
    sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
    state.activeView = 'dashboard';
    state.dashboardTab = 'overview';
    render();
    showToast('Welcome back, Store Owner');
  } else {
    state.loginError = 'Invalid owner credentials. Use the demo credentials shown below.';
    render();
  }
}

function handleOwnerLogout() {
  state.isOwnerAuthenticated = false;
  sessionStorage.removeItem(STORAGE_KEY_AUTH);
  state.activeView = 'home';
  render();
  showToast('Signed out of Owner Portal');
}

function saveProductForm(e) {
  e.preventDefault();
  const f = e.target;
  const id = f.productId.value;
  const name = f.name.value.trim();
  const category = f.category.value;
  const price = parseFloat(f.price.value) || 0;
  const compareAtPrice = f.compareAtPrice.value ? parseFloat(f.compareAtPrice.value) : null;
  const stock = parseInt(f.stock.value, 10) || 0;
  const badge = f.badge.value.trim();
  const featured = f.featured.checked;
  const sizes = f.sizes.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const colors = f.colors.value
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  const image =
    f.image.value.trim() ||
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=85';
  const description = f.description.value.trim();

  if (!name || price <= 0) {
    showToast('Product name and valid price are required.', 'error');
    return;
  }

  if (id) {
    const idx = state.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      state.products[idx] = {
        ...state.products[idx],
        name,
        category,
        price,
        compareAtPrice,
        stock,
        badge,
        featured,
        sizes: sizes.length ? sizes : ['S', 'M', 'L'],
        colors: colors.length ? colors : ['Black'],
        image,
        description
      };
      showToast(`Updated "${name}"`);
    }
  } else {
    const newProd = {
      id: 'prod-' + Date.now(),
      name,
      category,
      price,
      compareAtPrice,
      stock,
      badge,
      featured,
      sizes: sizes.length ? sizes : ['S', 'M', 'L'],
      colors: colors.length ? colors : ['Black'],
      image,
      description
    };
    state.products.unshift(newProd);
    showToast(`Created "${name}"`);
  }

  saveProducts();
  state.editingProduct = null;
  render();
}

function deleteProduct(productId) {
  const prod = state.products.find((p) => p.id === productId);
  if (!prod) return;
  state.products = state.products.filter((p) => p.id !== productId);
  saveProducts();
  render();
  showToast(`Deleted "${prod.name}"`);
}

function updateOrderStatus(orderId, newStatus) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;
  order.status = newStatus;
  saveOrders();
  render();
  showToast(`Order ${orderId} marked as ${newStatus}`);
}

function saveSiteSettingsForm(e) {
  e.preventDefault();
  const f = e.target;
  state.siteSettings = {
    ...state.siteSettings,
    brandName: f.brandName.value.trim() || 'FITSHOP',
    heroTitleLine1: f.heroTitleLine1.value.trim() || 'ELEVATE',
    heroTitleLine2: f.heroTitleLine2.value.trim() || 'EVERY WORKOUT!',
    heroDescription: f.heroDescription.value.trim(),
    heroImage: f.heroImage.value.trim() || DEFAULT_SETTINGS.heroImage,
    showcaseWatermark: f.showcaseWatermark.value.trim() || 'FITSHOP',
    showcaseLeftImg: f.showcaseLeftImg.value.trim() || DEFAULT_SETTINGS.showcaseLeftImg,
    showcaseCenterImg: f.showcaseCenterImg.value.trim() || DEFAULT_SETTINGS.showcaseCenterImg,
    showcaseRightImg: f.showcaseRightImg.value.trim() || DEFAULT_SETTINGS.showcaseRightImg,
    editorialTitle: f.editorialTitle.value.trim(),
    editorialBody: f.editorialBody.value.trim(),
    editorialImg: f.editorialImg.value.trim() || DEFAULT_SETTINGS.editorialImg,
    bannerTitle: f.bannerTitle.value.trim(),
    bannerSubtitle: f.bannerSubtitle.value.trim(),
    bannerImg: f.bannerImg.value.trim() || DEFAULT_SETTINGS.bannerImg,
    promoTitle: f.promoTitle.value.trim(),
    promoSubtitle: f.promoSubtitle.value.trim()
  };
  saveSettings();
  render();
  showToast('Live storefront content updated!');
}

function resetStoreDemoData() {
  state.products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  state.siteSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  state.orders = JSON.parse(JSON.stringify(DEFAULT_ORDERS));
  saveProducts();
  saveSettings();
  saveOrders();
  render();
  showToast('Storefront & catalog reset to factory defaults');
}

// ============================================================================
// 7. STOREFRONT VIEW RENDERING
// ============================================================================
function renderStorefrontView() {
  const s = state.siteSettings;
  const isDark = state.theme === 'dark';
  const cartCount = getCartCount();

  // Filter products for Shop / Featured grid
  const filteredProducts = state.products.filter((p) => {
    const matchesCat = state.activeCategory === 'All' || p.category === state.activeCategory;
    const q = state.searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const featuredProducts = state.products.filter((p) => p.featured).slice(0, 4);

  return `
    <!-- STICKY FROSTED GLASS HEADER -->
    <header class="sticky top-0 z-40 transition-colors duration-300 ${
      isDark
        ? 'bg-[#121216]/85 border-white/10 text-white'
        : 'bg-[#F4F5F7]/85 border-black/[0.06] text-[#111315]'
    } backdrop-blur-md border-b">
      <div class="max-w-[1380px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        <!-- Brand Logo -->
        <button onclick="navigateTo('home')" class="flex items-center gap-2 text-left group focus:outline-none">
          <span class="font-display font-extrabold text-xl sm:text-2xl tracking-[0.06em] uppercase">
            ${escapeHtml(s.brandName)}
          </span>
          <span class="w-1.5 h-1.5 rounded-full bg-[#6E92B5] group-hover:scale-150 transition-transform"></span>
        </button>

        <!-- Primary Navigation -->
        <nav class="hidden md:flex items-center gap-7 text-xs font-medium tracking-wide">
          <button onclick="navigateTo('home')" class="hover:text-[#6E92B5] transition-colors ${
            state.activeView === 'home' ? 'text-[#6E92B5] font-semibold' : ''
          }">HOME</button>
          <button onclick="navigateTo('shop', 'All')" class="hover:text-[#6E92B5] transition-colors ${
            state.activeView === 'shop' && state.activeCategory === 'All'
              ? 'text-[#6E92B5] font-semibold'
              : ''
          }">SHOP ALL</button>
          <button onclick="navigateTo('shop', 'Men')" class="hover:text-[#6E92B5] transition-colors ${
            state.activeView === 'shop' && state.activeCategory === 'Men'
              ? 'text-[#6E92B5] font-semibold'
              : ''
          }">MEN</button>
          <button onclick="navigateTo('shop', 'Women')" class="hover:text-[#6E92B5] transition-colors ${
            state.activeView === 'shop' && state.activeCategory === 'Women'
              ? 'text-[#6E92B5] font-semibold'
              : ''
          }">WOMEN</button>
          <button onclick="navigateTo('shop', 'Accessories')" class="hover:text-[#6E92B5] transition-colors ${
            state.activeView === 'shop' && state.activeCategory === 'Accessories'
              ? 'text-[#6E92B5] font-semibold'
              : ''
          }">ACCESSORIES</button>
        </nav>

        <!-- Right Utility Actions -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Owner Portal Button -->
          <button
            onclick="navigateTo('${state.isOwnerAuthenticated ? 'dashboard' : 'login'}')"
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-all ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-black/[0.05] hover:bg-black/[0.1] text-[#111315]'
            }"
            title="Store Owner Dashboard">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-[#6E92B5]"></i>
            <span>${state.isOwnerAuthenticated ? 'DASHBOARD' : 'OWNER'}</span>
          </button>

          <!-- Theme Toggle -->
          <button
            onclick="toggleTheme()"
            class="p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-black/[0.05] text-zinc-700'
            }"
            aria-label="Toggle color theme">
            <i data-lucide="${isDark ? 'sun' : 'moon'}" class="w-4 h-4"></i>
          </button>

          <!-- Shopping Bag Button -->
          <button
            onclick="state.isCartOpen = true; render();"
            class="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
              isDark
                ? 'bg-white text-[#111315] hover:bg-zinc-200'
                : 'bg-[#111315] text-white hover:bg-[#272A2E]'
            }">
            <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
            <span class="hidden sm:inline">BAG</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#6E92B5] text-white">
              ${cartCount}
            </span>
          </button>
        </div>
      </div>

      <!-- Mobile Quick Category Strip -->
      <div class="flex md:hidden items-center justify-between px-4 py-2 border-t ${
        isDark ? 'border-white/10' : 'border-black/[0.05]'
      } text-[11px] font-semibold overflow-x-auto gap-4">
        <button onclick="navigateTo('home')" class="whitespace-nowrap ${
          state.activeView === 'home' ? 'text-[#6E92B5]' : ''
        }">HOME</button>
        <button onclick="navigateTo('shop', 'All')" class="whitespace-nowrap ${
          state.activeView === 'shop' && state.activeCategory === 'All' ? 'text-[#6E92B5]' : ''
        }">SHOP ALL</button>
        <button onclick="navigateTo('shop', 'Men')" class="whitespace-nowrap">MEN</button>
        <button onclick="navigateTo('shop', 'Women')" class="whitespace-nowrap">WOMEN</button>
        <button onclick="navigateTo('shop', 'Accessories')" class="whitespace-nowrap">GEAR</button>
        <button onclick="navigateTo('${
          state.isOwnerAuthenticated ? 'dashboard' : 'login'
        }')" class="whitespace-nowrap text-[#6E92B5]">OWNER</button>
      </div>
    </header>

    ${
      state.activeView === 'shop'
        ? renderFullCatalogSection(filteredProducts, isDark)
        : `
          <main class="max-w-[1380px] mx-auto px-4 sm:px-8 pt-4 sm:pt-6 pb-16 space-y-20 sm:space-y-28">
            <!-- SECTION 1: HERO CONTAINER (MATCHING GLACIER ICE-BLUE PANEL & EDITORIAL TYPOGRAPHY) -->
            <section id="hero-section" class="relative rounded-[28px] overflow-hidden ${
              isDark
                ? 'bg-gradient-to-br from-[#1B222A] via-[#181B20] to-[#14161A] border border-white/10'
                : 'bg-gradient-to-br from-[#D5E0E5] via-[#DCE5E9] to-[#E6ECEF]'
            } px-6 sm:px-12 lg:px-16 pt-10 sm:pt-14 pb-10 sm:pb-0 min-h-[580px] lg:min-h-[650px] flex flex-col justify-between">

              <!-- Top Hero Headline Block with Masked Line-Up Reveal & Typewriter -->
              <div class="relative z-20 max-w-4xl">
                <h1 class="font-display font-extrabold uppercase tracking-[-0.03em] leading-[0.94] text-[44px] sm:text-[68px] lg:text-[84px]">
                  <span class="hero-line-mask block">
                    <span class="block animate-mask-line-1 ${
                      isDark ? 'text-white' : 'text-[#111315]'
                    }">
                      ${escapeHtml(s.heroTitleLine1)}
                    </span>
                  </span>
                  <span class="hero-line-mask block mt-1">
                    <span class="inline-flex items-center text-[#6E92B5] min-h-[1em]">
                      <span id="hero-typewriter-target">${
                        state.heroAnimPlayed ? escapeHtml(s.heroTitleLine2) : ''
                      }</span>
                      <span id="hero-typewriter-cursor" class="typewriter-cursor ${
                        state.heroAnimPlayed ? 'hidden' : ''
                      }"></span>
                    </span>
                  </span>
                </h1>
              </div>

              <!-- 3-Column Lower Hero Composition -->
              <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mt-6 lg:-mt-8">
                <!-- Left Column: Subcopy + Pill CTA -->
                <div class="lg:col-span-4 lg:pb-14 space-y-6 animate-hero-left">
                  <p class="text-xs sm:text-[13px] leading-[1.65] max-w-xs ${
                    isDark ? 'text-zinc-300' : 'text-[#4A5058]'
                  }">
                    ${escapeHtml(s.heroDescription)}
                  </p>

                  <div class="flex flex-wrap items-center gap-3 animate-hero-cta">
                    <button
                      onclick="navigateTo('shop', 'All')"
                      class="group inline-flex items-center gap-2.5 pl-5 pr-2 py-2 rounded-full text-xs font-semibold tracking-wide transition-all shadow-md hover:shadow-lg ${
                        isDark
                          ? 'bg-white text-[#111315] hover:bg-zinc-100'
                          : 'bg-[#111315] text-white hover:bg-[#23272C]'
                      }">
                      <span>SHOP NOW</span>
                      <span class="w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                        isDark ? 'bg-[#111315] text-white' : 'bg-white text-[#111315]'
                      }">
                        <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
                      </span>
                    </button>
                  </div>
                </div>

                <!-- Center Column: Athlete Portrait Cutout Card with Venetian-Blind Wipe -->
                <div class="lg:col-span-5 flex justify-center items-end animate-hero-model">
                  <div class="relative w-full max-w-[400px] lg:max-w-[430px] aspect-[4/5] rounded-t-[26px] lg:rounded-b-none rounded-b-[26px] overflow-hidden shadow-2xl">
                    <img
                      src="${escapeHtml(s.heroImage)}"
                      alt="Athletic performance apparel"
                      class="w-full h-full object-cover object-top"
                    />
                    <div class="hero-blinds-overlay" aria-hidden="true">
                      ${[0, 1, 2, 3, 4, 5, 6]
                        .map(
                          (i) =>
                            `<div class="hero-blind-slat ${
                              isDark ? 'bg-[#121216]' : 'bg-[#DCE5E9]'
                            }" style="animation-delay: ${0.32 + i * 0.055}s;"></div>`
                        )
                        .join('')}
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none"></div>
                  </div>
                </div>

                <!-- Right Column: Minimalist Social Proof Widget -->
                <div class="lg:col-span-3 lg:pb-14 flex lg:justify-end animate-hero-right">
                  <div class="inline-flex flex-col gap-2.5 p-4 rounded-2xl backdrop-blur-md ${
                    isDark
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-white/60 border border-white/80 shadow-sm'
                  }">
                    <!-- Overlapping Athlete Avatars -->
                    <div class="flex items-center -space-x-2">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Member" class="w-8 h-8 rounded-full object-cover ring-2 ${
                        isDark ? 'ring-[#181B20]' : 'ring-[#DCE5E9]'
                      }" />
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Member" class="w-8 h-8 rounded-full object-cover ring-2 ${
                        isDark ? 'ring-[#181B20]' : 'ring-[#DCE5E9]'
                      }" />
                      <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80" alt="Member" class="w-8 h-8 rounded-full object-cover ring-2 ${
                        isDark ? 'ring-[#181B20]' : 'ring-[#DCE5E9]'
                      }" />
                      <div class="w-8 h-8 rounded-full bg-[#111315] text-white text-[10px] font-bold flex items-center justify-center ring-2 ${
                        isDark ? 'ring-[#181B20]' : 'ring-[#DCE5E9]'
                      }">
                        +1.2k
                      </div>
                    </div>

                    <div>
                      <div class="flex items-center gap-1.5">
                        <div class="flex items-center text-amber-400">
                          <i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>
                        </div>
                        <span class="font-display font-bold text-sm">${escapeHtml(s.heroRating)}</span>
                      </div>
                      <p class="text-[11px] ${isDark ? 'text-zinc-400' : 'text-[#5C636A]'}">
                        Based on ${escapeHtml(s.heroReviewCount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- SECTION 2: ASYMMETRICAL BRAND SHOWCASE WITH SCROLL-REPLAY BLINDS & PARALLAX WATERMARK -->
            <section id="showcase-section" class="relative py-6 sm:py-12 overflow-hidden">
              <!-- Giant Subtle Watermark Typography (Moves smoothly with scroll parallax) -->
              <div aria-hidden="true" class="pointer-events-none select-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center overflow-hidden">
                <span id="showcase-watermark-text" class="font-display font-extrabold uppercase text-[96px] sm:text-[170px] lg:text-[230px] tracking-[0.06em] leading-none will-change-transform ${
                  isDark ? 'text-white/[0.03]' : 'text-[#111315]/[0.04]'
                }">
                  ${escapeHtml(s.showcaseWatermark)}
                </span>
              </div>

              <!-- 3-Column Staggered Editorial Grid -->
              <div class="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
                <!-- Left Column -->
                <div id="showcase-col-left" class="md:col-span-3 flex flex-col gap-4 md:mt-10 transition-transform duration-150 ease-out">
                  <div class="showcase-card-enter rounded-2xl overflow-hidden aspect-[4/5] shadow-sm group relative ${
                    isDark ? 'bg-[#1B1B21]' : 'bg-[#EAECEF]'
                  }" data-delay="60">
                    <img src="${escapeHtml(s.showcaseLeftImg)}" alt="Sweat-wicking training fabric" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    <div class="showcase-blinds-overlay" aria-hidden="true">
                      ${[0, 1, 2, 3, 4, 5, 6]
                        .map(
                          (i) =>
                            `<div class="showcase-blind-slat ${
                              isDark ? 'bg-[#121216]' : 'bg-[#F4F5F7]'
                            }" style="animation-delay: ${0.12 + i * 0.05}s;"></div>`
                        )
                        .join('')}
                    </div>
                  </div>
                  <p class="showcase-caption-enter text-[11px] leading-relaxed ${
                    isDark ? 'text-zinc-400' : 'text-[#5C636A]'
                  }" data-delay="380">
                    ${escapeHtml(s.showcaseLeftCaption)}
                  </p>
                </div>

                <!-- Center Focal Portrait -->
                <div id="showcase-col-center" class="md:col-span-6">
                  <div class="showcase-card-enter rounded-[24px] overflow-hidden aspect-[4/4.3] shadow-lg group relative ${
                    isDark ? 'bg-[#1B1B21]' : 'bg-[#EAECEF]'
                  }" data-delay="180">
                    <img src="${escapeHtml(s.showcaseCenterImg)}" alt="Studio training lookbook" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    <div class="showcase-blinds-overlay" aria-hidden="true">
                      ${[0, 1, 2, 3, 4, 5, 6, 7, 8]
                        .map(
                          (i) =>
                            `<div class="showcase-blind-slat ${
                              isDark ? 'bg-[#121216]' : 'bg-[#F4F5F7]'
                            }" style="animation-delay: ${0.22 + i * 0.05}s;"></div>`
                        )
                        .join('')}
                    </div>
                    <div class="absolute bottom-4 left-4 right-4 flex items-center justify-between px-4 py-3 rounded-xl backdrop-blur-md bg-black/45 text-white opacity-95 group-hover:bg-black/60 transition-colors">
                      <div>
                        <p class="text-[10px] uppercase tracking-widest text-zinc-300">SEASON 2026 DROP</p>
                        <p class="font-display font-bold text-sm">Sculpt &amp; Seamless Collection</p>
                      </div>
                      <button onclick="navigateTo('shop', 'Women')" class="px-3 py-1.5 rounded-full bg-white text-[#111315] text-[11px] font-bold hover:bg-[#6E92B5] hover:text-white transition-colors">
                        EXPLORE
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Right Column -->
                <div id="showcase-col-right" class="md:col-span-3 flex flex-col gap-4 md:mt-20 transition-transform duration-150 ease-out">
                  <p class="showcase-caption-enter text-[11px] leading-relaxed ${
                    isDark ? 'text-zinc-400' : 'text-[#5C636A]'
                  }" data-delay="460">
                    ${escapeHtml(s.showcaseRightCaption)}
                  </p>
                  <div class="showcase-card-enter rounded-2xl overflow-hidden aspect-[4/5] shadow-sm group relative ${
                    isDark ? 'bg-[#1B1B21]' : 'bg-[#EAECEF]'
                  }" data-delay="300">
                    <img src="${escapeHtml(s.showcaseRightImg)}" alt="Compression fit" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    <div class="showcase-blinds-overlay" aria-hidden="true">
                      ${[0, 1, 2, 3, 4, 5, 6]
                        .map(
                          (i) =>
                            `<div class="showcase-blind-slat ${
                              isDark ? 'bg-[#121216]' : 'bg-[#F4F5F7]'
                            }" style="animation-delay: ${0.32 + i * 0.05}s;"></div>`
                        )
                        .join('')}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- SECTION 3: 2-COLUMN PERFORMANCE EDITORIAL SPLIT -->
            <section class="scroll-reveal grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div class="lg:col-span-5 space-y-5">
                <span class="inline-block text-[11px] font-bold uppercase tracking-[0.16em] text-[#6E92B5]">
                  FABRIC ENGINEERING
                </span>
                <h2 class="font-display font-extrabold text-3xl sm:text-4xl lg:text-[42px] leading-[1.08] tracking-tight">
                  ${escapeHtml(s.editorialTitle)}
                </h2>
                <p class="text-xs sm:text-sm leading-relaxed ${
                  isDark ? 'text-zinc-300' : 'text-[#5C636A]'
                }">
                  ${escapeHtml(s.editorialBody)}
                </p>

                <!-- Technical Spec Pills -->
                <div class="grid grid-cols-3 gap-3 pt-2">
                  <div class="p-3 rounded-xl ${
                    isDark ? 'bg-[#1B1B21] border border-white/10' : 'bg-white border border-black/[0.05]'
                  }">
                    <p class="font-display font-extrabold text-base text-[#6E92B5]">4-WAY</p>
                    <p class="text-[11px] ${isDark ? 'text-zinc-400' : 'text-[#5C636A]'}">Dynamic Stretch</p>
                  </div>
                  <div class="p-3 rounded-xl ${
                    isDark ? 'bg-[#1B1B21] border border-white/10' : 'bg-white border border-black/[0.05]'
                  }">
                    <p class="font-display font-extrabold text-base text-[#6E92B5]">DRY-FIT</p>
                    <p class="text-[11px] ${isDark ? 'text-zinc-400' : 'text-[#5C636A]'}">Sweat Wicking</p>
                  </div>
                  <div class="p-3 rounded-xl ${
                    isDark ? 'bg-[#1B1B21] border border-white/10' : 'bg-white border border-black/[0.05]'
                  }">
                    <p class="font-display font-extrabold text-base text-[#6E92B5]">ZERO</p>
                    <p class="text-[11px] ${isDark ? 'text-zinc-400' : 'text-[#5C636A]'}">Chafe Seams</p>
                  </div>
                </div>

                <div class="pt-2">
                  <button
                    onclick="navigateTo('shop', 'All')"
                    class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                      isDark
                        ? 'border-white/20 hover:bg-white hover:text-[#111315]'
                        : 'border-[#111315] hover:bg-[#111315] hover:text-white'
                    }">
                    <span>EXPLORE TECHNOLOGY</span>
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>

              <div class="lg:col-span-7">
                <div class="rounded-[24px] overflow-hidden aspect-[16/10] shadow-md">
                  <img src="${escapeHtml(s.editorialImg)}" alt="Performance gym training" class="w-full h-full object-cover" />
                </div>
              </div>
            </section>

            <!-- SECTION 4: FULL-BLEED ATHLETIC STATEMENT BANNER -->
            <section class="scroll-reveal relative rounded-[28px] overflow-hidden min-h-[340px] sm:min-h-[420px] flex items-center px-6 sm:px-14 py-12">
              <img src="${escapeHtml(s.bannerImg)}" alt="Push your limits" class="absolute inset-0 w-full h-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-r from-[#111315]/90 via-[#111315]/65 to-transparent"></div>

              <div class="relative z-10 max-w-xl space-y-4 text-white">
                <span class="inline-block px-3 py-1 rounded-full bg-[#6E92B5]/30 border border-[#6E92B5]/50 text-[10px] font-bold tracking-widest uppercase">
                  NEW COLLECTION
                </span>
                <h2 class="font-display font-extrabold uppercase text-3xl sm:text-5xl leading-[1.02] tracking-tight">
                  ${escapeHtml(s.bannerTitle)}
                </h2>
                <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-md">
                  ${escapeHtml(s.bannerSubtitle)}
                </p>
                <div class="pt-2">
                  <button
                    onclick="navigateTo('shop', 'All')"
                    class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#111315] text-xs font-bold tracking-wide hover:bg-[#6E92B5] hover:text-white transition-colors">
                    <span>SHOP THE DROP</span>
                    <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            </section>

            <!-- SECTION 5: FEATURED PRODUCTS GRID -->
            <section id="featured-section" class="scroll-reveal space-y-8">
              <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6E92B5]">CURATED ESSENTIALS</span>
                  <h2 class="font-display font-extrabold uppercase text-2xl sm:text-4xl tracking-tight mt-1">
                    FEATURED GEAR
                  </h2>
                </div>
                <button
                  onclick="navigateTo('shop', 'All')"
                  class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6E92B5] hover:underline">
                  <span>VIEW ALL PRODUCTS (${state.products.length})</span>
                  <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                ${featuredProducts.map((prod) => renderProductCard(prod, isDark)).join('')}
              </div>
            </section>

            <!-- SECTION 6: CATEGORY TILES (MEN / WOMEN / ACCESSORIES) -->
            <section class="scroll-reveal space-y-6">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6E92B5]">DISCOVER BY DISCIPLINE</span>
                <h2 class="font-display font-extrabold uppercase text-2xl sm:text-4xl tracking-tight mt-1">
                  SHOP BY CATEGORY
                </h2>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${[
                  {
                    title: 'MEN',
                    subtitle: 'Compression, Shorts & Warmups',
                    cat: 'Men',
                    img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=85'
                  },
                  {
                    title: 'WOMEN',
                    subtitle: 'Seamless Leggings, Bras & Studio',
                    cat: 'Women',
                    img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=85'
                  },
                  {
                    title: 'ACCESSORIES',
                    subtitle: 'Belts, Duffels & Lifting Gear',
                    cat: 'Accessories',
                    img: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=800&q=85'
                  }
                ]
                  .map(
                    (tile) => `
                    <div
                      onclick="navigateTo('shop', '${tile.cat}')"
                      class="group cursor-pointer relative rounded-[24px] overflow-hidden aspect-[4/3] shadow-sm">
                      <img src="${tile.img}" alt="${tile.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"></div>
                      <div class="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
                        <div>
                          <p class="text-[11px] text-zinc-300">${tile.subtitle}</p>
                          <h3 class="font-display font-extrabold text-2xl tracking-wide">${tile.title}</h3>
                        </div>
                        <span class="w-9 h-9 rounded-full bg-white text-[#111315] flex items-center justify-center group-hover:bg-[#6E92B5] group-hover:text-white transition-colors">
                          <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
                        </span>
                      </div>
                    </div>
                  `
                  )
                  .join('')}
              </div>
            </section>

            <!-- SECTION 7: PROMO BANNER / NEWSLETTER -->
            <section class="scroll-reveal rounded-[28px] p-8 sm:p-12 lg:p-14 ${
              isDark
                ? 'bg-[#1B1B21] border border-white/10'
                : 'bg-[#DCE5E9]'
            } flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div class="max-w-xl space-y-2.5">
                <span class="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#6E92B5] text-white">
                  VIP MEMBER PERK • CODE: FIT25
                </span>
                <h2 class="font-display font-extrabold uppercase text-2xl sm:text-4xl tracking-tight">
                  ${escapeHtml(s.promoTitle)}
                </h2>
                <p class="text-xs sm:text-sm ${isDark ? 'text-zinc-300' : 'text-[#4A5058]'}">
                  ${escapeHtml(s.promoSubtitle)}
                </p>
              </div>

              <form
                onsubmit="event.preventDefault(); showToast('Welcome! Use code FIT25 at checkout for 25% off.'); this.reset();"
                class="w-full lg:w-auto flex flex-col sm:flex-row gap-3 min-w-0 sm:min-w-[380px]">
                <input
                  type="email"
                  required
                  placeholder="Enter your athlete email..."
                  class="flex-1 px-4 py-3 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#6E92B5] ${
                    isDark
                      ? 'bg-[#121216] text-white border border-white/15'
                      : 'bg-white text-[#111315] border border-black/10'
                  }"
                />
                <button
                  type="submit"
                  class="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                    isDark
                      ? 'bg-white text-[#111315] hover:bg-[#6E92B5] hover:text-white'
                      : 'bg-[#111315] text-white hover:bg-[#6E92B5]'
                  }">
                  UNLOCK 25% OFF
                </button>
              </form>
            </section>
          </main>
        `
    }

    <!-- SECTION 8: MINIMALIST FOOTER -->
    <footer class="border-t ${
      isDark ? 'border-white/10 bg-[#121216] text-zinc-400' : 'border-black/[0.06] bg-[#EAECEF] text-[#5C636A]'
    }">
      <div class="max-w-[1380px] mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
        <div class="space-y-3">
          <div class="font-display font-extrabold text-xl tracking-wider uppercase ${
            isDark ? 'text-white' : 'text-[#111315]'
          }">
            ${escapeHtml(s.brandName)}
          </div>
          <p class="leading-relaxed">
            High-performance gym apparel engineered for athletes who demand comfort, durability, and clean modern aesthetics.
          </p>
        </div>

        <div class="space-y-2.5">
          <p class="font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#111315]'}">COLLECTIONS</p>
          <ul class="space-y-2">
            <li><button onclick="navigateTo('shop', 'All')" class="hover:text-[#6E92B5]">All Performance Gear</button></li>
            <li><button onclick="navigateTo('shop', 'Men')" class="hover:text-[#6E92B5]">Men's Training</button></li>
            <li><button onclick="navigateTo('shop', 'Women')" class="hover:text-[#6E92B5]">Women's Seamless</button></li>
            <li><button onclick="navigateTo('shop', 'Accessories')" class="hover:text-[#6E92B5]">Lifting Accessories</button></li>
          </ul>
        </div>

        <div class="space-y-2.5">
          <p class="font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#111315]'}">SUPPORT &amp; STORE</p>
          <ul class="space-y-2">
            <li>${escapeHtml(s.supportEmail)}</li>
            <li>${escapeHtml(s.supportPhone)}</li>
            <li>${escapeHtml(s.hqLocation)}</li>
            <li>
              <button onclick="navigateTo('${
                state.isOwnerAuthenticated ? 'dashboard' : 'login'
              }')" class="text-[#6E92B5] font-semibold hover:underline">
                Owner Portal &rarr;
              </button>
            </li>
          </ul>
        </div>

        <div class="space-y-2.5">
          <p class="font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#111315]'}">SHIPPING &amp; GUARANTEE</p>
          <p class="leading-relaxed">
            Complimentary express shipping on orders over $100. 30-day sweat-tested returns and exchanges.
          </p>
        </div>
      </div>
    </footer>
  `;
}

function renderFullCatalogSection(products, isDark) {
  return `
    <main class="max-w-[1380px] mx-auto px-4 sm:px-8 pt-8 pb-20 space-y-8">
      <!-- Catalog Header & Search/Filter Controls -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onclick="navigateTo('home')" class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E92B5] mb-2 hover:underline">
            <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
            <span>BACK TO HOME</span>
          </button>
          <h1 class="font-display font-extrabold uppercase text-3xl sm:text-5xl tracking-tight">
            ${state.activeCategory === 'All' ? 'ALL PERFORMANCE GEAR' : escapeHtml(state.activeCategory) + ' COLLECTION'}
          </h1>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Search Input -->
          <div class="relative">
            <i data-lucide="search" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"></i>
            <input
              type="text"
              value="${escapeHtml(state.searchQuery)}"
              oninput="state.searchQuery = this.value; render();"
              placeholder="Search apparel..."
              class="pl-9 pr-4 py-2 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#6E92B5] ${
                isDark
                  ? 'bg-[#1B1B21] text-white border border-white/10'
                  : 'bg-white text-[#111315] border border-black/10'
              }"
            />
          </div>

          <!-- Category Filter Pills -->
          <div class="flex items-center gap-1.5 p-1 rounded-full ${
            isDark ? 'bg-[#1B1B21]' : 'bg-white border border-black/[0.06]'
          }">
            ${['All', 'Men', 'Women', 'Accessories']
              .map(
                (cat) => `
                <button
                  onclick="state.activeCategory = '${cat}'; render();"
                  class="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    state.activeCategory === cat
                      ? 'bg-[#111315] text-white dark:bg-white dark:text-[#111315]'
                      : 'hover:text-[#6E92B5]'
                  }">
                  ${cat}
                </button>
              `
              )
              .join('')}
          </div>
        </div>
      </div>

      <!-- Product Grid -->
      ${
        products.length === 0
          ? `
            <div class="text-center py-20 rounded-3xl ${
              isDark ? 'bg-[#1B1B21]' : 'bg-white'
            }">
              <p class="font-display font-bold text-lg">No gear matches your current filter.</p>
              <button onclick="state.activeCategory='All'; state.searchQuery=''; render();" class="mt-3 px-5 py-2 rounded-full bg-[#6E92B5] text-white text-xs font-bold">
                RESET FILTERS
              </button>
            </div>
          `
          : `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              ${products.map((prod) => renderProductCard(prod, isDark)).join('')}
            </div>
          `
      }
    </main>
  `;
}

function renderProductCard(prod, isDark) {
  const outOfStock = prod.stock <= 0;
  return `
    <div class="group rounded-[22px] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
      isDark
        ? 'bg-[#1B1B21] border border-white/10'
        : 'bg-white border border-black/[0.05] shadow-sm'
    }">
      <div>
        <!-- Product Image -->
        <div onclick="openProductModal('${prod.id}')" class="cursor-pointer relative aspect-[4/4.5] overflow-hidden bg-zinc-200">
          <img
            src="${escapeHtml(prod.image)}"
            alt="${escapeHtml(prod.name)}"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          ${
            prod.badge
              ? `<span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                  isDark ? 'bg-[#121216]/90 text-white' : 'bg-white/95 text-[#111315]'
                } shadow-sm">${escapeHtml(prod.badge)}</span>`
              : ''
          }
          ${
            outOfStock
              ? `<div class="absolute inset-0 bg-black/55 flex items-center justify-center">
                   <span class="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase">OUT OF STOCK</span>
                 </div>`
              : ''
          }
        </div>

        <!-- Product Meta -->
        <div class="p-4 space-y-1.5">
          <div class="flex items-center justify-between text-[11px] ${
            isDark ? 'text-zinc-400' : 'text-[#5C636A]'
          }">
            <span>${escapeHtml(prod.category)}</span>
            <span>${prod.stock} in stock</span>
          </div>
          <h3
            onclick="openProductModal('${prod.id}')"
            class="cursor-pointer font-display font-bold text-base leading-snug group-hover:text-[#6E92B5] transition-colors">
            ${escapeHtml(prod.name)}
          </h3>
          <div class="flex items-center gap-2 pt-0.5">
            <span class="font-display font-extrabold text-sm">${formatMoney(prod.price)}</span>
            ${
              prod.compareAtPrice
                ? `<span class="text-xs line-through text-zinc-400">${formatMoney(prod.compareAtPrice)}</span>`
                : ''
            }
          </div>
        </div>
      </div>

      <!-- Quick Action Footer -->
      <div class="px-4 pb-4 pt-1 flex items-center gap-2">
        <button
          onclick="addToCart('${prod.id}')"
          ${outOfStock ? 'disabled' : ''}
          class="flex-1 py-2.5 px-3 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
            outOfStock
              ? 'bg-zinc-400/30 text-zinc-500 cursor-not-allowed'
              : isDark
              ? 'bg-white text-[#111315] hover:bg-[#6E92B5] hover:text-white'
              : 'bg-[#111315] text-white hover:bg-[#6E92B5]'
          }">
          ${outOfStock ? 'SOLD OUT' : 'ADD TO BAG'}
        </button>
        <button
          onclick="openProductModal('${prod.id}')"
          class="p-2.5 rounded-full border transition-colors ${
            isDark
              ? 'border-white/15 hover:bg-white/10 text-zinc-300'
              : 'border-black/10 hover:bg-black/5 text-zinc-700'
          }"
          title="Quick View">
          <i data-lucide="eye" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `;
}

// ============================================================================
// 8. MODALS & SLIDE-OVER CART DRAWER
// ============================================================================
function renderModals() {
  const root = document.getElementById('modal-root');
  if (!root) return;
  const isDark = state.theme === 'dark';
  let html = '';

  // 1. PRODUCT QUICK VIEW MODAL
  if (state.selectedProductModal) {
    const p = state.selectedProductModal;
    html += `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="relative w-full max-w-3xl rounded-[28px] overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2 ${
          isDark ? 'bg-[#1B1B21] text-white border border-white/10' : 'bg-white text-[#111315]'
        }">
          <button
            onclick="state.selectedProductModal = null; render();"
            class="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center ${
              isDark ? 'bg-black/50 text-white hover:bg-black' : 'bg-white/90 text-[#111315] hover:bg-zinc-100'
            }">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>

          <div class="aspect-square md:aspect-auto bg-zinc-200">
            <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="w-full h-full object-cover" />
          </div>

          <div class="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#6E92B5]/20 text-[#6E92B5]">
                  ${escapeHtml(p.category)}
                </span>
                <span class="text-xs text-zinc-400">${p.stock} available</span>
              </div>
              <h2 class="font-display font-extrabold text-2xl">${escapeHtml(p.name)}</h2>
              <div class="flex items-center gap-2.5">
                <span class="font-display font-extrabold text-xl text-[#6E92B5]">${formatMoney(p.price)}</span>
                ${
                  p.compareAtPrice
                    ? `<span class="text-sm line-through text-zinc-400">${formatMoney(p.compareAtPrice)}</span>`
                    : ''
                }
              </div>
              <p class="text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-[#5C636A]'}">
                ${escapeHtml(p.description)}
              </p>

              <!-- Size Selector -->
              <div class="pt-2 space-y-2">
                <p class="text-[11px] font-bold uppercase tracking-wider">SELECT SIZE</p>
                <div class="flex flex-wrap gap-2">
                  ${(p.sizes || ['S', 'M', 'L'])
                    .map(
                      (sz) => `
                      <button
                        onclick="state.selectedModalSize = '${escapeHtml(sz)}'; render();"
                        class="px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          state.selectedModalSize === sz
                            ? 'bg-[#6E92B5] text-white border-[#6E92B5]'
                            : isDark
                            ? 'border-white/15 hover:border-white/40'
                            : 'border-black/15 hover:border-black'
                        }">
                        ${escapeHtml(sz)}
                      </button>
                    `
                    )
                    .join('')}
                </div>
              </div>

              <!-- Color Selector -->
              <div class="pt-1 space-y-2">
                <p class="text-[11px] font-bold uppercase tracking-wider">COLORWAY</p>
                <div class="flex flex-wrap gap-2">
                  ${(p.colors || ['Standard'])
                    .map(
                      (col) => `
                      <button
                        onclick="state.selectedModalColor = '${escapeHtml(col)}'; render();"
                        class="px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                          state.selectedModalColor === col
                            ? 'bg-[#111315] text-white border-[#111315] dark:bg-white dark:text-[#111315]'
                            : isDark
                            ? 'border-white/15 text-zinc-300'
                            : 'border-black/15 text-zinc-700'
                        }">
                        ${escapeHtml(col)}
                      </button>
                    `
                    )
                    .join('')}
                </div>
              </div>
            </div>

            <button
              onclick="addToCart('${p.id}', state.selectedModalSize, state.selectedModalColor, 1)"
              ${p.stock <= 0 ? 'disabled' : ''}
              class="w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                p.stock <= 0
                  ? 'bg-zinc-500/30 text-zinc-400 cursor-not-allowed'
                  : 'bg-[#111315] text-white hover:bg-[#6E92B5] dark:bg-white dark:text-[#111315] dark:hover:bg-[#6E92B5] dark:hover:text-white'
              }">
              ${p.stock <= 0 ? 'OUT OF STOCK' : 'ADD TO SHOPPING BAG — ' + formatMoney(p.price)}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 2. SLIDE-OVER SHOPPING BAG DRAWER
  if (state.isCartOpen) {
    const subtotal = getCartSubtotal();
    const freeShippingRemaining = Math.max(0, 100 - subtotal);

    html += `
      <div class="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
        <div class="w-full max-w-md h-full flex flex-col justify-between shadow-2xl ${
          isDark ? 'bg-[#18181D] text-white border-l border-white/10' : 'bg-white text-[#111315]'
        }">
          <!-- Drawer Header -->
          <div class="p-6 border-b ${isDark ? 'border-white/10' : 'border-black/[0.06]'} space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="font-display font-extrabold text-lg uppercase tracking-wide">
                YOUR BAG (${getCartCount()})
              </h2>
              <button onclick="state.isCartOpen = false; render();" class="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>
            <div class="text-[11px] px-3 py-2 rounded-xl ${
              isDark ? 'bg-white/5 text-zinc-300' : 'bg-[#DCE5E9]/60 text-[#111315]'
            }">
              ${
                freeShippingRemaining === 0
                  ? 'You unlocked <strong>FREE Express Shipping!</strong>'
                  : `Add <strong>${formatMoney(freeShippingRemaining)}</strong> more for FREE Express Shipping.`
              }
            </div>
          </div>

          <!-- Cart Items List -->
          <div class="flex-1 overflow-y-auto p-6 space-y-4">
            ${
              state.cart.length === 0
                ? `
                  <div class="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
                    <i data-lucide="shopping-bag" class="w-10 h-10 text-zinc-400"></i>
                    <p class="font-display font-bold text-base">Your training bag is empty</p>
                    <button
                      onclick="state.isCartOpen = false; navigateTo('shop', 'All');"
                      class="px-5 py-2.5 rounded-full bg-[#111315] text-white dark:bg-white dark:text-[#111315] text-xs font-bold">
                      EXPLORE GEAR
                    </button>
                  </div>
                `
                : state.cart
                    .map(
                      (item, idx) => `
                      <div class="flex gap-4 p-3 rounded-2xl ${
                        isDark ? 'bg-[#222229]' : 'bg-[#F4F5F7]'
                      }">
                        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="w-20 h-24 rounded-xl object-cover" />
                        <div class="flex-1 flex flex-col justify-between">
                          <div>
                            <div class="flex justify-between items-start gap-2">
                              <h4 class="font-display font-bold text-xs leading-snug">${escapeHtml(item.name)}</h4>
                              <button onclick="removeCartItem(${idx})" class="text-zinc-400 hover:text-red-500">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                              </button>
                            </div>
                            <p class="text-[11px] text-zinc-400 mt-0.5">${escapeHtml(item.size)} • ${escapeHtml(item.color)}</p>
                          </div>

                          <div class="flex items-center justify-between pt-2">
                            <div class="inline-flex items-center rounded-full border ${
                              isDark ? 'border-white/15' : 'border-black/10 bg-white'
                            }">
                              <button onclick="updateCartQty(${idx}, -1)" class="px-2.5 py-1 text-xs font-bold">-</button>
                              <span class="px-2 text-xs font-bold">${item.qty}</span>
                              <button onclick="updateCartQty(${idx}, 1)" class="px-2.5 py-1 text-xs font-bold">+</button>
                            </div>
                            <span class="font-display font-bold text-xs">${formatMoney(item.price * item.qty)}</span>
                          </div>
                        </div>
                      </div>
                    `
                    )
                    .join('')
            }
          </div>

          <!-- Drawer Footer -->
          ${
            state.cart.length > 0
              ? `
                <div class="p-6 border-t ${isDark ? 'border-white/10' : 'border-black/[0.06]'} space-y-4">
                  <div class="flex items-center justify-between text-sm font-bold">
                    <span>Subtotal</span>
                    <span class="font-display text-lg">${formatMoney(subtotal)}</span>
                  </div>
                  <button
                    onclick="state.isCartOpen = false; state.isCheckoutOpen = true; render();"
                    class="w-full py-3.5 rounded-full bg-[#111315] text-white dark:bg-white dark:text-[#111315] hover:bg-[#6E92B5] dark:hover:bg-[#6E92B5] dark:hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">
                    PROCEED TO CHECKOUT
                  </button>
                </div>
              `
              : ''
          }
        </div>
      </div>
    `;
  }

  // 3. CHECKOUT MODAL
  if (state.isCheckoutOpen) {
    const subtotal = getCartSubtotal();
    html += `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="w-full max-w-lg rounded-[28px] p-6 sm:p-8 shadow-2xl ${
          isDark ? 'bg-[#1B1B21] text-white border border-white/10' : 'bg-white text-[#111315]'
        }">
          <div class="flex items-center justify-between mb-6">
            <h2 class="font-display font-extrabold text-xl uppercase">EXPRESS CHECKOUT</h2>
            <button onclick="state.isCheckoutOpen = false; render();" class="p-2 rounded-full hover:bg-black/5">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form onsubmit="submitCheckoutOrder(event)" class="space-y-4 text-xs">
            <div>
              <label class="block font-bold uppercase mb-1">Full Name *</label>
              <input name="customerName" required placeholder="Alex Morgan" class="w-full px-4 py-2.5 rounded-xl border ${
                isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
              }" />
            </div>
            <div>
              <label class="block font-bold uppercase mb-1">Email Address *</label>
              <input name="customerEmail" type="email" required placeholder="alex@example.com" class="w-full px-4 py-2.5 rounded-xl border ${
                isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
              }" />
            </div>
            <div>
              <label class="block font-bold uppercase mb-1">Shipping Address *</label>
              <input name="address" required placeholder="123 Fitness Ave, Apt 4B, Austin, TX" class="w-full px-4 py-2.5 rounded-xl border ${
                isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
              }" />
            </div>
            <div>
              <label class="block font-bold uppercase mb-1">Promo Code (Try FIT25)</label>
              <input name="promoCode" placeholder="FIT25" class="w-full px-4 py-2.5 rounded-xl border ${
                isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
              }" />
            </div>

            <div class="p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-[#DCE5E9]/60'} space-y-1">
              <div class="flex justify-between">
                <span>Items (${getCartCount()})</span>
                <span class="font-bold">${formatMoney(subtotal)}</span>
              </div>
              <div class="flex justify-between text-zinc-500">
                <span>Shipping</span>
                <span>${subtotal >= 100 ? 'FREE' : '$8.00'}</span>
              </div>
            </div>

            <button type="submit" class="w-full py-3.5 rounded-full bg-[#6E92B5] text-white font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
              COMPLETE ORDER
            </button>
          </form>
        </div>
      </div>
    `;
  }

  // 4. ORDER RECEIPT MODAL
  if (state.checkoutSuccessOrder) {
    const ord = state.checkoutSuccessOrder;
    html += `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="w-full max-w-md rounded-[28px] p-8 text-center shadow-2xl space-y-5 ${
          isDark ? 'bg-[#1B1B21] text-white border border-white/10' : 'bg-white text-[#111315]'
        }">
          <div class="w-14 h-14 rounded-full bg-[#6E92B5]/20 text-[#6E92B5] flex items-center justify-center mx-auto">
            <i data-lucide="check-circle-2" class="w-8 h-8"></i>
          </div>
          <div>
            <p class="text-[11px] font-bold uppercase tracking-widest text-[#6E92B5]">ORDER CONFIRMED</p>
            <h2 class="font-display font-extrabold text-2xl mt-1">${escapeHtml(ord.id)}</h2>
            <p class="text-xs text-zinc-400 mt-1">
              Thank you, ${escapeHtml(ord.customerName)}. Your order is now live in the Owner Dashboard.
            </p>
          </div>
          <div class="p-4 rounded-2xl text-left text-xs space-y-1.5 ${
            isDark ? 'bg-white/5' : 'bg-[#F4F5F7]'
          }">
            <div class="flex justify-between font-bold">
              <span>Total Paid</span>
              <span>${formatMoney(ord.total)}</span>
            </div>
            <div class="text-zinc-400">Shipping to: ${escapeHtml(ord.address)}</div>
          </div>
          <button
            onclick="state.checkoutSuccessOrder = null; render();"
            class="w-full py-3 rounded-full bg-[#111315] text-white dark:bg-white dark:text-[#111315] text-xs font-bold uppercase">
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    `;
  }

  root.innerHTML = html;
}

// ============================================================================
// 9. OWNER LOGIN PORTAL VIEW
// ============================================================================
function renderOwnerLoginView() {
  const isDark = state.theme === 'dark';
  return `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md rounded-[28px] p-8 shadow-xl space-y-6 ${
        isDark ? 'bg-[#1B1B21] border border-white/10 text-white' : 'bg-white border border-black/[0.06] text-[#111315]'
      }">
        <div class="flex items-center justify-between">
          <button onclick="navigateTo('home')" class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E92B5] hover:underline">
            <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
            <span>STOREFRONT</span>
          </button>
          <span class="font-display font-extrabold text-sm tracking-wider">${escapeHtml(state.siteSettings.brandName)}</span>
        </div>

        <div>
          <h1 class="font-display font-extrabold text-2xl uppercase">OWNER COMMAND PORTAL</h1>
          <p class="text-xs text-zinc-400 mt-1">Sign in to manage inventory, customer orders, and live storefront content.</p>
        </div>

        ${
          state.loginError
            ? `<div class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium">${escapeHtml(
                state.loginError
              )}</div>`
            : ''
        }

        <form onsubmit="handleOwnerLogin(event)" class="space-y-4 text-xs">
          <div>
            <label class="block font-bold uppercase mb-1">Owner Email</label>
            <input name="username" type="email" required value="owner@fitshop.com" class="w-full px-4 py-3 rounded-xl border ${
              isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
            }" />
          </div>
          <div>
            <label class="block font-bold uppercase mb-1">Access Key / Password</label>
            <input name="password" type="password" required value="FITSHOP2026" class="w-full px-4 py-3 rounded-xl border ${
              isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
            }" />
          </div>

          <div class="p-3 rounded-xl text-[11px] ${
            isDark ? 'bg-white/5 text-zinc-300' : 'bg-[#DCE5E9]/70 text-[#111315]'
          }">
            <strong>Demo Credentials:</strong> owner@fitshop.com / FITSHOP2026
          </div>

          <button type="submit" class="w-full py-3.5 rounded-full bg-[#111315] text-white dark:bg-white dark:text-[#111315] hover:bg-[#6E92B5] dark:hover:bg-[#6E92B5] dark:hover:text-white font-bold uppercase tracking-wider transition-colors">
            ENTER DASHBOARD
          </button>
        </form>
      </div>
    </div>
  `;
}

// ============================================================================
// 10. OWNER DASHBOARD VIEW (OVERVIEW, PRODUCTS, ORDERS, LIVE CONTENT EDITOR)
// ============================================================================
function renderDashboardView() {
  if (!state.isOwnerAuthenticated) {
    return renderOwnerLoginView();
  }

  const isDark = state.theme === 'dark';
  const totalRevenue = state.orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalStock = state.products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const lowStockCount = state.products.filter((p) => p.stock <= 15).length;

  return `
    <div class="min-h-screen flex flex-col lg:flex-row">
      <!-- Sidebar -->
      <aside class="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r p-6 flex flex-col justify-between ${
        isDark ? 'bg-[#16161B] border-white/10' : 'bg-white border-black/[0.06]'
      }">
        <div class="space-y-8">
          <div class="flex items-center justify-between">
            <div>
              <span class="font-display font-extrabold text-xl tracking-wider uppercase">${escapeHtml(
                state.siteSettings.brandName
              )}</span>
              <span class="block text-[10px] font-bold uppercase tracking-widest text-[#6E92B5]">OWNER ADMIN</span>
            </div>
            <button onclick="toggleTheme()" class="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
              <i data-lucide="${isDark ? 'sun' : 'moon'}" class="w-4 h-4"></i>
            </button>
          </div>

          <nav class="flex lg:flex-col gap-2 overflow-x-auto text-xs font-semibold">
            ${[
              { id: 'overview', label: 'Overview & KPIs', icon: 'layout-dashboard' },
              { id: 'products', label: `Products (${state.products.length})`, icon: 'package' },
              { id: 'orders', label: `Orders (${state.orders.length})`, icon: 'shopping-cart' },
              { id: 'content', label: 'Storefront Content', icon: 'sliders' }
            ]
              .map(
                (tab) => `
                <button
                  onclick="state.dashboardTab = '${tab.id}'; state.editingProduct = null; render();"
                  class="flex items-center gap-2.5 px-4 py-3 rounded-xl whitespace-nowrap transition-all ${
                    state.dashboardTab === tab.id
                      ? 'bg-[#111315] text-white dark:bg-white dark:text-[#111315]'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }">
                  <i data-lucide="${tab.icon}" class="w-4 h-4 text-[#6E92B5]"></i>
                  <span>${tab.label}</span>
                </button>
              `
              )
              .join('')}
          </nav>
        </div>

        <div class="pt-6 mt-6 border-t ${isDark ? 'border-white/10' : 'border-black/[0.06]'} flex lg:flex-col gap-2 text-xs font-semibold">
          <button
            onclick="navigateTo('home')"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#6E92B5] text-white hover:opacity-90">
            <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
            <span>VIEW LIVE STORE</span>
          </button>
          <button
            onclick="handleOwnerLogout()"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border ${
              isDark ? 'border-white/15 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'
            }">
            <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
            <span>SIGN OUT</span>
          </button>
        </div>
      </aside>

      <!-- Main Admin Content Panel -->
      <main class="flex-1 p-6 sm:p-10 max-w-6xl space-y-8">
        ${
          state.dashboardTab === 'overview'
            ? renderDashboardOverview(totalRevenue, totalStock, lowStockCount, isDark)
            : state.dashboardTab === 'products'
            ? renderDashboardProducts(isDark)
            : state.dashboardTab === 'orders'
            ? renderDashboardOrders(isDark)
            : renderDashboardContentEditor(isDark)
        }
      </main>
    </div>
  `;
}

function renderDashboardOverview(totalRevenue, totalStock, lowStockCount, isDark) {
  return `
    <div class="space-y-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-display font-extrabold text-2xl sm:text-3xl uppercase">STORE PERFORMANCE OVERVIEW</h1>
          <p class="text-xs text-zinc-400 mt-1">Real-time metrics synced with your FITSHOP storefront.</p>
        </div>
        <button
          onclick="resetStoreDemoData()"
          class="px-4 py-2 rounded-full text-xs font-semibold border ${
            isDark ? 'border-white/15 hover:bg-white/10' : 'border-black/15 hover:bg-black/5'
          }">
          RESET DEMO DATA
        </button>
      </div>

      <!-- 4 KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="p-5 rounded-2xl ${isDark ? 'bg-[#1B1B21] border border-white/10' : 'bg-white shadow-xs'}">
          <p class="text-[11px] font-bold uppercase text-zinc-400">GROSS REVENUE</p>
          <p class="font-display font-extrabold text-2xl mt-2 text-[#6E92B5]">${formatMoney(totalRevenue)}</p>
        </div>
        <div class="p-5 rounded-2xl ${isDark ? 'bg-[#1B1B21] border border-white/10' : 'bg-white shadow-xs'}">
          <p class="text-[11px] font-bold uppercase text-zinc-400">TOTAL ORDERS</p>
          <p class="font-display font-extrabold text-2xl mt-2">${state.orders.length}</p>
        </div>
        <div class="p-5 rounded-2xl ${isDark ? 'bg-[#1B1B21] border border-white/10' : 'bg-white shadow-xs'}">
          <p class="text-[11px] font-bold uppercase text-zinc-400">ACTIVE INVENTORY</p>
          <p class="font-display font-extrabold text-2xl mt-2">${totalStock} units</p>
        </div>
        <div class="p-5 rounded-2xl ${isDark ? 'bg-[#1B1B21] border border-white/10' : 'bg-white shadow-xs'}">
          <p class="text-[11px] font-bold uppercase text-zinc-400">LOW STOCK ALERTS</p>
          <p class="font-display font-extrabold text-2xl mt-2 ${lowStockCount > 0 ? 'text-amber-500' : ''}">${lowStockCount} SKUs</p>
        </div>
      </div>

      <!-- Recent Orders Preview -->
      <div class="rounded-2xl p-6 ${isDark ? 'bg-[#1B1B21] border border-white/10' : 'bg-white shadow-xs'} space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-display font-bold text-base uppercase">RECENT CUSTOMER ORDERS</h2>
          <button onclick="state.dashboardTab='orders'; render();" class="text-xs font-bold text-[#6E92B5] hover:underline">
            MANAGE ALL &rarr;
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b ${isDark ? 'border-white/10 text-zinc-400' : 'border-black/10 text-zinc-500'}">
                <th class="py-2.5">Order ID</th>
                <th class="py-2.5">Customer</th>
                <th class="py-2.5">Date</th>
                <th class="py-2.5">Status</th>
                <th class="py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y ${isDark ? 'divide-white/5' : 'divide-black/5'}">
              ${state.orders
                .slice(0, 5)
                .map(
                  (o) => `
                  <tr>
                    <td class="py-3 font-bold">${escapeHtml(o.id)}</td>
                    <td class="py-3">${escapeHtml(o.customerName)}</td>
                    <td class="py-3 text-zinc-400">${escapeHtml(o.date)}</td>
                    <td class="py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#6E92B5]/20 text-[#6E92B5]">
                        ${escapeHtml(o.status)}
                      </span>
                    </td>
                    <td class="py-3 text-right font-bold">${formatMoney(o.total)}</td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderDashboardProducts(isDark) {
  if (state.editingProduct) {
    const p = state.editingProduct === 'new' ? {} : state.editingProduct;
    return `
      <div class="space-y-6 max-w-2xl">
        <button onclick="state.editingProduct = null; render();" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#6E92B5]">
          <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
          <span>BACK TO CATALOG</span>
        </button>
        <h1 class="font-display font-extrabold text-2xl uppercase">
          ${p.id ? 'EDIT PRODUCT' : 'ADD NEW PRODUCT'}
        </h1>

        <form onsubmit="saveProductForm(event)" class="p-6 rounded-2xl space-y-4 text-xs ${
          isDark ? 'bg-[#1B1B21] border border-white/10' : 'bg-white shadow-xs'
        }">
          <input type="hidden" name="productId" value="${escapeHtml(p.id || '')}" />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold uppercase mb-1">Product Name *</label>
              <input name="name" required value="${escapeHtml(p.name || '')}" class="w-full px-3.5 py-2.5 rounded-xl border ${
                isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
              }" />
            </div>
            <div>
              <label class="block font-bold uppercase mb-1">Category *</label>
              <select name="category" class="w-full px-3.5 py-2.5 rounded-xl border ${
                isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
              }">
                ${['Men', 'Women', 'Accessories']
                  .map((c) => `<option value="${c}" ${p.category === c ? 'selected' : ''}>${c}</option>`)
                  .join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block font-bold uppercase mb-1">Price ($) *</label>
              <input name="price" type="number" step="0.01" required value="${p.price || ''}" class="w-full px-3.5 py-2.5 rounded-xl border ${
                isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
              }" />
            </div>
            <div>
              <label class="block font-bold uppercase mb-1">Compare-At Price ($)</label>
              <input name="compareAtPrice" type="number" step="0.01" value="${p.compareAtPrice || ''}" class="w-full px-3.5 py-2.5 rounded-xl border ${
                isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
              }" />
            </div>
            <div>
              <label class="block font-bold uppercase mb-1">Stock Quantity *</label>
              <input name="stock" type="number" required value="${p.stock !== undefined ? p.stock : 25}" class="w-full px-3.5 py-2.5 rounded-xl border ${
                isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
              }" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold uppercase mb-1">Sizes (comma-separated)</label>
              <input name="sizes" value="${escapeHtml((p.sizes || ['S', 'M', 'L', 'XL']).join(', '))}" class="w-full px-3.5 py-2.5 rounded-xl border ${
                isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
              }" />
            </div>
            <div>
              <label class="block font-bold uppercase mb-1">Colors (comma-separated)</label>
              <input name="colors" value="${escapeHtml((p.colors || ['Obsidian Black', 'Slate Blue']).join(', '))}" class="w-full px-3.5 py-2.5 rounded-xl border ${
                isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
              }" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold uppercase mb-1">Badge Tag (e.g. NEW, BESTSELLER)</label>
              <input name="badge" value="${escapeHtml(p.badge || '')}" class="w-full px-3.5 py-2.5 rounded-xl border ${
                isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
              }" />
            </div>
            <div class="flex items-center pt-5">
              <label class="inline-flex items-center gap-2 cursor-pointer font-bold">
                <input name="featured" type="checkbox" ${p.featured ? 'checked' : ''} class="rounded" />
                <span>Feature on Homepage</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block font-bold uppercase mb-1">Product Image URL</label>
            <input name="image" value="${escapeHtml(p.image || '')}" placeholder="https://images.unsplash.com/..." class="w-full px-3.5 py-2.5 rounded-xl border ${
              isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
            }" />
          </div>

          <div>
            <label class="block font-bold uppercase mb-1">Product Description</label>
            <textarea name="description" rows="3" class="w-full px-3.5 py-2.5 rounded-xl border ${
              isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
            }">${escapeHtml(p.description || '')}</textarea>
          </div>

          <button type="submit" class="px-6 py-3 rounded-full bg-[#6E92B5] text-white font-bold uppercase tracking-wider">
            SAVE PRODUCT TO STOREFRONT
          </button>
        </form>
      </div>
    `;
  }

  return `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="font-display font-extrabold text-2xl sm:text-3xl uppercase">PRODUCT CATALOG</h1>
          <p class="text-xs text-zinc-400 mt-1">Add, edit, or remove items. Changes reflect immediately on your storefront.</p>
        </div>
        <button
          onclick="state.editingProduct = 'new'; render();"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#6E92B5] text-white text-xs font-bold uppercase">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>ADD PRODUCT</span>
        </button>
      </div>

      <div class="rounded-2xl overflow-hidden ${isDark ? 'bg-[#1B1B21] border border-white/10' : 'bg-white shadow-xs'}">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b ${isDark ? 'border-white/10 text-zinc-400' : 'border-black/10 text-zinc-500'}">
                <th class="p-4">Product</th>
                <th class="p-4">Category</th>
                <th class="p-4">Price</th>
                <th class="p-4">Stock</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y ${isDark ? 'divide-white/5' : 'divide-black/5'}">
              ${state.products
                .map(
                  (p) => `
                  <tr>
                    <td class="p-4 flex items-center gap-3">
                      <img src="${escapeHtml(p.image)}" class="w-10 h-12 rounded-lg object-cover" />
                      <div>
                        <p class="font-bold">${escapeHtml(p.name)}</p>
                        ${p.featured ? '<span class="text-[10px] text-[#6E92B5] font-bold">FEATURED</span>' : ''}
                      </div>
                    </td>
                    <td class="p-4">${escapeHtml(p.category)}</td>
                    <td class="p-4 font-bold">${formatMoney(p.price)}</td>
                    <td class="p-4">${p.stock} units</td>
                    <td class="p-4 text-right space-x-2">
                      <button
                        onclick="state.editingProduct = state.products.find(x => x.id === '${p.id}'); render();"
                        class="px-3 py-1.5 rounded-lg font-semibold ${
                          isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'
                        }">
                        Edit
                      </button>
                      <button
                        onclick="deleteProduct('${p.id}')"
                        class="px-3 py-1.5 rounded-lg font-semibold text-red-500 hover:bg-red-500/10">
                        Delete
                      </button>
                    </td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderDashboardOrders(isDark) {
  return `
    <div class="space-y-6">
      <div>
        <h1 class="font-display font-extrabold text-2xl sm:text-3xl uppercase">CUSTOMER ORDERS</h1>
        <p class="text-xs text-zinc-400 mt-1">Track fulfillment status and customer purchases.</p>
      </div>

      <div class="space-y-4">
        ${state.orders
          .map(
            (ord) => `
            <div class="p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isDark ? 'bg-[#1B1B21] border border-white/10' : 'bg-white shadow-xs'
            }">
              <div class="space-y-1 text-xs">
                <div class="flex items-center gap-2.5">
                  <span class="font-display font-extrabold text-sm">${escapeHtml(ord.id)}</span>
                  <span class="text-zinc-400">• ${escapeHtml(ord.date)}</span>
                </div>
                <p class="font-bold">${escapeHtml(ord.customerName)} (${escapeHtml(ord.customerEmail)})</p>
                <p class="text-zinc-400">${escapeHtml(ord.address)}</p>
                <p class="pt-1 text-[#6E92B5] font-medium">
                  ${ord.items.map((i) => `${i.qty}x ${escapeHtml(i.name)} (${escapeHtml(i.size)})`).join(', ')}
                </p>
              </div>

              <div class="flex items-center gap-4">
                <span class="font-display font-extrabold text-base">${formatMoney(ord.total)}</span>
                <select
                  onchange="updateOrderStatus('${ord.id}', this.value)"
                  class="px-3 py-2 rounded-xl text-xs font-bold border ${
                    isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
                  }">
                  ${['Processing', 'Shipped', 'Delivered', 'Cancelled']
                    .map((st) => `<option value="${st}" ${ord.status === st ? 'selected' : ''}>${st}</option>`)
                    .join('')}
                </select>
              </div>
            </div>
          `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderDashboardContentEditor(isDark) {
  const s = state.siteSettings;
  const inputCls = `w-full px-3.5 py-2.5 rounded-xl border ${
    isDark ? 'bg-[#121216] border-white/15' : 'bg-[#F4F5F7] border-black/10'
  }`;

  return `
    <div class="space-y-6 max-w-3xl">
      <div>
        <h1 class="font-display font-extrabold text-2xl sm:text-3xl uppercase">LIVE STOREFRONT CONTENT EDITOR</h1>
        <p class="text-xs text-zinc-400 mt-1">Customize headlines, imagery, and promotional banners across your homepage.</p>
      </div>

      <form onsubmit="saveSiteSettingsForm(event)" class="p-6 rounded-2xl space-y-5 text-xs ${
        isDark ? 'bg-[#1B1B21] border border-white/10' : 'bg-white shadow-xs'
      }">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block font-bold uppercase mb-1">Brand Name</label>
            <input name="brandName" value="${escapeHtml(s.brandName)}" class="${inputCls}" />
          </div>
          <div>
            <label class="block font-bold uppercase mb-1">Hero Headline Line 1</label>
            <input name="heroTitleLine1" value="${escapeHtml(s.heroTitleLine1)}" class="${inputCls}" />
          </div>
          <div>
            <label class="block font-bold uppercase mb-1">Hero Headline Line 2</label>
            <input name="heroTitleLine2" value="${escapeHtml(s.heroTitleLine2)}" class="${inputCls}" />
          </div>
        </div>

        <div>
          <label class="block font-bold uppercase mb-1">Hero Subcopy</label>
          <textarea name="heroDescription" rows="2" class="${inputCls}">${escapeHtml(s.heroDescription)}</textarea>
        </div>

        <div>
          <label class="block font-bold uppercase mb-1">Hero Athlete Image URL</label>
          <input name="heroImage" value="${escapeHtml(s.heroImage)}" class="${inputCls}" />
        </div>

        <hr class="${isDark ? 'border-white/10' : 'border-black/10'}" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold uppercase mb-1">Showcase Watermark Text</label>
            <input name="showcaseWatermark" value="${escapeHtml(s.showcaseWatermark)}" class="${inputCls}" />
          </div>
          <div>
            <label class="block font-bold uppercase mb-1">Showcase Center Image URL</label>
            <input name="showcaseCenterImg" value="${escapeHtml(s.showcaseCenterImg)}" class="${inputCls}" />
          </div>
          <div>
            <label class="block font-bold uppercase mb-1">Showcase Left Image URL</label>
            <input name="showcaseLeftImg" value="${escapeHtml(s.showcaseLeftImg)}" class="${inputCls}" />
          </div>
          <div>
            <label class="block font-bold uppercase mb-1">Showcase Right Image URL</label>
            <input name="showcaseRightImg" value="${escapeHtml(s.showcaseRightImg)}" class="${inputCls}" />
          </div>
        </div>

        <hr class="${isDark ? 'border-white/10' : 'border-black/10'}" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold uppercase mb-1">Editorial Heading</label>
            <input name="editorialTitle" value="${escapeHtml(s.editorialTitle)}" class="${inputCls}" />
          </div>
          <div>
            <label class="block font-bold uppercase mb-1">Editorial Image URL</label>
            <input name="editorialImg" value="${escapeHtml(s.editorialImg)}" class="${inputCls}" />
          </div>
        </div>
        <div>
          <label class="block font-bold uppercase mb-1">Editorial Body Copy</label>
          <textarea name="editorialBody" rows="2" class="${inputCls}">${escapeHtml(s.editorialBody)}</textarea>
        </div>

        <hr class="${isDark ? 'border-white/10' : 'border-black/10'}" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold uppercase mb-1">Statement Banner Headline</label>
            <input name="bannerTitle" value="${escapeHtml(s.bannerTitle)}" class="${inputCls}" />
          </div>
          <div>
            <label class="block font-bold uppercase mb-1">Statement Banner Image URL</label>
            <input name="bannerImg" value="${escapeHtml(s.bannerImg)}" class="${inputCls}" />
          </div>
        </div>
        <div>
          <label class="block font-bold uppercase mb-1">Statement Banner Subtitle</label>
          <input name="bannerSubtitle" value="${escapeHtml(s.bannerSubtitle)}" class="${inputCls}" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold uppercase mb-1">Promo Offer Headline</label>
            <input name="promoTitle" value="${escapeHtml(s.promoTitle)}" class="${inputCls}" />
          </div>
          <div>
            <label class="block font-bold uppercase mb-1">Promo Offer Subtitle</label>
            <input name="promoSubtitle" value="${escapeHtml(s.promoSubtitle)}" class="${inputCls}" />
          </div>
        </div>

        <button type="submit" class="px-6 py-3.5 rounded-full bg-[#6E92B5] text-white font-bold uppercase tracking-wider">
          PUBLISH STOREFRONT UPDATES
        </button>
      </form>
    </div>
  `;
}

// ============================================================================
// 11. MASTER RENDER, INTERSECTION OBSERVER SCROLL REVEALS & SHOWCASE MOTION
// ============================================================================
let heroObserver = null;
let heroTypewriterTimer = null;
let heroStartTimer = null;

function runHeroTypewriter(fullText) {
  clearTimeout(heroStartTimer);
  clearInterval(heroTypewriterTimer);

  const targetEl = document.getElementById('hero-typewriter-target');
  const cursorEl = document.getElementById('hero-typewriter-cursor');
  if (!targetEl) return;

  targetEl.textContent = '';
  if (cursorEl) cursorEl.classList.remove('hidden');

  let charIdx = 0;
  heroStartTimer = setTimeout(() => {
    heroTypewriterTimer = setInterval(() => {
      charIdx += 1;
      targetEl.textContent = fullText.slice(0, charIdx);
      if (charIdx >= fullText.length) {
        clearInterval(heroTypewriterTimer);
        state.heroAnimPlayed = true;
        setTimeout(() => {
          const cur = document.getElementById('hero-typewriter-cursor');
          if (cur) cur.classList.add('hidden');
        }, 900);
      }
    }, 52);
  }, 1550);
}

function replayHeroAnimation() {
  const heroEl = document.getElementById('hero-section');
  if (!heroEl) return;
  const isDark = state.theme === 'dark';

  // Restart CSS animations on hero elements
  const animSelectors = [
    '.animate-hero-model',
    '.animate-hero-left',
    '.animate-hero-right',
    '.animate-mask-line-1',
    '.animate-hero-cta'
  ];
  animSelectors.forEach((sel) => {
    const el = heroEl.querySelector(sel);
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  });

  // Rebuild hero Venetian-blind slats so they wipe open again
  const modelWrap = heroEl.querySelector('.animate-hero-model > div');
  if (modelWrap) {
    const oldBlinds = modelWrap.querySelector('.hero-blinds-overlay');
    if (oldBlinds) oldBlinds.remove();
    const overlay = document.createElement('div');
    overlay.className = 'hero-blinds-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = [0, 1, 2, 3, 4, 5, 6]
      .map(
        (i) =>
          `<div class="hero-blind-slat ${
            isDark ? 'bg-[#121216]' : 'bg-[#DCE5E9]'
          }" style="animation-delay: ${0.32 + i * 0.055}s;"></div>`
      )
      .join('');
    modelWrap.appendChild(overlay);
  }

  runHeroTypewriter(state.siteSettings.heroTitleLine2 || 'EVERY WORKOUT!');
}

function initHeroMotion() {
  if (heroObserver) heroObserver.disconnect();
  const heroEl = document.getElementById('hero-section');
  if (!heroEl || state.activeView !== 'home') return;

  let wasOutOfView = false;

  heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          wasOutOfView = true;
          clearTimeout(heroStartTimer);
          clearInterval(heroTypewriterTimer);
        } else if (wasOutOfView) {
          wasOutOfView = false;
          state.heroAnimPlayed = false;
          replayHeroAnimation();
        }
      });
    },
    { threshold: 0.2 }
  );

  heroObserver.observe(heroEl);

  if (!state.heroAnimPlayed) {
    runHeroTypewriter(state.siteSettings.heroTitleLine2 || 'EVERY WORKOUT!');
  }
}

let showcaseObserver = null;
let showcaseTimers = [];

function playShowcaseAnimation(sectionEl) {
  const isDark = state.theme === 'dark';
  showcaseTimers.forEach((t) => clearTimeout(t));
  showcaseTimers = [];

  // 1. Rebuild Venetian-blind slats so they wipe open cleanly on every entry
  sectionEl.querySelectorAll('.showcase-card-enter').forEach((card, cardIdx) => {
    const oldOverlay = card.querySelector('.showcase-blinds-overlay');
    if (oldOverlay) oldOverlay.remove();

    const slatCount = cardIdx === 1 ? 9 : 7;
    const baseDelay = cardIdx === 0 ? 0.12 : cardIdx === 1 ? 0.22 : 0.32;
    const overlay = document.createElement('div');
    overlay.className = 'showcase-blinds-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = Array.from({ length: slatCount })
      .map(
        (_, i) =>
          `<div class="showcase-blind-slat ${
            isDark ? 'bg-[#121216]' : 'bg-[#F4F5F7]'
          }" style="animation-delay: ${baseDelay + i * 0.05}s;"></div>`
      )
      .join('');
    card.appendChild(overlay);

    const delay = Number(card.getAttribute('data-delay') || 0);
    const timer = setTimeout(() => {
      card.classList.add('is-revealed');
    }, delay);
    showcaseTimers.push(timer);
  });

  // 2. Staggered editorial caption reveal
  sectionEl.querySelectorAll('.showcase-caption-enter').forEach((cap) => {
    const delay = Number(cap.getAttribute('data-delay') || 350);
    const timer = setTimeout(() => {
      cap.classList.add('is-revealed');
    }, delay);
    showcaseTimers.push(timer);
  });
}

function resetShowcaseAnimation(sectionEl) {
  showcaseTimers.forEach((t) => clearTimeout(t));
  showcaseTimers = [];
  sectionEl.querySelectorAll('.showcase-card-enter, .showcase-caption-enter').forEach((el) => {
    el.classList.remove('is-revealed');
  });
}

function initShowcaseMotion() {
  if (showcaseObserver) showcaseObserver.disconnect();
  const sectionEl = document.getElementById('showcase-section');
  if (!sectionEl || state.activeView !== 'home') return;

  // Replay every time the user enters from above (scroll down) OR below (scroll up), plus on refresh
  showcaseObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          playShowcaseAnimation(sectionEl);
        } else {
          resetShowcaseAnimation(sectionEl);
        }
      });
    },
    { threshold: 0.18 }
  );

  showcaseObserver.observe(sectionEl);
}

// Continuous scroll-linked parallax for watermark & outer columns
let showcaseParallaxTicking = false;
window.addEventListener(
  'scroll',
  () => {
    if (showcaseParallaxTicking) return;
    showcaseParallaxTicking = true;
    requestAnimationFrame(() => {
      const sectionEl = document.getElementById('showcase-section');
      if (sectionEl && state.activeView === 'home') {
        const rect = sectionEl.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        if (rect.bottom > 0 && rect.top < vh) {
          const progress = ((vh * 0.5 - (rect.top + rect.height * 0.5)) / vh) * 2;
          const watermark = document.getElementById('showcase-watermark-text');
          const leftCol = document.getElementById('showcase-col-left');
          const rightCol = document.getElementById('showcase-col-right');

          if (watermark) {
            watermark.style.transform = `translate3d(${progress * -38}px, 0, 0)`;
          }
          if (leftCol && window.innerWidth >= 768) {
            leftCol.style.transform = `translate3d(0, ${progress * -18}px, 0)`;
          }
          if (rightCol && window.innerWidth >= 768) {
            rightCol.style.transform = `translate3d(0, ${progress * 18}px, 0)`;
          }
        }
      }
      showcaseParallaxTicking = false;
    });
  },
  { passive: true }
);

let scrollObserver = null;
function initScrollReveals() {
  if (scrollObserver) scrollObserver.disconnect();
  scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          scrollObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
  );
  document.querySelectorAll('.scroll-reveal').forEach((el) => scrollObserver.observe(el));
}

function render() {
  const root = document.getElementById('app');
  if (!root) return;

  if (state.activeView === 'dashboard') {
    root.innerHTML = renderDashboardView();
  } else if (state.activeView === 'login') {
    root.innerHTML = renderOwnerLoginView();
  } else {
    root.innerHTML = renderStorefrontView();
  }

  renderModals();
  if (window.lucide) window.lucide.createIcons();
  initScrollReveals();
  initHeroMotion();
  initShowcaseMotion();
}

// ============================================================================
// 12. BOOTSTRAP APPLICATION
// ============================================================================
applyThemeClass();
render();
