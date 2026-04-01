let currentSlide = 0;

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
  const total = slides.length;

  slides.forEach((slide, index) => {
    const forwardDistance = (index - currentSlide + total) % total;
    const backwardDistance = (currentSlide - index + total) % total;
    const isActive = index === currentSlide;
    const isNext = !isActive && forwardDistance <= backwardDistance;

    slide.classList.toggle('active', isActive);
    slide.classList.toggle('next', !isActive && isNext);
    slide.classList.toggle('prev', !isActive && !isNext);
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

function handleSearch() {
  const input = document.getElementById('searchInput');
  const value = input ? input.value.trim() : '';
  if (!value) {
    showToast('Введите запрос для поиска');
    return;
  }
  const targetPath = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
  window.location.href = `${targetPath}?search=${encodeURIComponent(value)}`;
}

function toggleFav() {
  showToast('Избранное скоро будет доступно');
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

document.addEventListener('DOMContentLoaded', () => {
  setupSlider();
  updateCountdown();
  setInterval(updateCountdown, 1000);
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
