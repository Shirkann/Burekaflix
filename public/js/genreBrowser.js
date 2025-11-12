const state = {
  genres: [],
  selectedGenre: "",
  sort: "popularity",
  watched: "all",
  offset: 0,
  hasMore: false,
  loading: false,
};

const refs = {
  genreMenu: document.getElementById("genreMenu"),
  newestList: document.getElementById("newestList"),
  newestStatus: document.getElementById("newestStatus"),
  newestTitle: document.getElementById("newestTitle"),
  allList: document.getElementById("allList"),
  allStatus: document.getElementById("allStatus"),
  allObserver: document.getElementById("allObserver"),
  sortSelect: document.getElementById("sortSelect"),
  filterButtons: document.querySelectorAll(".filters-group .btn"),
};

const obs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      fetchAllItems();
    }
  });
});

if (refs.allObserver) {
  obs.observe(refs.allObserver);
}

function formatRating(item) {
  if (typeof item?.imdb_rating === "number") return item.imdb_rating.toFixed(1);
  if (typeof item?.rating === "number") return item.rating.toFixed(1);
  return "";
}

function createCard(item) {
  const rating = formatRating(item);
  const badge = item.watched
    ? '<span class="badge bg-success mt-2">נצפה</span>'
    : "";
  const summary = item.summary || "תיאור לא זמין.";
  const poster = item?.posterUrl
    ? `<img src="${item.posterUrl}" alt="${item.title}">`
    : "";
  return `
    <a class="card" href="/content/${item._id}">
      ${poster}
      <div class="info">
        <h5>${item.title}</h5>
        <p>${summary}</p>
        ${rating ? `<p class="text-muted mb-0">דירוג IMDb: ${rating}/10</p>` : ""}
        ${badge}
      </div>
    </a>
  `;
}

async function fetchJson(url, options) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`בקשה נכשלה (${res.status})`);
  }
  return res.json();
}

function updateGenreTitle() {
  const name = state.selectedGenre || "הז׳אנר הנבחר";
  if (refs.newestTitle) {
    refs.newestTitle.textContent = `החדשים ב${name}`;
  }
  const allTitle = document.getElementById("allTitle");
  if (allTitle) {
    allTitle.textContent = `כל התכנים ב${name}`;
  }
}

function setStatus(element, message, isError = false) {
  if (!element) return;
  element.textContent = message || "";
  element.classList.toggle("text-danger", Boolean(isError && message));
}

function renderGenres(genres) {
  state.genres = genres;
  if (!refs.genreMenu) return;

  if (!Array.isArray(genres) || !genres.length) {
    refs.genreMenu.innerHTML =
      '<span class="text-muted">לא נמצאו ז׳אנרים להצגה.</span>';
    return;
  }

  refs.genreMenu.innerHTML = "";
  genres.forEach((genre) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "genre-pill btn btn-outline-light";
    btn.textContent = genre;
    btn.dataset.genre = genre;
    btn.addEventListener("click", () => selectGenre(genre));
    refs.genreMenu.appendChild(btn);
  });
}

function highlightGenre(name) {
  if (!refs.genreMenu) return;
  [...refs.genreMenu.querySelectorAll(".genre-pill")].forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.genre === name);
  });
}

async function selectGenre(name) {
  if (!name || state.selectedGenre === name) return;
  state.selectedGenre = name;
  state.offset = 0;
  state.hasMore = true;
  highlightGenre(name);
  updateGenreTitle();
  try {
    await Promise.all([loadNewest(), fetchAllItems(true)]);
  } catch (err) {
    console.error("Failed to load genre content", err);
  }
}

async function loadGenres() {
  try {
    const genres = await fetchJson("/api/genres");
    renderGenres(genres || []);
    if (Array.isArray(genres) && genres.length) {
      await selectGenre(genres[0]);
    }
  } catch (err) {
    setStatus(
      refs.newestStatus,
      "אירעה שגיאה בטעינת רשימת הז׳אנרים. נסו לרענן.",
      true
    );
    console.error(err);
  }
}

async function loadNewest() {
  if (!state.selectedGenre) return;
  setStatus(refs.newestStatus, "טוען את התכנים החדשים...");
  refs.newestList.innerHTML = "";
  try {
    const data = await fetchJson(
      `/api/genres/${encodeURIComponent(state.selectedGenre)}/newest`
    );
    if (!Array.isArray(data) || !data.length) {
      refs.newestList.innerHTML =
        '<p class="text-muted mb-0">אין תכנים חדשים להצגה בז׳אנר זה.</p>';
    } else {
      refs.newestList.innerHTML = data.map(createCard).join("");
    }
    setStatus(refs.newestStatus, "");
  } catch (err) {
    console.error(err);
    refs.newestList.innerHTML = "";
    setStatus(
      refs.newestStatus,
      "טעינת התכנים החדשים נכשלה. נסו שנית מאוחר יותר.",
      true
    );
  }
}

async function fetchAllItems(reset = false) {
  if (!state.selectedGenre || state.loading) return;
  if (!state.hasMore && !reset) return;

  if (reset) {
    state.offset = 0;
    state.hasMore = true;
    refs.allList.innerHTML = "";
  }

  state.loading = true;
  setStatus(refs.allStatus, "טוען תכנים נוספים...");

  const params = new URLSearchParams({
    sort: state.sort,
    watched: state.watched,
    offset: state.offset.toString(),
  });

  try {
    const data = await fetchJson(
      `/api/genres/${encodeURIComponent(
        state.selectedGenre
      )}/contents?${params.toString()}`
    );
    const items = Array.isArray(data?.items) ? data.items : [];
    if (items.length) {
      refs.allList.insertAdjacentHTML(
        "beforeend",
        items.map(createCard).join("")
      );
    } else if (reset) {
      refs.allList.innerHTML =
        '<p class="text-muted mb-0">אין תכנים התואמים את הסינון.</p>';
    }

    state.offset = Number(data?.nextOffset) || state.offset + items.length;
    state.hasMore = Boolean(data?.hasMore);
    setStatus(
      refs.allStatus,
      state.hasMore ? "גללו מטה כדי להמשיך לטעון..." : "הגעתם לסוף הרשימה."
    );

    if (!state.hasMore && refs.allObserver) {
      obs.unobserve(refs.allObserver);
    } else if (state.hasMore && refs.allObserver) {
      obs.observe(refs.allObserver);
    }
  } catch (err) {
    console.error(err);
    setStatus(
      refs.allStatus,
      "טעינת התכנים נכשלה. נסו לרענן את העמוד.",
      true
    );
  } finally {
    state.loading = false;
  }
}

function setupSortControl() {
  if (!refs.sortSelect) return;
  refs.sortSelect.addEventListener("change", () => {
    state.sort = refs.sortSelect.value || "popularity";
    fetchAllItems(true);
  });
}

function setupFilterButtons() {
  refs.filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter || "all";
      if (state.watched === filter) return;
      state.watched = filter;
      refs.filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      fetchAllItems(true);
    });
  });
}

function init() {
  setupSortControl();
  setupFilterButtons();
  loadGenres();
}

document.addEventListener("DOMContentLoaded", init);
