// catalog.js - Client-side logic for the catalog page

console.log("Catalog.js loaded successfully");

const getInitialGenre = () => document.body?.dataset?.initialGenre || "";

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

    // Render movies in the #catalog-grid element
    const catalogGrid = document.querySelector("#catalog-grid");
    if (catalogGrid) {
      catalogGrid.innerHTML = movies
        .map(
          (movie) => `
        <div class="card">
          <img src="${movie.posterUrl}" alt="${movie.title}" />
          <div class="info">
            <h5>${movie.title}</h5>
            <p>${movie.summary || "No description available."}</p>
          </div>
        </div>`,
        )
        .join("");
    }
  } catch (error) {
    console.error("Failed to fetch movies:", error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const genreFilter = document.getElementById("genreFilter");
  const initial = getInitialGenre();
  if (genreFilter && initial) {
    genreFilter.value = initial;
  }
  fetchMovies();
});
