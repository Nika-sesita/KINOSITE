let currentTrailerUrl = "";

const placeholderPoster = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect fill='%23181a20' width='300' height='450'/%3E%3Ctext fill='%23555' font-family='sans-serif' font-size='20' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EKINOSITE%3C/text%3E%3C/svg%3E";

document.addEventListener('DOMContentLoaded', () => {
    if (typeof MOVIES_DB === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');

    const movie = MOVIES_DB.find(m => m.id === movieId) || MOVIES_DB[0];

    // 1. სათაურები
    document.title = `${movie.titleGeo} (${movie.year}) - KINOSITE`;
    const titlesEl = document.getElementById('movieTitles');
    if (titlesEl) {
        titlesEl.innerHTML = `${movie.titleGeo} <br> <span>${movie.titleEng.toUpperCase()}</span>`;
    }

    // 2. სურათები (პოსტერი, ფონი, პლეერის ქავერი)
    const posterSrc = movie.img && movie.img.trim() !== '' ? movie.img : placeholderPoster;
    const backdropSrc = movie.backdrop && movie.backdrop.trim() !== '' ? movie.backdrop : posterSrc;

    const posterEl = document.getElementById('moviePoster');
    const backdropEl = document.getElementById('movieBackdrop');
    const coverEl = document.getElementById('videoCover');

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

    // 3. რეიტინგი, წელი, ხანგრძლივობა, ჟანრები და აღწერა
    const metaEl = document.getElementById('movieMeta');
    if (metaEl) {
        const genres = movie.genres || getGenresFromCategory(movie.category);
        const genreTagsHtml = genres.map(g => `<span class="genre-tag">${g}</span>`).join('');
        metaEl.innerHTML = `
            <span class="imdb">★ IMDb ${movie.rating}</span>
            <span>${movie.year}</span>
            <span>${movie.duration || "2 სთ 05 წთ"}</span>
            ${genreTagsHtml}
        `;
    }

    const storyEl = document.getElementById('movieStory');
    if (storyEl) {
        storyEl.textContent = movie.story || `${movie.titleGeo} (${movie.titleEng}) — ${movie.year} წლის ფილმი. უყურეთ ონლაინ მაღალი ხარისხით KINOSITE-ზე.`;
    }

    // 4. ტრეილერი (აღარ ჩართავს დედპულს სხვა ფილმებზე!)
    if (movie.trailer && movie.trailer.trim() !== '') {
        currentTrailerUrl = movie.trailer;
    } else {
        // ავტომატური YouTube ტრეილერის ძებნა კონკრეტული ფილმისთვის
        const searchQuery = encodeURIComponent(`${movie.titleEng} ${movie.year} official trailer`);
        currentTrailerUrl = `https://www.youtube.com/embed?listType=search&list=${searchQuery}`;
    }

    // 5. ვიდეო პლეერი (თუ ფილმს ვიდეო არ აქვს, დედპულის ვიდეოს აღარ ჩართავს)
    const videoBox = document.querySelector('.video-box');
    const videoSource = document.getElementById('videoSource');
    const myVideo = document.getElementById('myVideo');
    const playBtn = document.getElementById('playBtn');

    if (videoBox && myVideo && videoSource) {
        if (movie.video && movie.video.trim() !== '') {
            videoSource.src = movie.video;
            myVideo.load();
            videoBox.dataset.hasVideo = "true";
        } else {
            videoSource.src = "";
            myVideo.removeAttribute('src');
            videoBox.dataset.hasVideo = "false";
            if (playBtn) {
                playBtn.innerHTML = `<span style="font-size: 13px; font-weight: bold; padding: 0 10px; text-align: center;">მალე დაემატება</span>`;
                playBtn.style.width = "auto";
                playBtn.style.borderRadius = "20px";
                playBtn.style.padding = "10px 18px";
            }
        }
    }

    // 6. ფავორიტები
    const favBtn = document.getElementById('favBtn');
    const savedFavs = JSON.parse(localStorage.getItem('kinosite_favs') || '[]');
    if (favBtn && savedFavs.includes(movie.id)) {
        favBtn.classList.add('active');
    }
    window.currentMovieId = movie.id;

    // 7. მსახიობები
    const artistSection = document.getElementById('artistSection');
    const artistList = document.getElementById('artistList');
    if (artistSection && artistList) {
        if (movie.cast && movie.cast.length > 0) {
            artistSection.style.display = 'flex';
            artistList.innerHTML = movie.cast.map(actor => `
                <div class="card">
                    <img src="${actor.img}" alt="${actor.name}" onerror="this.src='${placeholderPoster}'">
                    <p>${actor.name}</p>
                </div>
            `).join('');
        } else {
            artistSection.style.display = 'none';
        }
    }

    // 8. მსგავსი ფილმები
    const similarGrid = document.getElementById('similarGrid');
    if (similarGrid) {
        const mainCat = (movie.category || 'popular').split(' ')[0];
        let similarMovies = MOVIES_DB.filter(m =>
            m.id !== movie.id &&
            m.img && m.img.trim() !== '' &&
            (m.category || '').includes(mainCat)
        );

        if (similarMovies.length < 5) {
            const others = MOVIES_DB.filter(m => m.id !== movie.id && m.img && m.img.trim() !== '' && !similarMovies.includes(m));
            similarMovies = similarMovies.concat(others);
        }

        similarGrid.innerHTML = similarMovies.slice(0, 5).map(sim => `
            <a href="deadpoolmovie.html?id=${sim.id}" class="similar-card">
                <img src="${sim.img}" alt="${sim.titleEng}" onerror="this.src='${placeholderPoster}'">
                <p>${sim.titleGeo}</p>
                <span>${sim.titleEng}</span>
            </a>
        `).join('');
    }

    // 9. ძებნა ფილმის გვერდიდან
    const pageSearch = document.getElementById('moviePageSearch');
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
});

// კატეგორიებიდან ქართული ჟანრების ავტომატური გენერაცია
function getGenresFromCategory(cat) {
    if (!cat) return ["ფილმი"];
    const map = {
        action: "მძაფრსიუჟეტიანი",
        comedy: "კომედია",
        animation: "ანიმაცია",
        popular: "პოპულარული"
    };
    const result = cat.split(' ').map(c => map[c]).filter(Boolean);
    return result.length > 0 ? result : ["დრამა", "სათავგადასავლო"];
}

function playVideo(box) {
    if (box.dataset.hasVideo !== "true") return;
    const cover = box.querySelector('.cover-img');
    const btn = box.querySelector('.play-btn');
    const video = box.querySelector('video');
    if (cover) cover.style.display = 'none';
    if (btn) btn.style.display = 'none';
    if (video) video.play();
}

function selectOpt(btn) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function openTrailer() {
    const modal = document.getElementById('trailerModal');
    const frame = document.getElementById('trailerFrame');
    if (modal && frame && currentTrailerUrl) {
        frame.src = currentTrailerUrl + (currentTrailerUrl.includes('?') ? '&autoplay=1' : '?autoplay=1');
        modal.classList.add('open');
    }
}

function closeTrailer(e) {
    if (e.target.id === 'trailerModal' || e.target.classList.contains('close-trailer')) {
        const modal = document.getElementById('trailerModal');
        const frame = document.getElementById('trailerFrame');
        if (modal) modal.classList.remove('open');
        if (frame) frame.src = '';
    }
}

function toggleFavorite() {
    const favBtn = document.getElementById('favBtn');
    if (!favBtn || !window.currentMovieId) return;

    let favs = JSON.parse(localStorage.getItem('kinosite_favs') || '[]');
    if (favs.includes(window.currentMovieId)) {
        favs = favs.filter(id => id !== window.currentMovieId);
        favBtn.classList.remove('active');
    } else {
        favs.push(window.currentMovieId);
        favBtn.classList.add('active');
    }
    localStorage.setItem('kinosite_favs', JSON.stringify(favs));
}

// 11. ნავბარიდან ან ფუტერიდან სერიალებზე, ანიმეებზე, ანიმაციებზე და ჟანრებზე გადასვლა
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