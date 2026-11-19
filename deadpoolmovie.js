let currentTrailerUrl = "";
/** @type {any} */
let activeSeries = null;
/** @type {any} */
let currentMediaItem = null;
let activeSeasonIndex = 0;
let activeEpisodeIndex = 0;
let currentLangCode = "geo";
let currentQualityCode = "1080";

const placeholderPoster = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect fill='%23181a20' width='300' height='450'/%3E%3Ctext fill='%23555' font-family='sans-serif' font-size='20' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EKINOSITE%3C/text%3E%3C/svg%3E";

document.addEventListener('DOMContentLoaded', () => {
    // @ts-ignore
    const db = typeof MOVIES_DB !== 'undefined' ? MOVIES_DB : [];
    if (db.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');

    const movie = db.find((/** @type {any} */ m) => m.id === movieId) || db[0];
    currentMediaItem = movie;
    currentLangCode = "geo";
    currentQualityCode = "1080";

    // 1. სათაურები
    document.title = `${movie.titleGeo} (${movie.year}) - KINOSITE`;
    const titlesEl = document.getElementById('movieTitles');
    if (titlesEl) {
        titlesEl.innerHTML = `${movie.titleGeo} <br> <span>${movie.titleEng.toUpperCase()}</span>`;
    }

    // 2. სურათები
    const posterSrc = movie.img && movie.img.trim() !== '' ? movie.img : placeholderPoster;
    const backdropSrc = movie.backdrop && movie.backdrop.trim() !== '' ? movie.backdrop : posterSrc;

    /** @type {HTMLImageElement | null} */
    const posterEl = document.querySelector('#moviePoster');
    /** @type {HTMLImageElement | null} */
    const backdropEl = document.querySelector('#movieBackdrop');
    /** @type {HTMLImageElement | null} */
    const coverEl = document.querySelector('#videoCover');

    if (posterEl) {
        posterEl.src = posterSrc;
        posterEl.onerror = () => { posterEl.src = placeholderPoster; };
    }
    if (backdropEl) {
        backdropEl.src = backdropSrc;
        backdropEl.onerror = () => { backdropEl.src = placeholderPoster; };
    }
    if (coverEl) {
        coverEl.src = backdropSrc;
        coverEl.onerror = () => { coverEl.src = placeholderPoster; };
    }

    // 3. მეტა ინფორმაცია და აღწერა
    const metaEl = document.getElementById('movieMeta');
    if (metaEl) {
        const genres = movie.genres || getGenresFromCategory(movie.category);
        const genreTagsHtml = genres.map((/** @type {string} */ g) => `<span class="genre-tag">${g}</span>`).join('');
        metaEl.innerHTML = `
            <span class="imdb">★ IMDb ${movie.rating}</span>
            <span>${movie.year}</span>
            <span>${movie.duration || "2 სთ 05 წთ"}</span>
            ${genreTagsHtml}
        `;
    }

    const storyEl = document.getElementById('movieStory');
    if (storyEl) {
        storyEl.textContent = movie.story || `${movie.titleGeo} (${movie.titleEng}) — ${movie.year}. უყურეთ ონლაინ მაღალი ხარისხით KINOSITE-ზე.`;
    }

    // 4. ტრეილერი
    if (movie.trailer && movie.trailer.trim() !== '') {
        currentTrailerUrl = movie.trailer;
    } else {
        const searchQuery = encodeURIComponent(`${movie.titleEng} ${movie.year} official trailer`);
        currentTrailerUrl = `https://www.youtube.com/embed?listType=search&list=${searchQuery}`;
    }

    // 5. სერიალია თუ ფილმი
    const mainContainer = document.querySelector('.container');
    const seriesControls = document.getElementById('seriesControls');

    if (movie.type === 'series' && movie.seasons && movie.seasons.length > 0) {
        activeSeries = movie;
        if (mainContainer) mainContainer.classList.add('is-series');
        if (seriesControls) seriesControls.style.display = 'flex';
        renderSeasonsAndEpisodes(0, 0);
    } else {
        activeSeries = null;
        if (mainContainer) mainContainer.classList.remove('is-series');
        if (seriesControls) seriesControls.style.display = 'none';
        applyCurrentMediaSelection(false);
    }

    // 6. ფავორიტები
    const favBtn = document.getElementById('favBtn');
    const savedFavs = JSON.parse(localStorage.getItem('kinosite_favs') || '[]');
    if (favBtn && savedFavs.includes(movie.id)) {
        favBtn.classList.add('active');
    }
    /** @type {any} */ (window).currentMovieId = movie.id;

    // 7. მსახიობები
    const artistSection = document.getElementById('artistSection');
    const artistList = document.getElementById('artistList');
    if (artistSection && artistList) {
        if (movie.cast && movie.cast.length > 0) {
            artistSection.style.display = 'flex';
            artistList.innerHTML = movie.cast.map((/** @type {any} */ actor) => `
                <div class="card">
                    <img src="${actor.img}" alt="${actor.name}" onerror="this.src='${placeholderPoster}'">
                    <p>${actor.name}</p>
                </div>
            `).join('');
        } else {
            artistSection.style.display = 'none';
        }
    }

    // 8. მსგავსი ფილმები/სერიალები
    const similarGrid = document.getElementById('similarGrid');
    if (similarGrid) {
        const mainCat = (movie.category || 'popular').split(' ')[0];
        let similarMovies = db.filter((/** @type {any} */ m) =>
            m.id !== movie.id &&
            m.img && m.img.trim() !== '' &&
            (m.category || '').includes(mainCat)
        );

        if (similarMovies.length < 5) {
            const others = db.filter((/** @type {any} */ m) => m.id !== movie.id && m.img && m.img.trim() !== '' && !similarMovies.includes(m));
            similarMovies = similarMovies.concat(others);
        }

        similarGrid.innerHTML = similarMovies.slice(0, 5).map((/** @type {any} */ sim) => `
            <a href="deadpoolmovie.html?id=${sim.id}" class="similar-card">
                <img src="${sim.img}" alt="${sim.titleEng}" onerror="this.src='${placeholderPoster}'">
                <p>${sim.titleGeo}</p>
                <span>${sim.titleEng}</span>
            </a>
        `).join('');
    }

    // 9. ძებნა ფილმის გვერდიდან
    /** @type {HTMLInputElement | null} */
    const pageSearch = document.querySelector('#moviePageSearch');
    if (pageSearch) {
        pageSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && pageSearch.value.trim() !== '') {
                window.location.href = `index.html?q=${encodeURIComponent(pageSearch.value.trim())}`;
            }
        });
    }

    // 10. მაღლა ასვლა
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('visible', window.scrollY > 300);
        });
    }

    // 11. ნავბარიდან ან ფუტერიდან გადასვლა
    const logoLink = document.querySelector('a.logo');
    const homeHref = logoLink ? (logoLink.getAttribute('href') || 'index.html') : 'index.html';

    document.querySelectorAll('a').forEach(link => {
        const text = (link.textContent || '').trim();
        const isInGenreMenu = Boolean(link.closest('.genre-submenu'));

        if (isInGenreMenu) {
            link.href = homeHref;
            link.addEventListener('click', () => {
                localStorage.setItem('kinosite_nav_genre', text);
            });
        } else if (text.includes('სერიალები')) {
            link.href = homeHref;
            link.addEventListener('click', () => {
                localStorage.setItem('kinosite_nav_filter', 'series');
            });
        } else if (text.includes('ანიმეები')) {
            link.href = homeHref;
            link.addEventListener('click', () => {
                localStorage.setItem('kinosite_nav_filter', 'anime');
            });
        } else if (text.includes('ანიმაციები')) {
            link.href = homeHref;
            link.addEventListener('click', () => {
                localStorage.setItem('kinosite_nav_filter', 'animation');
            });
        }
    });
});

