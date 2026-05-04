let currentSlide = 0;

const fallbackProducts = [
  {
    id: 1,
    name: 'Гель для стирки Active Color',
    category: 'Гели',
    categoryKey: 'floor',
    brand: 'ACTIVE',
    volumeLabel: '2 л',
    volumeKey: 'large',
    price: 3600,
    oldPrice: 4200,
    isNew: true,
    badge: 'new',
    image: 'img/agel.png',
  },
    {
    id: 2,
    name: 'Стиральный порошок Sanraizu Universal',
    category: 'Стиральные порошки',
    categoryKey: 'glass',
    brand: 'SANRAIZU',
    volumeLabel: '3 кг',
    volumeKey: 'large',
    price: 5200,
    oldPrice: 5900,
    isNew: false,
    badge: 'hit',
    image: 'img/poroshok.png',
  },
  {
    id: 3,
    name: 'Шампунь для ковров Profi Clean',
    category: 'Шампуни',
    categoryKey: 'dishes',
    brand: 'PROFI',
    volumeLabel: '1 л',
    volumeKey: 'medium',
    price: 2900,
    oldPrice: 0,
    isNew: true,
    badge: 'new',
    image: 'img/Sanraizu.png',
  },
  {
    id: 4,
    name: 'Антибактериальное мыло Fresh Care',
    category: 'Мыла',
    categoryKey: 'disinfect',
    brand: 'FRESH CARE',
    volumeLabel: '500 мл',
    volumeKey: 'small',
    price: 1200,
    oldPrice: 1450,
    isNew: false,
    badge: 'sale',
    image: 'img/san.jpg',
  },
  {
    id: 5,
    name: 'Детские подгузники Soft Baby XL',
    category: 'Подгузники',
    categoryKey: 'universal',
    brand: 'SOFT BABY',
    volumeLabel: '52 шт',
    volumeKey: 'xlarge',
    price: 7800,
    oldPrice: 8600,
    isNew: false,
    badge: 'hit',
    image: 'img/acfon.jpg',
  },
  {
    id: 6,
    name: 'Универсальный очиститель кухонных поверхностей',
    category: 'Другое',
    categoryKey: 'plumbing',
    brand: 'HOME PRO',
    volumeLabel: '750 мл',
    volumeKey: 'medium',
    price: 2150,
    oldPrice: 0,
    isNew: true,
    badge: 'new',
    image: 'img/detergent.png',
  },
];

let products = [...fallbackProducts];

const state = {
  favorites: new Set(),
  cart: new Map(),
  filteredProducts: [...products],
  currentCategory: 'all',
};



async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    if (!Array.isArray(data) || !data.length) throw new Error('Invalid response');
    products = data;
  } catch (_error) {
    products = [...fallbackProducts];
  }

  state.filteredProducts = [...products];
}
function getSelectedBrands() {
  return Array.from(document.querySelectorAll('#brandFilters input[data-brand]:checked'))
    .map((input) => input.dataset.brand);
}

function getSelectedVolumes() {
  return Array.from(document.querySelectorAll('.filter-block input[data-vol]:checked'))
    .map((input) => input.dataset.vol);
}

function filterProducts() {
  const min = Number(document.getElementById('priceMin')?.value || 0);
  const max = Number(document.getElementById('priceMax')?.value || Number.MAX_SAFE_INTEGER);
  const brands = getSelectedBrands();
  const volumes = getSelectedVolumes();

  state.filteredProducts = products.filter((product) => {
    const inCategory = state.currentCategory === 'all' || product.categoryKey === state.currentCategory;
    const inPrice = product.price >= min && product.price <= max;
    const inBrand = !brands.length || brands.includes(product.brand);
    const inVolume = !volumes.length || volumes.includes(product.volumeKey);

    return inCategory && inPrice && inBrand && inVolume;
  });

  renderProducts(state.filteredProducts);
}

function getSlides() {
  return Array.from(document.querySelectorAll('.hero .slide'));
}

function getDotsContainer() {
  return document.getElementById('sliderDots');
}

