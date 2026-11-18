const movieGrid = document.getElementById('movieGrid');
const allCards = Array.from(movieGrid.querySelectorAll('.kino'));
const searchInput = document.getElementById('search');
const genreFilter = document.getElementById('genreFilter');
const yearFilter = document.getElementById('yearFilter');
const langFilter = document.getElementById('langFilter');
const sortSelect = document.getElementById('sortSelect');
const resetBtn = document.getElementById('resetFilters');
const movieCount = document.getElementById('movieCount');
const noResults = document.getElementById('noResults');
const pagination = document.getElementById('pagination');
const backToTop = document.getElementById('backToTop');

const perPage = 14;
let currentPage = 1;

function updateCatalog() {
  const query = searchInput.value.toLowerCase().trim();
  const genre = genreFilter.value;
  const year = yearFilter.value;
  const lang = langFilter.value;
  const sortBy = sortSelect.value;

  let filtered = allCards.filter(card => {
    const titleText = card.querySelector('.title').innerText.toLowerCase();
    const cardGenres = card.dataset.genre || '';
    const cardYear = Number(card.dataset.year);
    const cardLangs = card.dataset.lang || '';

    const matchSearch = titleText.includes(query);
    const matchGenre = genre === 'all' || cardGenres.includes(genre);
    const matchLang = lang === 'all' || cardLangs.includes(lang);

    let matchYear = true;
    if (year === 'older') {
      matchYear = cardYear <= 2023;
    } else if (year !== 'all') {
      matchYear = cardYear === Number(year);
    }

    return matchSearch && matchGenre && matchYear && matchLang;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'rating') {
      return Number(b.dataset.rating) - Number(a.dataset.rating);
    }
    if (sortBy === 'year') {
      return Number(b.dataset.year) - Number(a.dataset.year);
    }
    if (sortBy === 'alpha') {
      const nameA = a.querySelector('.title p:first-child').innerText;
      const nameB = b.querySelector('.title p:first-child').innerText;
      return nameA.localeCompare(nameB, 'ka');
    }
    return Number(a.dataset.index) - Number(b.dataset.index);
  });

  movieCount.textContent = `ნაპოვნია: ${filtered.length}`;
  noResults.style.display = filtered.length === 0 ? 'block' : 'none';

  const totalPages = Math.ceil(filtered.length / perPage);
  if (currentPage > totalPages) currentPage = 1;

  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  allCards.forEach(card => (card.style.display = 'none'));

  filtered.forEach((card, idx) => {
    movieGrid.appendChild(card);
    if (idx >= start && idx < end) {
      card.style.display = 'flex';
    }
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  pagination.innerHTML = '';
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `gverdi-btn ${i === currentPage ? 'active' : ''}`;
    btn.textContent = i;
    btn.addEventListener('click', () => {
      currentPage = i;
      updateCatalog();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    pagination.appendChild(btn);
  }
}

[searchInput, genreFilter, yearFilter, langFilter, sortSelect].forEach(el => {
  el.addEventListener('input', () => {
    currentPage = 1;
    updateCatalog();
  });
});

resetBtn.addEventListener('click', () => {
  searchInput.value = '';
  genreFilter.value = 'all';
  yearFilter.value = 'all';
  langFilter.value = 'all';
  sortSelect.value = 'default';
  currentPage = 1;
  updateCatalog();
});

window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', window.scrollY > 400);
});

updateCatalog();