/**
 * ირჩევს შესაბამის ვიდეოს მიმდინარე სერიის/ფილმის, ენისა და ხარისხის მიხედვით
 * @param {boolean} keepPlaying
 */
function applyCurrentMediaSelection(keepPlaying) {
    /** @type {any} */
    let sourceObj = currentMediaItem;

    if (activeSeries && activeSeries.seasons && activeSeries.seasons[activeSeasonIndex]) {
        const season = activeSeries.seasons[activeSeasonIndex];
        if (season.episodes && season.episodes[activeEpisodeIndex]) {
            sourceObj = season.episodes[activeEpisodeIndex];
        }
    }

    if (!sourceObj) {
        setPlayerVideo("", false);
        return;
    }

    let resolvedUrl = "";

    // 1. ჯერ ვამოწმებთ ენის მიხედვით (geo / eng / rus)
    if (sourceObj.videos && typeof sourceObj.videos[currentLangCode] === "string" && sourceObj.videos[currentLangCode].trim() !== "") {
        resolvedUrl = sourceObj.videos[currentLangCode].trim();
    } else if (currentLangCode === "geo" && typeof sourceObj.video === "string" && sourceObj.video.trim() !== "") {
        resolvedUrl = sourceObj.video.trim();
    }

    // 2. თუ 720p არის არჩეული და ცალკე 720p ვიდეო არსებობს
    if (currentQualityCode === "720" && sourceObj.qualities && typeof sourceObj.qualities["720"] === "string" && sourceObj.qualities["720"].trim() !== "") {
        resolvedUrl = sourceObj.qualities["720"].trim();
    }

    setPlayerVideo(resolvedUrl, keepPlaying);
}

