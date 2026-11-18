const movieVid = document.getElementById('myVideo');

function playVideo(box) {
  const cover = box.querySelector('.cover-img');
  const btn = box.querySelector('.play-btn');
  if (cover) cover.style.display = 'none';
  if (btn) btn.style.display = 'none';
  if (movieVid) movieVid.play();
}

function skip(seconds) {
  if (movieVid) movieVid.currentTime += seconds;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') skip(10);
  if (e.key === 'ArrowLeft') skip(-10);
});

if (movieVid) {
  // Fullscreen-ზე გადასვლისას ტელეფონის გადმობრუნება
  movieVid.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } else if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  });

  // ტელეფონის გადმობრუნებისას ავტომატური Fullscreen
  window.addEventListener('orientationchange', () => {
    const angle = (screen.orientation && screen.orientation.angle) || window.orientation;
    const isLandscape = Math.abs(angle) === 90;

    if (isLandscape && !movieVid.paused) {
      if (movieVid.requestFullscreen) {
        movieVid.requestFullscreen().catch(() => {});
      } else if (movieVid.webkitEnterFullscreen) {
        movieVid.webkitEnterFullscreen();
      }
    } else if (!isLandscape && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  });

  // "განაგრძე ყურება" (პროგრესის შენახვა)
  const movieData = {
    title: "დედპული 2026",
    img: "/slider/Deadpool_(2016_poster).png",
    link: window.location.pathname
  };

  const saved = JSON.parse(localStorage.getItem('continueWatching'));
  if (saved && saved.link === movieData.link) {
    movieVid.currentTime = saved.time;
  }

  movieVid.addEventListener('timeupdate', () => {
    localStorage.setItem('continueWatching', JSON.stringify({
      ...movieData,
      time: movieVid.currentTime,
      duration: movieVid.duration
    }));
  });
}
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  if (backToTop) {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }
});

 function selectOpt(btn) {
            btn.parentElement.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }

        function openTrailer() {
            const modal = document.getElementById('trailerModal');
            const frame = document.getElementById('trailerFrame');
            frame.src = 'https://www.youtube.com/embed/ONHBaC-pfsk?autoplay=1';
            modal.classList.add('open');
        }

        function closeTrailer(e) {
            if (e.target.id === 'trailerModal' || e.target.classList.contains('close-trailer')) {
                const modal = document.getElementById('trailerModal');
                const frame = document.getElementById('trailerFrame');
                frame.src = '';
                modal.classList.remove('open');
            }
        }