// movieDetails.js - Handles fetching and displaying movie details

// Shared player state
const playerState = {
  episodes: [],
  currentEpisodeIndex: 0,
};
let controlsInitialized = false;

const initMovieDetailsUI = () => {
  if (controlsInitialized) return; // prevent double binding
  const video = document.getElementById('videourl');
  if (!video) return; // HTML not yet injected

  const playPauseBtn = document.getElementById('playPauseBtn');
  const back10Btn = document.getElementById('back10Btn');
  const forward10Btn = document.getElementById('forward10Btn');
  const seekBar = document.getElementById('seekBar');
  const currentTimeEl = document.getElementById('currentTime');
  const durationEl = document.getElementById('duration');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const nextEpisodeBtn = document.getElementById('nextEpisodeBtn');
  const episodesDrawerBtn = document.getElementById('episodesDrawerBtn');
  const episodesOverlay = document.getElementById('episodesOverlay');
  const closeEpisodes = document.getElementById('closeEpisodes');
  const episodesList = document.getElementById('episodesList');

  // Use shared state
  let episodes = playerState.episodes;
  let currentEpisodeIndex = playerState.currentEpisodeIndex;

  const renderEpisodes = () => {
    if (!episodesList) return;
    episodesList.innerHTML = '';
    if (!episodes.length) {
      const li = document.createElement('li');
      li.textContent = 'אין פרקים זמינים';
      episodesList.appendChild(li);
      return;
    }
    episodes.forEach((ep, idx) => {
      const li = document.createElement('li');
      li.textContent = `${idx + 1}. ${ep.title || 'פרק ללא שם'}`;
      if (idx === currentEpisodeIndex) li.style.background = '#222';
      li.addEventListener('click', () => {
        playerState.currentEpisodeIndex = idx;
        currentEpisodeIndex = playerState.currentEpisodeIndex;
        loadEpisode(episodes[currentEpisodeIndex]);
        if (episodesOverlay) episodesOverlay.hidden = true;
      });
      episodesList.appendChild(li);
    });
  };

  const loadEpisode = (episode) => {
    if (!episode || !video) return;
    if (episode.videoUrl) {
      video.src = 'videos/' + episode.videoUrl;
      video.currentTime = 0;
      video.play().catch(()=>{});
    }
  };

  // Controls
  playPauseBtn?.addEventListener('click', () => {
    if (video.paused) { video.play(); } else { video.pause(); }
  });
  back10Btn?.addEventListener('click', () => { video.currentTime = Math.max(0, video.currentTime - 10); });
  forward10Btn?.addEventListener('click', () => { video.currentTime = Math.min(video.duration || video.currentTime + 10, video.currentTime + 10); });

  const formatTime = (sec) => {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  video?.addEventListener('loadedmetadata', () => { if (durationEl) durationEl.textContent = formatTime(video.duration); });
  video?.addEventListener('timeupdate', () => {
    if (currentTimeEl) currentTimeEl.textContent = formatTime(video.currentTime);
    if (video.duration && seekBar) seekBar.value = (video.currentTime / video.duration) * 100;
  });
  seekBar?.addEventListener('input', () => {
    if (video.duration) video.currentTime = (seekBar.value / 100) * video.duration;
  });
  fullscreenBtn?.addEventListener('click', () => {
    if (!document.fullscreenElement) { video.requestFullscreen?.(); } else { document.exitFullscreen?.(); }
  });
  nextEpisodeBtn?.addEventListener('click', () => {
    if (episodes.length && playerState.currentEpisodeIndex < episodes.length - 1) {
      playerState.currentEpisodeIndex++;
      currentEpisodeIndex = playerState.currentEpisodeIndex;
      loadEpisode(episodes[currentEpisodeIndex]);
      renderEpisodes();
    }
  });
  episodesDrawerBtn?.addEventListener('click', () => {
    if (!episodesOverlay) return;
    episodesOverlay.hidden = !episodesOverlay.hidden;
    if (!episodesOverlay.hidden) renderEpisodes();
  });
  closeEpisodes?.addEventListener('click', () => { if (episodesOverlay) episodesOverlay.hidden = true; });

  // Media state sync
  video?.addEventListener('play', () => { if (playPauseBtn) playPauseBtn.textContent = '⏸️'; });
  video?.addEventListener('pause', () => { if (playPauseBtn) playPauseBtn.textContent = '▶️'; });
  video?.addEventListener('click', () => { playPauseBtn?.click(); });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (!video.src) return;
    switch (e.key) {
      case ' ': e.preventDefault(); playPauseBtn?.click(); break;
      case 'ArrowLeft': back10Btn?.click(); break;
      case 'ArrowRight': forward10Btn?.click(); break;
      case 'f': fullscreenBtn?.click(); break;
    }
  });

  controlsInitialized = true;
};

/**
 * Fetch movie details by ID and update the modal content.
 * @param {string} movieId - The ID of the movie to fetch details for.
 */
const fetchMovieDetails = async (movieId) => {
  try {
    const response = await fetch(`/api/content/${movieId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const movie = await response.json();


    document.querySelector("#movieTitle").textContent = movie.title;
    document.querySelector("#movieDescription").textContent = movie.summary || "אין תיאור זמין.";
    document.querySelector("#movieGenre").textContent = movie.genres || "לא ידוע";
    document.querySelector("#movieYear").textContent = movie.year || "לא ידוע";
    document.querySelector("#moviePoster").src = movie.posterUrl || "";
    document.querySelector("#stagemanager").textContent = movie.stagemanager || "לא ידוע";
    document.querySelector("#players").textContent = movie.players || "לא ידוע";
    const video = document.querySelector('#videourl');
    // Determine content type from Mongo (movie/series)
    const type = (movie.type || '').toLowerCase();
    const isSeries = type === 'series' || type === 'tv' || type === 'show';

    // Toggle episode-related controls visibility
    const nextEpisodeBtn = document.getElementById('nextEpisodeBtn');
    const episodesDrawerBtn = document.getElementById('episodesDrawerBtn');
    const episodesOverlay = document.getElementById('episodesOverlay');
    if (nextEpisodeBtn) nextEpisodeBtn.hidden = !isSeries;
    if (episodesDrawerBtn) episodesDrawerBtn.hidden = !isSeries;
    if (episodesOverlay) episodesOverlay.hidden = true; // always start closed

    // Episodes handling: only for series
    playerState.episodes = isSeries && Array.isArray(movie.episodes) ? movie.episodes : [];
    playerState.currentEpisodeIndex = 0;
    if (playerState.episodes.length > 0 && playerState.episodes[0]?.videoUrl) {
      video.src = 'videos/' + playerState.episodes[0].videoUrl;
    } else {
      video.src = movie.videoUrl ? ('videos/' + movie.videoUrl) : '';
    }
    // Reset UI state
    try { video.pause(); } catch {}
    video.currentTime = 0;
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) playPauseBtn.textContent = '▶️';
    // Ensure controls bound (in case HTML injected now)
    initMovieDetailsUI();

    const modalElement = document.getElementById("movieDetailsModal");
    const movieDetailsModal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    movieDetailsModal.show();
  } catch (error) {
    console.error("Failed to fetch movie details:", error);
  }
};

// Expose init globally for dynamic HTML loader when modal HTML is fetched dynamically
window.initMovieDetailsUI = initMovieDetailsUI;

export { fetchMovieDetails, initMovieDetailsUI };