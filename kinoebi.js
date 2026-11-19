document.addEventListener('DOMContentLoaded', () => {
    const movieGrid = document.getElementById('movieGrid');
    /** @type {HTMLInputElement | null} */
    const searchInput = document.querySelector('#search');
    /** @type {HTMLSelectElement | null} */
    const genreFilter = document.querySelector('#genreFilter');
    /** @type {HTMLSelectElement | null} */
    const yearFilter = document.querySelector('#yearFilter');
    /** @type {HTMLSelectElement | null} */
    const langFilter = document.querySelector('#langFilter');
    /** @type {HTMLSelectElement | null} */
    const sortSelect = document.querySelector('#sortSelect');
    const resetBtn = document.getElementById('resetFilters');
    const movieCount = document.getElementById('movieCount');
    const noResults = document.getElementById('noResults');
    const pagination = document.getElementById('pagination');
    const backToTop = document.getElementById('backToTop');
    const pageHeading = document.querySelector('.satauri h2');

    // @ts-ignore
    const db = typeof MOVIES_DB !== 'undefined' ? MOVIES_DB : [];
    const placeholderImg = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect fill='%23181a20' width='300' height='450'/%3E%3Ctext fill='%23555' font-family='sans-serif' font-size='20' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EKINOSITE%3C/text%3E%3C/svg%3E";

    const perPage = 14;
    let currentPage = 1;
    let navMode = 'all'; // 'all' | 'series' | 'movie' | 'anime' | 'animation' | 'geo_genre'
    let navGeoGenre = '';

    /**
     * @param {any} item
     */
    function getSearchableGenres(item) {
        const cat = (item.category || '').toLowerCase();
        const geoGenres = (item.genres || []).join(' ');
        let tags = cat + ' ' + geoGenres;
        if (geoGenres.includes('ფანტასტიკა')) tags += ' scifi';
        if (geoGenres.includes('თრილერი')) tags += ' thriller';
        if (geoGenres.includes('დრამა')) tags += ' drama';
        if (geoGenres.includes('კომედია')) tags += ' comedy';
        if (geoGenres.includes('მძაფრსიუჟეტიანი')) tags += ' action';
        if (geoGenres.includes('ანიმაცია')) tags += ' animation';
        return tags;
    }

    function updateCatalog() {
        if (!movieGrid) return;

        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const genre = genreFilter ? genreFilter.value : 'all';
        const year = yearFilter ? yearFilter.value : 'all';
        const lang = langFilter ? langFilter.value : 'all';
        const sortBy = sortSelect ? sortSelect.value : 'default';

        let filtered = db.filter((/** @type {any} */ item, /** @type {number} */ idx) => {
            item._origIndex = idx;
            const cat = (item.category || '').toLowerCase();
            const genres = item.genres || [];
            const isSeries = item.type === 'series' || cat.includes('series');

            if (navMode === 'series' && !isSeries) return false;
            if (navMode === 'movie' && isSeries) return false;
            if (navMode === 'anime' && !cat.includes('anime')) return false;
            if (navMode === 'animation' && !(cat.includes('animation') || genres.includes('ანიმაცია'))) return false;
            if (navMode === 'geo_genre' && !genres.includes(navGeoGenre)) return false;

            const titleText = `${item.titleGeo || ''} ${item.titleEng || ''}`.toLowerCase();
            const matchSearch = titleText.includes(query);

            const genresStr = getSearchableGenres(item);
            const matchGenre = genre === 'all' || genresStr.includes(genre);

            const itemLang = item.lang || 'GEO';
            const matchLang = lang === 'all' || itemLang.includes(lang);

            const itemYear = Number(item.year);
            let matchYear = true;
            if (year === 'older') {
                matchYear = itemYear <= 2023;
            } else if (year !== 'all') {
                matchYear = itemYear === Number(year);
            }

            return matchSearch && matchGenre && matchYear && matchLang;
        });

        filtered.sort((/** @type {any} */ a, /** @type {any} */ b) => {
            if (sortBy === 'rating') return Number(b.rating) - Number(a.rating);
            if (sortBy === 'year') return Number(b.year) - Number(a.year);
            if (sortBy === 'alpha') return (a.titleGeo || '').localeCompare(b.titleGeo || '', 'ka');
            return a._origIndex - b._origIndex;
        });

        if (movieCount) movieCount.textContent = `ნაპოვნია: ${filtered.length}`;
        if (noResults) noResults.style.display = filtered.length === 0 ? 'block' : 'none';

        const totalPages = Math.ceil(filtered.length / perPage);
        if (currentPage > totalPages) currentPage = 1;

        const start = (currentPage - 1) * perPage;
        const pageItems = filtered.slice(start, start + perPage);

        movieGrid.innerHTML = pageItems.map((/** @type {any} */ item) => {
            const posterSrc = item.img && item.img.trim() !== '' ? item.img : placeholderImg;
            return `
                <div class="kino">
                    <div class="img">
                        <span class="qula">★ ${item.rating}</span>
                        <span class="weli">${item.year}</span>
                        <span class="ena">${item.lang || 'GEO'}</span>
                        <a href="deadpoolmovie.html?id=${item.id}">
                            <img src="${posterSrc}" alt="${item.titleEng}" loading="lazy" onerror="this.onerror=null;this.src='${placeholderImg}';">
                            <div class="chartva"><i class="fa-solid fa-play"></i></div>
                        </a>
                    </div>
                    <div class="title">
                        <p>${item.titleGeo}</p>
                        <p>${item.titleEng}</p>
                    </div>
                </div>
            `;
        }).join('');

        renderPagination(totalPages);
    }

    /**
     * @param {number} totalPages
     */
    function renderPagination(totalPages) {
        if (!pagination) return;
        pagination.innerHTML = '';
        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `gverdi-btn ${i === currentPage ? 'active' : ''}`;
            btn.textContent = String(i);
            btn.addEventListener('click', () => {
                currentPage = i;
                updateCatalog();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            pagination.appendChild(btn);
        }
    }

    [searchInput, genreFilter, yearFilter, langFilter, sortSelect].forEach(el => {
        if (el) {
            el.addEventListener('input', () => {
                currentPage = 1;
                updateCatalog();
            });
        }
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (genreFilter) genreFilter.value = 'all';
            if (yearFilter) yearFilter.value = 'all';
            if (langFilter) langFilter.value = 'all';
            if (sortSelect) sortSelect.value = 'default';
            navMode = 'all';
            navGeoGenre = '';
            if (pageHeading) pageHeading.textContent = 'ყველა ფილმი და სერიალი';
            currentPage = 1;
            updateCatalog();
        });
    }

    /**
     * @param {string} mode
     * @param {string} titleText
     * @param {string} genreName
     */
    function setCatalogMode(mode, titleText, genreName = '') {
        navMode = mode;
        navGeoGenre = genreName;
        currentPage = 1;
        if (pageHeading) pageHeading.textContent = titleText;
        /** @type {HTMLInputElement | null} */
        const menuToggle = document.querySelector('#menu-toggle');
        if (menuToggle) menuToggle.checked = false;
        updateCatalog();
    }

    document.querySelectorAll('a').forEach(link => {
        const text = (link.textContent || '').trim();
        const isInGenreMenu = Boolean(link.closest('.genre-submenu'));

        if (isInGenreMenu) {
            link.href = '#';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                setCatalogMode('geo_genre', `ჟანრი: ${text}`, text);
            });
        } else if (text.includes('სერიალები')) {
            link.href = '#';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                setCatalogMode('series', 'ყველა სერიალი');
            });
        } else if (text === 'ფილმები') {
            link.href = '#';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                setCatalogMode('movie', 'ყველა ფილმი');
            });
        } else if (text.includes('ანიმეები')) {
            link.href = '#';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                setCatalogMode('anime', 'ყველა ანიმე');
            });
        } else if (text.includes('ანიმაციები')) {
            link.href = '#';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                setCatalogMode('animation', 'ყველა ანიმაცია');
            });
        }
    });

    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('visible', window.scrollY > 400);
        });
    }

    updateCatalog();
}); 