console.log("Catalog.js loaded successfully");

const POPULARITY_RANK_LABELS = ["מקום ראשון", "מקום שני", "מקום שלישי"];

const getInitialGenre = () => {
  if (!document.body || !document.body.dataset) {
    return "";
  }
  return document.body.dataset.initialGenre || "";
};
let catalogAbortController = null;

const formatRating = (item) => {
  if (item && typeof item.imdb_rating === "number") {
    return item.imdb_rating.toFixed(1);
  }
  if (item && typeof item.rating === "number") {
    return item.rating.toFixed(1);
  }
  return null;
};

const createCatalogCardHTML = (item) => {
  const rating = formatRating(item);
  const hasPoster = item && item.posterUrl;
  return `
    <a class="card" data-id="${item._id}" href="/content/${item._id}">
      ${hasPoster ? `<img src="${item.posterUrl}" alt="${item.title}" />` : ""}
      <div class="info">
        <h5>${item.title}</h5>
        <p>${item.summary || "No description available."}</p>
        ${
          rating
            ? `<p class="text-muted mb-0">דירוג IMDb: ${rating}/10</p>`
            : ""
        }
      </div>
    </a>`;
};

const createRankedCardHTML = (item, rankIndex, showEpisodesCount = false) => {
  const rating = formatRating(item);
  const hasPoster = item && item.posterUrl;
  const episodesInfo =
    showEpisodesCount && Array.isArray(item.episodes) && item.episodes.length
      ? `<p class="text-muted mb-0">מספר פרקים: ${item.episodes.length}</p>`
      : "";

  return `
    <a class="card ranked-card" data-id="${item._id}" href="/content/${item._id}">
      <div class="rank-badge rank-${rankIndex + 1}">
        <span class="rank-number">${rankIndex + 1}</span>
        <span class="rank-label">${POPULARITY_RANK_LABELS[rankIndex] || ""}</span>
      </div>
      ${hasPoster ? `<img src="${item.posterUrl}" alt="${item.title}" />` : ""}
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
    </a>`;
};

const renderCatalog = (items) => {
  const catalogGrid = document.querySelector("#catalog-grid");
  if (!catalogGrid) return;
  if (!Array.isArray(items) || items.length === 0) {
    catalogGrid.innerHTML = '<p class="text-muted mb-0">לא נמצאו תוצאות.</p>';
    return;
  }
  catalogGrid.innerHTML = items
    .map((item) => createCatalogCardHTML(item))
    .join("");
};

const setCatalogLoading = () => {
  const catalogGrid = document.querySelector("#catalog-grid");
  if (!catalogGrid) return;
  catalogGrid.innerHTML = "<p>טוען...</p>";
};

const renderRankedList = (selector, items, options = {}) => {
  const { emptyMessage = "אין פריטים להצגה", showEpisodesCount = false } =
    options;
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

const fetchCatalog = async ({ searchTerm = "", genre = "" } = {}) => {
  try {
    setCatalogLoading();

    if (catalogAbortController) {
      catalogAbortController.abort();
    }
    catalogAbortController = new AbortController();

    const params = new URLSearchParams();
    if (typeof searchTerm === "string" && searchTerm.trim().length) {
      params.set("q", searchTerm.trim());
    }
    if (typeof genre === "string" && genre.trim().length) {
      params.set("genre", genre.trim());
    }

    const queryString = params.toString();
    const url = queryString ? `/api/catalog?${queryString}` : "/api/catalog";

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: catalogAbortController.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const movies = await response.json();
    console.log("Catalog fetched:", movies);
    renderCatalog(movies);
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("Failed to fetch catalog:", error);
    renderCatalog([]);
  }
};

const populateGenreFilter = (genres, selectedValue = "") => {
  const genreFilter = document.getElementById("genreFilter");
  if (!genreFilter) return;

  genreFilter.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "כל הז׳אנרים";
  genreFilter.appendChild(defaultOption);

  (Array.isArray(genres) ? genres : []).forEach((genre) => {
    if (typeof genre !== "string" || !genre.trim().length) return;
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreFilter.appendChild(option);
  });

  if (selectedValue) {
    genreFilter.value = selectedValue;
  }
};

const fetchGenres = async (selectedValue = "") => {
  try {
    const response = await fetch("/api/genres", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const genres = await response.json();
    populateGenreFilter(genres, selectedValue);
  } catch (error) {
    console.error("Failed to fetch genres:", error);
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

    const topMovies = popularItems
      .filter((item) => item.type === "movie")
      .slice(0, 3);

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
  const searchInput = document.getElementById("q");
  const searchForm = document.querySelector(".search-form");
  const resetButton = document.getElementById("resetSearch");
  const initialGenre = getInitialGenre();

  if (genreFilter && initialGenre) {
    genreFilter.value = initialGenre;
  }

  const getSearchTerm = () => {
    if (searchInput && typeof searchInput.value === "string") {
      return searchInput.value.trim();
    }
    return "";
  };

  const getSelectedGenre = () => {
    if (genreFilter) {
      return genreFilter.value || "";
    }
    return "";
  };

  const triggerCatalogFetch = () =>
    fetchCatalog({
      searchTerm: getSearchTerm(),
      genre: getSelectedGenre(),
    });

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      triggerCatalogFetch();
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (genreFilter) genreFilter.value = "";
      triggerCatalogFetch();
    });
  }

  fetchGenres(initialGenre).finally(() => {
    if (genreFilter && initialGenre && !genreFilter.value) {
      genreFilter.value = initialGenre;
    }
    triggerCatalogFetch();
  });
  fetchPopularContent();

  ["#catalog-grid", "#popular-movies-grid", "#popular-series-grid"].forEach(
    attachCardNavigation,
  );
});