/**
 * @param {HTMLElement} langBtn
 * @param {string} langCode
 */
function changeLanguage(langBtn, langCode) {
    const langContainer = langBtn.parentElement;
    if (langContainer) {
        langContainer.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
    }
    langBtn.classList.add('active');
    currentLangCode = langCode;

    /** @type {HTMLVideoElement | null} */
    const myVideo = document.querySelector('#myVideo');
    const wasPlaying = Boolean(myVideo && !myVideo.paused);
    const savedTime = myVideo ? myVideo.currentTime : 0;

    applyCurrentMediaSelection(wasPlaying);

    if (myVideo && savedTime > 0) {
        myVideo.addEventListener('loadedmetadata', function onLoaded() {
            myVideo.removeEventListener('loadedmetadata', onLoaded);
            myVideo.currentTime = savedTime;
            if (wasPlaying) myVideo.play();
        });
    }
}

/**
 * @param {HTMLElement} qualityBtn
 * @param {string} qualityType
 */
function changeQuality(qualityBtn, qualityType) {
    const qualityContainer = qualityBtn.parentElement;
    if (qualityContainer) {
        qualityContainer.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
    }
    qualityBtn.classList.add('active');
    currentQualityCode = qualityType;

    /** @type {HTMLVideoElement | null} */
    const myVideo = document.querySelector('#myVideo');
    const wasPlaying = Boolean(myVideo && !myVideo.paused);
    const savedTime = myVideo ? myVideo.currentTime : 0;

    applyCurrentMediaSelection(wasPlaying);

    if (myVideo && savedTime > 0) {
        myVideo.addEventListener('loadedmetadata', function onLoaded() {
            myVideo.removeEventListener('loadedmetadata', onLoaded);
            myVideo.currentTime = savedTime;
            if (wasPlaying) myVideo.play();
        });
    }
}

/**
 * @param {number} seasonIdx
 * @param {number} episodeIdx
 */
function renderSeasonsAndEpisodes(seasonIdx, episodeIdx) {
    if (!activeSeries) return;
    activeSeasonIndex = seasonIdx;
    activeEpisodeIndex = episodeIdx;

    const seasonBtnsEl = document.getElementById('seasonButtons');
    const episodeBtnsEl = document.getElementById('episodeButtons');

    if (seasonBtnsEl) {
        seasonBtnsEl.innerHTML = activeSeries.seasons.map((/** @type {any} */ s, /** @type {number} */ idx) => `
            <button type="button" class="opt-btn ${idx === seasonIdx ? 'active' : ''}" onclick="renderSeasonsAndEpisodes(${idx}, 0)">
                სეზონი ${s.season}
            </button>
        `).join('');
    }

    const currentSeason = activeSeries.seasons[seasonIdx];
    if (episodeBtnsEl && currentSeason) {
        episodeBtnsEl.innerHTML = currentSeason.episodes.map((/** @type {any} */ ep, /** @type {number} */ idx) => `
            <button type="button" class="opt-btn ${idx === episodeIdx ? 'active' : ''}" onclick="renderSeasonsAndEpisodes(${seasonIdx}, ${idx})">
                ${ep.ep}
            </button>
        `).join('');

        applyCurrentMediaSelection(false);
    }
}

/**
 * @param {string} videoUrl
 * @param {boolean} [autoPlay=false]
 */
