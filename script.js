const slides = document.getElementById('slides');
const dots = document.querySelectorAll('.wertili');
const prevBtn = document.getElementById('prevSlide');
const nextBtn = document.getElementById('nextSlide');
let currentSlide = 0;
const totalSlides = dots.length;

function goToSlide(index) {
  currentSlide = (index + totalSlides) % totalSlides;
  slides.style.transform = `translateX(-${currentSlide * 33.333}%)`;
  dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
}

if (prevBtn && nextBtn) {
  prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
  nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
  dots.forEach(dot => {
    dot.addEventListener('click', () => goToSlide(Number(dot.dataset.index)));
  });
  setInterval(() => goToSlide(currentSlide + 1), 5000);
}

const searchInput = document.getElementById('search');
const filterBtns = document.querySelectorAll('.filtri-btn');
const movieCards = document.querySelectorAll('#movieGrid .kino');
const noResults = document.getElementById('noResults');
let activeFilter = 'all';

function applyFilters() {
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  let visibleCount = 0;

  movieCards.forEach(card => {
    const titleText = card.querySelector('.title').innerText.toLowerCase();
    const categories = card.dataset.category || '';
    const matchesSearch = titleText.includes(query);
    const matchesCategory = activeFilter === 'all' || categories.includes(activeFilter);

    if (matchesSearch && matchesCategory) {
      card.style.display = 'flex';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  if (noResults) {
    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
  }
}

if (searchInput) {
  searchInput.addEventListener('input', applyFilters);
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    applyFilters();
  });
});

const menuToggle = document.getElementById('menu-toggle');
const navLeft = document.querySelector('.nav-left');

document.addEventListener('click', e => {
  if (menuToggle && menuToggle.checked && navLeft && !navLeft.contains(e.target)) {
    menuToggle.checked = false;
  }
});

document.querySelectorAll('.dropdown-sidebar a').forEach(link => {
  link.addEventListener('click', () => {
    if (menuToggle) menuToggle.checked = false;
  });
});

const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  if (backToTop) {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }
});