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
        .map((movie) => {
          const poster =
            movie.posterUrl ||
            "https://via.placeholder.com/320x460?text=Poster";
          const rating =
            typeof movie.imdb_rating === "number"
              ? movie.imdb_rating.toFixed(1)
              : typeof movie.rating === "number"
              ? movie.rating.toFixed(1)
              : null;

          return `
        <div class="card" data-id="${movie._id}">
          <img src="${poster}" alt="${movie.title}" />
          <div class="info">
            <h5>${movie.title}</h5>
            <p>${movie.summary || "No description available."}</p>
            ${
              rating
                ? `<p class="text-muted mb-0">דירוג IMDb: ${rating}/10</p>`
                : ""
            }
          </div>
        </div>`;
        })
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

  // Add click event listener to movie cards
  const catalogGrid = document.querySelector("#catalog-grid");
  if (catalogGrid) {
    catalogGrid.addEventListener("click", (event) => {
      const card = event.target.closest(".card");
      if (card) {
        const movieId = card.dataset.id; // Assuming each card has a data-id attribute
        console.log(`Movie ID clicked: ${movieId}`);
        // Redirect to the movie details page
        window.location.href = `/content/${movieId}`;
      }
    });
  }
});
