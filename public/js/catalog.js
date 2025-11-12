console.log("Catalog.js loaded successfully");

const POPULARITY_RANK_LABELS = [
  "מקום ראשון",
  "מקום שני",
  "מקום שלישי",
];

const getInitialGenre = () => document.body?.dataset?.initialGenre || "";

const formatRating = (item) => {
  if (typeof item?.imdb_rating === "number") return item.imdb_rating.toFixed(1);
  if (typeof item?.rating === "number") return item.rating.toFixed(1);
  return null;
};

const createCatalogCardHTML = (item) => {
  const rating = formatRating(item);
  return `
    <div class="card" data-id="${item._id}">
      ${item?.posterUrl ? `<img src="${item.posterUrl}" alt="${item.title}" />` : ""}
      <div class="info">
        <h5>${item.title}</h5>
        <p>${item.summary || "No description available."}</p>
        ${
          rating
            ? `<p class="text-muted mb-0">דירוג IMDb: ${rating}/10</p>`
            : ""
        }
      </div>
    </div>`;
};

const createRankedCardHTML = (item, rankIndex, showEpisodesCount = false) => {
  const rating = formatRating(item);
  const episodesInfo =
    showEpisodesCount && Array.isArray(item.episodes) && item.episodes.length
      ? `<p class="text-muted mb-0">מספר פרקים: ${item.episodes.length}</p>`
      : "";

  return `
    <div class="card ranked-card" data-id="${item._id}">
      <div class="rank-badge rank-${rankIndex + 1}">
        <span class="rank-number">${rankIndex + 1}</span>
        <span class="rank-label">${POPULARITY_RANK_LABELS[rankIndex] || ""}</span>
      </div>
      ${item?.posterUrl ? `<img src="${item.posterUrl}" alt="${item.title}" />` : ""}
      <div class="info">
        <h5>${item.title}</h5>
        <p>${item.summary || "No description available."}</p>
        ${
          rating
            ? `<p class="text-muted mb-0">דירוג IMDb: ${rating}/10</p>`
            : ""
        }
        ${episodesInfo}
      </div>
    </div>`;
};

const renderCatalog = (items) => {
  const catalogGrid = document.querySelector("#catalog-grid");
  if (!catalogGrid) return;
  catalogGrid.innerHTML = items.map((item) => createCatalogCardHTML(item)).join("");
};

const renderRankedList = (selector, items, options = {}) => {
  const { emptyMessage = "אין פריטים להצגה", showEpisodesCount = false } = options;
  const container = document.querySelector(selector);
  if (!container) return;

  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = `<p class="text-muted mb-0">${emptyMessage}</p>`;
    return;
  }

  container.innerHTML = items
    .slice(0, 3)
    .map((item, index) => createRankedCardHTML(item, index, showEpisodesCount))
    .join("");
};

const attachCardNavigation = (selector) => {
  const container = document.querySelector(selector);
  if (!container) return;

  container.addEventListener("click", (event) => {
    const card = event.target.closest(".card");
    if (!card) return;
    const contentId = card.dataset.id;
    if (!contentId) return;
    window.location.href = `/content/${contentId}`;
  });
};

const fetchMovies = async () => {
  try {
    const response = await fetch("/api/movies", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const movies = await response.json();
    console.log("Movies fetched:", movies);
    renderCatalog(movies);
  } catch (error) {
    console.error("Failed to fetch movies:", error);
  }
};

const fetchPopularContent = async () => {
  try {
    const response = await fetch("/api/popular", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const popularItems = await response.json();
    console.log("Popular items fetched:", popularItems);

    const topMovies = popularItems.filter((item) => item.type === "movie").slice(0, 3);

    const topSeriesWithEpisodes = popularItems
      .filter((item) => Array.isArray(item.episodes) && item.episodes.length)
      .slice(0, 3);

    renderRankedList("#popular-movies-grid", topMovies, {
      emptyMessage: "לא נמצאו סרטים פופולריים.",
    });
    renderRankedList("#popular-series-grid", topSeriesWithEpisodes, {
      emptyMessage: "לא נמצאו סדרות פופולריות עם פרקים להצגה.",
      showEpisodesCount: true,
    });
  } catch (error) {
    console.error("Failed to fetch popular content:", error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const genreFilter = document.getElementById("genreFilter");
  const initial = getInitialGenre();
  if (genreFilter && initial) {
    genreFilter.value = initial;
  }

  fetchMovies();
  fetchPopularContent();

  ["#catalog-grid", "#popular-movies-grid", "#popular-series-grid"].forEach(
    attachCardNavigation
  );
});
