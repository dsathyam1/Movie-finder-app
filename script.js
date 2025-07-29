const api_key = "GET_YOUR_OWN_API";
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const movieGrid = document.getElementById("movieGrid");
const message = document.getElementById("message");

let isViewingFavorites = false; 

searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (!query) {
    message.textContent = "Please enter a movie name";
    movieGrid.innerHTML = "";
    return;
  }
  message.textContent = "";
  isViewingFavorites = false; 
  fetchMovies(query);
});

searchInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

async function fetchMovies(query) {
  movieGrid.innerHTML = "<p style='grid-column: 1/-1; text-align:center;'>Loading...</p>";
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${api_key}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      displayMovies(data.results);
      message.textContent = "";
    } else {
      movieGrid.innerHTML = `<p style='grid-column: 1/-1; text-align:center;'>No results found for "${query}"</p>`;
    }
  } catch (error) {
    movieGrid.innerHTML = "";
    message.textContent = "Error fetching data. Please try again later.";
    console.error(error);
  }
}

async function fetchMovieDetails(movieId) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${api_key}`
    );
    const movie = await response.json();

    const videoRes = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${api_key}`
    );
    const videoData = await videoRes.json();

    const trailer = videoData.results.find(
      (vid) => vid.type === "Trailer" && vid.site === "YouTube"
    );

    showModal(movie, trailer);
  } catch (error) {
    console.error("Error fetching movie details", error);
    alert("Failed to load movie details");
  }
}

async function fetchTrendingMovies() {
  isViewingFavorites = false;
  movieGrid.innerHTML = "<p style='grid-column: 1/-1; text-align:center;'>Loading trending movies...</p>";
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/movie/day?api_key=${api_key}`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      displayMovies(data.results);
      message.textContent = "";
    } else {
      movieGrid.innerHTML = "<p style='grid-column: 1/-1; text-align:center;'>No trending movies found.</p>";
    }
  } catch (error) {
    movieGrid.innerHTML = "";
    message.textContent = "Error fetching trending movies. Please try again later.";
    console.error(error);
  }
}

function toggleFavorite(movie) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const isAlreadyFav = favorites.some((fav) => fav.id === movie.id);

  if (isAlreadyFav) {
    favorites = favorites.filter((fav) => fav.id !== movie.id);
  } else {
    favorites.push(movie);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));


  if (isViewingFavorites) {
    const updatedFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
    displayMovies(updatedFavorites);
    message.textContent = "Showing your Watchlist movies";
  } else if (searchInput.value.trim()) {
    fetchMovies(searchInput.value.trim());
  } else {
    fetchTrendingMovies();
  }
}

function showModal(movie, trailer) {
  const modal = document.getElementById("movieModal");
  const modalBody = document.getElementById("modalBody");

  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://placehold.co/200x300?text=No+Image";

  let trailerBtn = "";
  if (trailer) {
    trailerBtn = `
      <a href="https://www.youtube.com/watch?v=${trailer.key}" 
         target="_blank" rel="noopener" class="trailer-btn">
        ▶️ Watch Trailer
      </a>`;
  }

  modalBody.innerHTML = `
    <img src="${poster}" alt="${movie.title}" style="width:100%; border-radius:10px; margin-bottom:15px;" />
    <h2>${movie.title}</h2>
    <p><strong>Release Date:</strong> ${movie.release_date || "N/A"}</p>
    <p><strong>IMDB Rating:</strong> ⭐ ${movie.vote_average || "N/A"}</p>
    <p><strong>Overview:</strong> ${movie.overview || "No overview available."}</p>
    <p><strong>Genres:</strong> ${
      movie.genres && movie.genres.length > 0
        ? movie.genres.map((g) => g.name).join(", ")
        : "N/A"
    }</p>
    ${trailerBtn}
  `;

  modal.style.display = "block";
  document.querySelector(".close-btn").onclick = () => {
    modal.style.display = "none";
  };

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}

function displayMovies(movies) {
  movieGrid.innerHTML = "";
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  movies.forEach((movie) => {
    const poster = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "https://placehold.co/200x300?text=No+Image";

    const title = movie.title || "Untitled";
    const year = movie.release_date
      ? movie.release_date.split("-")[0]
      : "Unknown Year";

    const isFavorite = favorites.some((fav) => fav.id === movie.id);

    const card = document.createElement("div");
    card.classList.add("movie-card");
    card.innerHTML = `
      <img src="${poster}" alt="Poster of ${title}" loading="lazy" />
      <h3>${title}</h3>
      <p>${year}</p>
      <button class="fav-btn" data-id="${movie.id}">
        ${isFavorite ? "❌ Remove" : "➕  Add to Watchlist"}
      </button>
    `;

    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("fav-btn")) {
        e.stopPropagation();
        toggleFavorite(movie);
      } else {
        fetchMovieDetails(movie.id);
      }
    });

    movieGrid.appendChild(card);
  });
}

document.getElementById("viewFavouritesBtn").addEventListener("click", () => {
  isViewingFavorites = true;
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (favorites.length === 0) {
    movieGrid.innerHTML = "<p style='grid-column: 1/-1; text-align:center;'>No movie saved here yet.</p>";
  } else {
    displayMovies(favorites);
    message.textContent = "Showing your Watchlist movies";
  }
});

// Initial fetch
fetchTrendingMovies();