function setPlayerVideo(videoUrl, autoPlay = false) {
    /** @type {HTMLElement | null} */
    const videoBox = document.querySelector('.video-box');
    /** @type {HTMLSourceElement | null} */
    const videoSource = document.querySelector('#videoSource');
    /** @type {HTMLVideoElement | null} */
    const myVideo = document.querySelector('#myVideo');
    /** @type {HTMLElement | null} */
    const playBtn = document.querySelector('#playBtn');
    /** @type {HTMLElement | null} */
    const coverImg = document.querySelector('#videoCover');

    if (!videoBox || !myVideo || !videoSource) return;

    myVideo.pause();

    if (videoUrl && videoUrl.trim() !== '') {
        videoSource.src = videoUrl;
        myVideo.load();
        videoBox.dataset.hasVideo = "true";

        if (autoPlay) {
            if (coverImg) coverImg.style.display = 'none';
            if (playBtn) playBtn.style.display = 'none';
            myVideo.play().catch(() => {});
        } else {
            if (coverImg) coverImg.style.display = 'block';
            if (playBtn) {
                playBtn.style.display = 'flex';
                playBtn.innerHTML = "▶";
                playBtn.style.width = "70px";
                playBtn.style.borderRadius = "50%";
                playBtn.style.padding = "0";
            }
        }
    } else {
        videoSource.src = "";
        myVideo.removeAttribute('src');
        videoBox.dataset.hasVideo = "false";
        if (coverImg) coverImg.style.display = 'block';
        if (playBtn) {
            playBtn.style.display = 'flex';
            playBtn.innerHTML = `<span style="font-size: 13px; font-weight: bold; padding: 0 10px; text-align: center;">მალე დაემატება</span>`;
            playBtn.style.width = "auto";
            playBtn.style.borderRadius = "20px";
            playBtn.style.padding = "10px 18px";
        }
    }
}

/**
 * @param {string} cat
 */
function getGenresFromCategory(cat) {
    if (!cat) return ["ფილმი"];
    /** @type {Record<string, string>} */
    const map = {
        series: "სერიალი",
        action: "მძაფრსიუჟეტიანი",
        comedy: "კომედია",
        animation: "ანიმაცია",
        popular: "პოპულარული"
    };
    const result = cat.split(' ').map(c => map[c]).filter(Boolean);
    return result.length > 0 ? result : ["დრამა", "სათავგადასავლო"];
}

/**
 * @param {HTMLElement} box
 */
function playVideo(box) {
    if (box.dataset.hasVideo !== "true") return;
    /** @type {HTMLElement | null} */
    const cover = box.querySelector('.cover-img');
    /** @type {HTMLElement | null} */
    const btn = box.querySelector('.play-btn');
    /** @type {HTMLVideoElement | null} */
    const video = box.querySelector('video');
    if (cover) cover.style.display = 'none';
    if (btn) btn.style.display = 'none';
    if (video) video.play();
}

/**
 * @param {HTMLElement} btn
 */
function selectOpt(btn) {
    const parent = btn.parentElement;
    if (!parent) return;
    parent.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function openTrailer() {
    const modal = document.getElementById('trailerModal');
    /** @type {HTMLIFrameElement | null} */
    const frame = document.querySelector('#trailerFrame');
    if (modal && frame && currentTrailerUrl) {
        frame.src = currentTrailerUrl + (currentTrailerUrl.includes('?') ? '&autoplay=1' : '?autoplay=1');
        modal.classList.add('open');
    }
}

/**
 * @param {MouseEvent} e
 */
function closeTrailer(e) {
    const target = /** @type {HTMLElement | null} */ (e.target);
    if (target && (target.id === 'trailerModal' || target.classList.contains('close-trailer'))) {
        const modal = document.getElementById('trailerModal');
        /** @type {HTMLIFrameElement | null} */
        const frame = document.querySelector('#trailerFrame');
        if (modal) modal.classList.remove('open');
        if (frame) frame.src = '';
    }
}

function toggleFavorite() {
    const favBtn = document.getElementById('favBtn');
    const currentId = /** @type {any} */ (window).currentMovieId;
    if (!favBtn || !currentId) return;

    /** @type {string[]} */
    let favs = JSON.parse(localStorage.getItem('kinosite_favs') || '[]');
    if (favs.includes(currentId)) {
        favs = favs.filter(id => id !== currentId);
        favBtn.classList.remove('active');
    } else {
        favs.push(currentId);
        favBtn.classList.add('active');
    }
    localStorage.setItem('kinosite_favs', JSON.stringify(favs));
}