const $ = (s, c = document) => c.querySelector(s);

const renderMovies = (movies) => {
  const movieList = $("#movie-list");
  if (movieList) {
    movieList.innerHTML = movies
      .map(
        (movie) => `
      <div class="movie">
        <h3>${movie.title}</h3>
        <p>${movie.description}</p>
      </div>
    `,
      )
      .join("");
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const q = $("#q");

  if (q) {
    q.addEventListener("input", () => {
      location.href = "/catalog?q=" + encodeURIComponent(q.value.trim());
    });
  }

  try {
    const response = await fetch("/api/movies", {
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      const movies = await response.json();
      renderMovies(movies);
    } else {
      console.error("Failed to fetch movies", response.status);
    }
  } catch (error) {
    console.error("Error fetching movies", error);
  }
});