function renderDots(total) {
  const container = getDotsContainer();
  if (!container) return;

  container.innerHTML = '';
  for (let i = 0; i < total; i += 1) {
    const dot = document.createElement('button');
    dot.className = `sdot${i === currentSlide ? ' active' : ''}`;
    dot.type = 'button';
    dot.setAttribute('aria-label', `Слайд ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    container.appendChild(dot);
  }
}

function updateSlider() {
  const slides = getSlides();
  if (!slides.length) return;

  slides.forEach((slide, index) => {
    slide.classList.toggle('active', index === currentSlide);
  });

  const dots = document.querySelectorAll('.sdot');
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentSlide);
  });
}

function goToSlide(index) {
  const slides = getSlides();
  if (!slides.length) return;

  const total = slides.length;
  currentSlide = (index + total) % total;
  updateSlider();
}

function changeSlide(direction) {
  goToSlide(currentSlide + direction);
}

function setupSlider() {
  const slides = getSlides();
  if (!slides.length) return;

  renderDots(slides.length);
  updateSlider();
}

function updateCountdown() {
  const endDate = new Date('2026-12-31T23:59:59+05:00').getTime();
  const now = Date.now();
  const distance = Math.max(endDate - now, 0);

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((distance / (1000 * 60)) % 60);
  const secs = Math.floor((distance / 1000) % 60);

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value).padStart(2, '0');
  };

  set('cd-days', days);
  set('cd-hours', hours);
  set('cd-mins', mins);
  set('cd-secs', secs);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function getAssetPath(imagePath) {
  if (window.location.pathname.includes('/pages/')) {
    return `../${imagePath}`;
  }
  return imagePath;
}

function formatPrice(value) {
  return `${new Intl.NumberFormat('ru-RU').format(value)} тг`;
}

function renderProducts(list = state.filteredProducts) {
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;

  productsGrid.innerHTML = '';
  list.forEach((product) => {
    const isLiked = state.favorites.has(product.id);
    const card = document.createElement('article');
    card.className = 'prod-card';

    const badgeClass = {
      sale: 'badge-sale',
      new: 'badge-new',
      hit: 'badge-hit',
    }[product.badge] || 'badge-new';

    const badgeLabel = {
      sale: 'sale',
      new: 'new',
      hit: 'hit',
    }[product.badge] || 'new';

    const showBadge = product.badge !== 'sale';

    card.innerHTML = `
      ${showBadge ? `<span class="prod-badge ${badgeClass}">${badgeLabel}</span>` : ''}
      <button class="prod-fav${isLiked ? ' liked' : ''}" type="button" aria-label="Добавить в избранное" data-id="${product.id}">❤</button>
      <div class="prod-img">
        <img src="${getAssetPath(product.image)}" alt="${product.name}" loading="lazy" decoding="async">
      </div>
      <div class="prod-body">
        <div class="prod-cat">${product.category}</div>
        <h3 class="prod-name">${product.name}</h3>
        <div class="prod-vol">Объём: ${product.volumeLabel}</div>
        <div class="prod-box-note">Продажа коробками</div>
        <div class="prod-price-row">
          <div class="prod-price">${formatPrice(product.price)}</div>
        </div>
        <div class="prod-actions">
          <div class="qty-control" data-qty-control="${product.id}">
            <button type="button" class="qty-btn" data-qty-dec="${product.id}" aria-label="Уменьшить количество">−</button>
            <input class="qty-input" type="number" min="1" value="1" data-qty-input="${product.id}" aria-label="Количество коробок">
            <button type="button" class="qty-btn" data-qty-inc="${product.id}" aria-label="Увеличить количество">+</button>
          </div>
          <button class="btn-cart" type="button" data-cart-id="${product.id}">В корзину</button>
        </div>
      </div>`;

    productsGrid.appendChild(card);
  });

  document.querySelectorAll('[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => toggleFavorite(Number(btn.dataset.id)));
  });

  document.querySelectorAll('[data-cart-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const productId = Number(btn.dataset.cartId);
      const qtyInput = document.querySelector(`[data-qty-input="${productId}"]`);
      const qty = Math.max(1, Number(qtyInput?.value || 1));
      if (qtyInput) qtyInput.value = String(qty);
      addToCart(productId, qty);
    });
  });

  document.querySelectorAll('[data-qty-dec]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const productId = Number(btn.dataset.qtyDec);
      const qtyInput = document.querySelector(`[data-qty-input="${productId}"]`);
      if (!qtyInput) return;
      const current = Math.max(1, Number(qtyInput.value || 1));
      qtyInput.value = String(Math.max(1, current - 1));
    });
  });

  document.querySelectorAll('[data-qty-inc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const productId = Number(btn.dataset.qtyInc);
      const qtyInput = document.querySelector(`[data-qty-input="${productId}"]`);
      if (!qtyInput) return;
      const current = Math.max(1, Number(qtyInput.value || 1));
      qtyInput.value = String(current + 1);
    });
  });

  document.querySelectorAll('[data-qty-input]').forEach((input) => {
    input.addEventListener('input', () => {
      const normalized = Math.max(1, Number(input.value || 1));
      if (normalized !== Number(input.value)) input.value = String(normalized);
    });
  });

  const results = document.getElementById('resultsCount');
  if (results) results.textContent = String(list.length);

  const noResults = document.getElementById('noResults');
  if (noResults) noResults.style.display = list.length ? 'none' : 'block';
}

function updateFavoriteBadge() {
  const badge = document.getElementById('favCount') || document.getElementById('favBadge');
  if (!badge) return;

  const total = state.favorites.size;
  badge.textContent = String(total);
  badge.style.display = total ? 'inline-flex' : 'none';
}

function toggleFavorite(productId) {
  if (state.favorites.has(productId)) {
    state.favorites.delete(productId);
    showToast('Удалено из избранного');
  } else {
    state.favorites.add(productId);
    showToast('Добавлено в избранное');
  }

  updateFavoriteBadge();
  renderProducts(state.filteredProducts);
}

function updateCartBadge() {
  const cartBadge = document.getElementById('cartBadge');
  if (!cartBadge) return;

  const totalItems = Array.from(state.cart.values()).reduce((sum, qty) => sum + qty, 0);
  cartBadge.textContent = String(totalItems);
  cartBadge.style.display = totalItems ? 'flex' : 'none';
}

function addToCart(productId, qty = 1) {
  const current = state.cart.get(productId) || 0;
  state.cart.set(productId, current + qty);
  updateCartBadge();
  renderCart();
  showToast(`Добавлено в корзину: ${qty} кор.`);
}

function removeFromCart(productId) {
  state.cart.delete(productId);
  updateCartBadge();
  renderCart();
}

function cartTotal() {
  let total = 0;
  state.cart.forEach((qty, productId) => {
    const product = products.find((item) => item.id === productId);
    if (product) total += product.price * qty;
  });
  return total;
}

function renderCart() {
  const cartItems = document.getElementById('cartItems');
  const cartBody = document.getElementById('cartBody');
  const container = cartItems || cartBody;
  if (!container) return;

  const entries = Array.from(state.cart.entries());
  if (!entries.length) {
    container.innerHTML = '<div class="cart-empty"><span>🛒</span><p>Корзина пуста</p></div>';
    const footer = document.getElementById('cartFooter') || document.getElementById('cartFoot');
    if (footer) footer.style.display = 'none';
    return;
  }

  container.innerHTML = entries.map(([productId, qty]) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return '';

    return `
      <div class="cart-item">
        <img src="${getAssetPath(product.image)}" alt="${product.name}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-name">${product.name}</div>
          <div class="cart-item-price">${qty} кор. × ${formatPrice(product.price)}</div>
        </div>
        <div class="cart-item-actions">
          <strong>${formatPrice(product.price * qty)}</strong>
          <button class="cart-item-remove" type="button" onclick="removeFromCart(${product.id})">✕</button>
        </div>
      </div>`;
  }).join('');

  const footer = document.getElementById('cartFooter') || document.getElementById('cartFoot');
  if (footer) footer.style.display = 'block';

  const total = document.getElementById('cartTotal') || document.getElementById('Total');
  if (total) total.textContent = formatPrice(cartTotal());
}

function handleSearch() {
  const input = document.getElementById('searchInput');
  const value = input ? input.value.trim().toLowerCase() : '';

  const hasCatalog = document.getElementById('productsGrid');
  if (!hasCatalog) {
    if (!value) {
      showToast('Введите запрос для поиска');
      return;
    }

    const targetPath = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
    window.location.href = `${targetPath}?search=${encodeURIComponent(value)}`;
    return;
  }

  state.filteredProducts = products.filter((product) => {
    if (!value) return true;
    const haystack = `${product.name} ${product.category} ${product.brand}`.toLowerCase();
    return haystack.includes(value);
  });

  renderProducts(state.filteredProducts);
}

function syncSearchFromQuery() {
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;

  const params = new URLSearchParams(window.location.search);
  const query = params.get('search');
  if (!query) return;

  const input = document.getElementById('searchInput');
  if (input) input.value = query;
  handleSearch();
}

function applyFilters() {
  filterProducts();
}

function resetFilters() {
  state.filteredProducts = [...products];
  state.currentCategory = 'all';
  
  const min = document.getElementById('priceMin');
  const max = document.getElementById('priceMax');
  if (min) min.value = '';
  if (max) max.value = '';

  document.querySelectorAll('#categoriesList a').forEach((el) => el.classList.remove('active'));
  const allCategory = document.querySelector('#categoriesList a[data-cat="all"]');
  if (allCategory) allCategory.classList.add('active');

  document.querySelectorAll('#brandFilters input[data-brand], .filter-block input[data-vol]')
    .forEach((input) => {
      input.checked = false;
    });

  renderProducts(state.filteredProducts);
}

function setupCategories() {
  const links = document.querySelectorAll('#categoriesList a[data-cat]');
  if (!links.length) return;

  const counts = products.reduce((acc, product) => {
    acc[product.categoryKey] = (acc[product.categoryKey] || 0) + 1;
    return acc;
  }, {});

  links.forEach((link) => {
    const cat = link.dataset.cat;
    const count = link.querySelector('.cat-count');
    if (count) {
      count.textContent = cat === 'all' ? String(products.length) : String(counts[cat] || 0);
    }

    link.addEventListener('click', (event) => {
      event.preventDefault();
      links.forEach((item) => item.classList.remove('active'));
      link.classList.add('active');
      state.currentCategory = cat;

      filterProducts();
    });
  });
}

function setupBrandFilters() {
  const container = document.getElementById('brandFilters');
  if (!container) return;

  const brands = [...new Set(products.map((product) => product.brand))].sort((a, b) => a.localeCompare(b));

  container.innerHTML = brands.map((brand, index) => {
    const inputId = `brand-${index + 1}`;
    return `
      <div class="filter-item">
        <input type="checkbox" id="${inputId}" data-brand="${brand}">
        <label for="${inputId}">${brand}</label>
      </div>`;
  }).join('');

  container.querySelectorAll('input[data-brand]').forEach((input) => {
    input.addEventListener('change', filterProducts);
  });
}

function setupVolumeFilters() {
  document.querySelectorAll('.filter-block input[data-vol]').forEach((input) => {
    input.addEventListener('change', filterProducts);
  });
}

function toggleFav() {
  if (!state.favorites.size) {
    showToast('Пока нет избранных товаров');
    return;
  }
  showToast(`В избранном: ${state.favorites.size} товаров`);
}

function openCart(event) {
  if (event) event.preventDefault();

  document.getElementById('cartDrawer')?.classList.add('active');
  (document.getElementById('overlay') || document.getElementById('cartOverlay'))?.classList.add('active');
}

function closeCart() {
  document.getElementById('cartDrawer')?.classList.remove('active');
  (document.getElementById('overlay') || document.getElementById('cartOverlay'))?.classList.remove('active');
}

function subscribe() {
  const input = document.getElementById('emailInput');
  const email = input ? input.value.trim() : '';
  if (!email.includes('@')) {
    showToast('Введите корректный email');
    return;
  }

  showToast('Спасибо за подписку!');
  if (input) input.value = '';
}

function sortProducts() {
  const select = document.getElementById('sortSelect');
  if (!select) return;

  const value = select.value;
  const sorted = [...state.filteredProducts];

  if (value === 'price-asc') sorted.sort((a, b) => a.price - b.price);
  if (value === 'price-desc') sorted.sort((a, b) => b.price - a.price);
  if (value === 'newest') sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew));

  state.filteredProducts = sorted;
  renderProducts(state.filteredProducts);
}

function setView(mode) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');

  if (mode === 'list') {
    grid.style.gridTemplateColumns = '1fr';
    gridBtn?.classList.remove('active');
    listBtn?.classList.add('active');
  } else {
    grid.style.gridTemplateColumns = '';
    listBtn?.classList.remove('active');
    gridBtn?.classList.add('active');
  }
}

function toggleFilters() {
  document.getElementById('filtersWrap')?.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', async () => {
  setupSlider();
  updateCountdown();
  setInterval(updateCountdown, 1000);

  await loadProducts();
  renderProducts();
  setupCategories();
  setupBrandFilters();
  setupVolumeFilters();
  updateFavoriteBadge();
  updateCartBadge();
  renderCart();
  syncSearchFromQuery();
});

window.changeSlide = changeSlide;
window.goToSlide = goToSlide;
window.handleSearch = handleSearch;
window.toggleFav = toggleFav;
window.openCart = openCart;
window.closeCart = closeCart;
window.subscribe = subscribe;
window.searchProducts = handleSearch;
window.toggleCart = (event) => {
  const drawer = document.getElementById('cartDrawer');
  const isOpen = drawer?.classList.contains('active');
  if (isOpen) {
    closeCart();
  } else {
    openCart(event);
  }
};
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.sortProducts = sortProducts;
window.setView = setView;
window.toggleFilters = toggleFilters;
window.removeFromCart = removeFromCart;
