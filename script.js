document.addEventListener('DOMContentLoaded', () => {
    const movieGrid = document.getElementById('movieGrid');
    /** @type {HTMLInputElement | null} */
    const searchInput = document.querySelector('#search');
    const noResults = document.getElementById('noResults');
    /** @type {NodeListOf<HTMLElement>} */
    const filterButtons = document.querySelectorAll('.filtri-btn');

    // @ts-ignore
    const db = typeof MOVIES_DB !== 'undefined' ? MOVIES_DB : [];
    let currentFilter = 'all';
    let currentGeoGenre = '';

    // თუ სხვა გვერდის ნავბარიდან გადმოვიდა
    const savedNavFilter = localStorage.getItem('kinosite_nav_filter');
    const savedNavGenre = localStorage.getItem('kinosite_nav_genre');
    if (savedNavFilter) {
        currentFilter = savedNavFilter;
        localStorage.removeItem('kinosite_nav_filter');
        filterButtons.forEach(b => b.classList.remove('active'));
    }
    if (savedNavGenre) {
        currentFilter = 'geo_genre';
        currentGeoGenre = savedNavGenre;
        localStorage.removeItem('kinosite_nav_genre');
        filterButtons.forEach(b => b.classList.remove('active'));
    }

    const placeholderImg = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect fill='%23181a20' width='300' height='450'/%3E%3Ctext fill='%23555' font-family='sans-serif' font-size='20' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EKINOSITE%3C/text%3E%3C/svg%3E";

    /**
     * @param {any} movie
     */
    function createMovieCard(movie) {
        const posterSrc = movie.img && movie.img.trim() !== '' ? movie.img : placeholderImg;
        const targetLink = movie.id ? `deadpoolmovie.html?id=${movie.id}` : 'deadpoolmovie.html';

        return `
            <div class="kino" data-category="${movie.category || ''}">
                <div class="img">
                    <span class="qula">★ ${movie.rating}</span>
                    <span class="weli">${movie.year}</span>
                    <span class="ena">${movie.lang}</span>
                    <a href="${targetLink}">
                        <img src="${posterSrc}" alt="${movie.titleEng}" loading="lazy" onerror="this.onerror=null;this.src='${placeholderImg}';">
                        <div class="chartva"><i class="fa-solid fa-play"></i></div>
                    </a>
                </div>
                <div class="title">
                    <p>${movie.titleGeo}</p>
                    <p>${movie.titleEng}</p>
                </div>
            </div>
        `;
    }

    function renderMovies() {
        if (!movieGrid) return;

        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

        const filteredMovies = db.filter((/** @type {any} */ movie) => {
            if (query !== '') {
                const matchGeo = (movie.titleGeo || '').toLowerCase().includes(query);
                const matchEng = (movie.titleEng || '').toLowerCase().includes(query);
                return matchGeo || matchEng;
            }

            const cat = (movie.category || '').toLowerCase();
            const genres = movie.genres || [];

            if (currentFilter === 'series') {
                return movie.type === 'series' || cat.includes('series');
            }
            if (currentFilter === 'anime') {
                return cat.includes('anime');
            }
            if (currentFilter === 'animation') {
                return cat.includes('animation') || genres.includes('ანიმაცია');
            }
            if (currentFilter === 'geo_genre') {
                return genres.includes(currentGeoGenre);
            }

            if (!movie.showOnHome) return false;

            if (currentFilter === 'all') return true;
            return cat.includes(currentFilter);
        });

        movieGrid.innerHTML = filteredMovies.map(createMovieCard).join('');

        if (noResults) {
            noResults.style.display = filteredMovies.length === 0 ? 'block' : 'none';
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q');
    if (initialQuery && searchInput) {
        searchInput.value = initialQuery;
    }

    renderMovies();

    if (searchInput) {
        searchInput.addEventListener('input', renderMovies);
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter || 'all';
            currentGeoGenre = '';
            if (searchInput) searchInput.value = '';
            renderMovies();
        });
    });

    /**
     * @param {string} filterType
     * @param {string} genreName
     */
    function applyNavSelection(filterType, genreName = '') {
        currentFilter = filterType;
        currentGeoGenre = genreName;
        filterButtons.forEach(b => b.classList.remove('active'));
        if (searchInput) searchInput.value = '';
        renderMovies();

        /** @type {HTMLInputElement | null} */
        const menuToggle = document.querySelector('#menu-toggle');
        if (menuToggle) menuToggle.checked = false;

        if (movieGrid) movieGrid.scrollIntoView({ behavior: 'smooth' });
    }

    // ნავბარის და ფუტერის ყველა ლინკის მიბმა (სერიალები, ანიმეები, ანიმაციები, ჟანრები)
    document.querySelectorAll('a').forEach(link => {
        const text = (link.textContent || '').trim();
        const isInGenreMenu = Boolean(link.closest('.genre-submenu'));

        if (isInGenreMenu) {
            link.href = '#';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                applyNavSelection('geo_genre', text);
            });
        } else if (text.includes('სერიალები')) {
            link.href = '#';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                applyNavSelection('series');
            });
        } else if (text.includes('ანიმეები')) {
            link.href = '#';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                applyNavSelection('anime');
            });
        } else if (text.includes('ანიმაციები')) {
            link.href = '#';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                applyNavSelection('animation');
            });
        }
    });

    // --- სლაიდერი ---
    const slides = document.getElementById('slides');
    /** @type {NodeListOf<HTMLElement>} */
    const dots = document.querySelectorAll('.wertili');
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');
    let currentSlide = 0;

    /**
     * @param {number} index
     */
    function updateSlider(index) {
        if (!slides || dots.length === 0) return;
        if (index >= dots.length) currentSlide = 0;
        else if (index < 0) currentSlide = dots.length - 1;
        else currentSlide = index;

        slides.style.transform = `translateX(-${currentSlide * 100}%)`;
        dots.forEach(dot => dot.classList.remove('active'));
        dots[currentSlide].classList.add('active');
    }

    if (nextBtn) nextBtn.addEventListener('click', () => updateSlider(currentSlide + 1));
    if (prevBtn) prevBtn.addEventListener('click', () => updateSlider(currentSlide - 1));
    dots.forEach(dot => {
        dot.addEventListener('click', () => updateSlider(parseInt(dot.dataset.index || '0', 10)));
    });

    if (slides && dots.length > 0) {
        setInterval(() => updateSlider(currentSlide + 1), 5000);
    }
});