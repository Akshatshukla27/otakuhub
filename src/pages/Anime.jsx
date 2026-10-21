import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getTopAnime,
  searchAnime,
  getAnimeByGenre,
  getAnimeGenres,
} from "../services/api";

import { syncFavorites } from "../services/favoriteService";

import {
  getFavorites,
  isFavorite,
  toggleFavorite as toggleSharedFavorite,
} from "../services/favorites";


function Anime() {

  // =====================================================
  // STATE
  // =====================================================

  const [anime, setAnime] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [genresLoading, setGenresLoading] =
    useState(true);

  const [query, setQuery] =
    useState("");

  const [isSearching, setIsSearching] =
    useState(false);

  const [page, setPage] =
    useState(1);

  const [genres, setGenres] =
    useState([]);

  const [selectedGenre, setSelectedGenre] =
    useState("All");

  const [genreSearch, setGenreSearch] =
    useState("");

  const [showGenres, setShowGenres] =
    useState(false);

  const [
    favoriteAnimeIds,
    setFavoriteAnimeIds,
  ] = useState([]);

  const [favoriteMessage, setFavoriteMessage] = useState("");


  // =====================================================
  // LOAD FAVORITES
  // =====================================================

  useEffect(() => {

    const loadFavorites = () => {

      try {

        const favorites =
          getFavorites();

        const animeIds =
          favorites
            .filter(
              (item) =>
                (
                  item.category ||
                  "Anime"
                ) === "Anime" &&
                item.mal_id
            )
            .map(
              (item) =>
                String(
                  item.mal_id
                )
            );

        setFavoriteAnimeIds(
          animeIds
        );

      } catch (error) {

        console.error(
          "Error loading favorites:",
          error
        );

        setFavoriteAnimeIds([]);

      }

    };


    // Load immediately
    loadFavorites();


    // Listen for changes
    window.addEventListener(
      "favoritesChanged",
      loadFavorites
    );


    // Listen for changes
    // from another browser tab
    window.addEventListener(
      "storage",
      loadFavorites
    );


    return () => {

      window.removeEventListener(
        "favoritesChanged",
        loadFavorites
      );

      window.removeEventListener(
        "storage",
        loadFavorites
      );

    };

  }, []);


  // =====================================================
  // TOGGLE FAVORITE
  // =====================================================

  const toggleFavorite = async (
    event,
    item
  ) => {

    // Prevent Anime Details
    // page from opening.
    event.preventDefault();
    event.stopPropagation();


    if (!item?.mal_id) {
      return;
    }


    try {

      // Use shared favorites service
      toggleSharedFavorite(
        item,
        "Anime"
      );

      const wasFavorite = isFavorite(
  item.mal_id,
  "Anime"
);

setFavoriteMessage(
  wasFavorite
    ? "💔 Removed from Favorites"
    : "❤️ Added to Favorites"
);

setTimeout(() => {
  setFavoriteMessage("");
}, 1500);


      // Read the latest favorites
      // immediately after toggle.
      const favorites =
        getFavorites();


      const animeFavoriteIds =
        favorites
          .filter(
            (favorite) =>
              (
                favorite.category ||
                "Anime"
              ) === "Anime" &&
              favorite.mal_id
          )
          .map(
            (favorite) =>
              String(
                favorite.mal_id
              )
          );


      // Update UI immediately.
      setFavoriteAnimeIds(
        animeFavoriteIds
      );


      // =================================================
      // SYNC WITH MONGODB
      // =================================================

      const token =
        localStorage.getItem(
          "otakuhubToken"
        );


      if (!token) {

        console.log(
          "User not logged in. Favorite saved locally."
        );

        return;
      }


      try {

        await syncFavorites({
          animeFavorites:
            animeFavoriteIds,
        });

        console.log(
          "Anime favorites synced:",
          animeFavoriteIds
        );

      } catch (error) {

        console.error(
          "Anime favorite sync error:",
          error
        );

      }

    } catch (error) {

      console.error(
        "Favorite update error:",
        error
      );

    }

  };


  // =====================================================
  // LOAD ALL GENRES
  // =====================================================

  useEffect(() => {

    const loadGenres = async () => {

      setGenresLoading(true);

      try {

        const data =
          await getAnimeGenres();

        setGenres(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {

        console.error(
          "Error loading anime genres:",
          error
        );

        setGenres([]);

      } finally {

        setGenresLoading(false);

      }

    };


    loadGenres();

  }, []);


  // =====================================================
  // LOAD ANIME
  // =====================================================

  useEffect(() => {

    if (isSearching) {
      return;
    }


    const loadAnime = async () => {

      setLoading(true);

      try {

        let data;


        // ---------------------------------------------
        // ALL ANIME
        // ---------------------------------------------

        if (
          selectedGenre ===
          "All"
        ) {

          data =
            await getTopAnime(
              page
            );

        }


        // ---------------------------------------------
        // GENRE ANIME
        // ---------------------------------------------

        else {

          data =
            await getAnimeByGenre(
              selectedGenre,
              page
            );

        }


        setAnime(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {

        console.error(
          "Error loading anime:",
          error
        );

        setAnime([]);

      } finally {

        setLoading(false);

      }

    };


    loadAnime();

  }, [
    page,
    selectedGenre,
    isSearching,
  ]);


  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = async () => {

    if (!query.trim()) {
      return;
    }


    setSearchLoading(true);


    try {

      const results =
        await searchAnime(
          query.trim()
        );


      setAnime(
        Array.isArray(results)
          ? results
          : []
      );


      setIsSearching(true);

      setSelectedGenre("All");

      setPage(1);

      setShowGenres(false);

    } catch (error) {

      console.error(
        "Search error:",
        error
      );

      setAnime([]);

    } finally {

      setSearchLoading(false);

    }

  };


  // =====================================================
  // CLEAR SEARCH
  // =====================================================

  const handleClearSearch = () => {

    setQuery("");

    setIsSearching(false);

    setSelectedGenre("All");

    setPage(1);

    setShowGenres(false);

  };


  // =====================================================
  // SELECT GENRE
  // =====================================================

  const handleGenre = (
    genre
  ) => {

    setSelectedGenre(
      genre
    );

    setIsSearching(false);

    setPage(1);

    setShowGenres(false);

    setGenreSearch("");

  };


  // =====================================================
  // FILTER GENRES
  // =====================================================

  const filteredGenres =
    genres.filter(
      (genre) =>
        genre
          .toLowerCase()
          .includes(
            genreSearch
              .toLowerCase()
          )
    );


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div className="details-page">
      {favoriteMessage && (
  <div className="favorite-toast">
    {favoriteMessage}
  </div>
)}

      {/* =================================================
          BACK
      ================================================= */}

      <Link
        to="/"
        className="back-btn"
      >
        ← Back to Home
      </Link>


      {/* =================================================
          TITLE
      ================================================= */}

      <h1>
        🎌 Anime
      </h1>


      <p
        style={{
          color: "#aaa",
          marginBottom: "25px",
        }}
      >
        Discover and explore anime.
      </p>


      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="anime-search">

        <input
          type="text"
          placeholder="Search anime..."
          value={query}
          onChange={(e) =>
            setQuery(
              e.target.value
            )
          }
          onKeyDown={(e) => {

            if (
              e.key ===
              "Enter"
            ) {

              handleSearch();

            }

          }}
        />


        <button
          onClick={
            handleSearch
          }
          disabled={
            searchLoading
          }
        >
          {searchLoading
            ? "Searching..."
            : "🔍 Search"}
        </button>


        {query && (

          <button
            onClick={
              handleClearSearch
            }
          >
            ✕ Clear
          </button>

        )}

      </div>


      {/* =================================================
          SEARCH HEADER
      ================================================= */}

      {isSearching && (

        <div className="search-results-header">

          <div>

            <h2>
              🔎 Search Results
            </h2>

            <p>
              Results for{" "}
              <strong>
                "{query}"
              </strong>
            </p>

          </div>


          <button
            onClick={
              handleClearSearch
            }
            className="clear-search-btn"
          >
            ✕ Clear Search
          </button>

        </div>

      )}


      {/* =================================================
          GENRES
      ================================================= */}

      {!isSearching && (

        <div className="anime-genres-section">

          {/* HEADER */}

          <div className="anime-genres-header">

            <div>

              <h2>
                Browse by Genre
              </h2>

              <p>

                {selectedGenre ===
                "All"

                  ? "Showing popular anime"

                  : `Showing ${selectedGenre} anime`}

              </p>

            </div>


            <button
              className="genre-toggle-btn"
              onClick={() =>
                setShowGenres(
                  (previous) =>
                    !previous
                )
              }
            >

              {showGenres
                ? "▲ Hide Genres"
                : "▼ All Genres"}

            </button>

          </div>


          {/* CURRENT GENRE */}

          <div className="selected-genre">

            <span>
              Current:
            </span>

            <strong>
              {selectedGenre}
            </strong>

          </div>


          {/* ALL GENRES */}

          {showGenres && (

            <div className="genre-panel">

              {/* GENRE SEARCH */}

              <input
                type="text"
                className="genre-search-input"
                placeholder="Search genres..."
                value={
                  genreSearch
                }
                onChange={(e) =>
                  setGenreSearch(
                    e.target.value
                  )
                }
              />


              {genresLoading ? (

                <p className="genre-loading">
                  Loading genres...
                </p>

              ) : (

                <div className="all-genres">

                  {/* ALL */}

                  <button
                    className={
                      selectedGenre ===
                      "All"
                        ? "genre-active"
                        : ""
                    }
                    onClick={() =>
                      handleGenre(
                        "All"
                      )
                    }
                  >
                    All
                  </button>


                  {/* GENRES */}

                  {filteredGenres.map(
                    (genre) => (

                      <button
                        key={
                          genre
                        }
                        className={
                          selectedGenre ===
                          genre
                            ? "genre-active"
                            : ""
                        }
                        onClick={() =>
                          handleGenre(
                            genre
                          )
                        }
                      >
                        {genre}
                      </button>

                    )
                  )}

                </div>

              )}


              {!genresLoading &&
                filteredGenres.length ===
                  0 && (

                  <p className="genre-loading">
                    No genres found.
                  </p>

                )}

            </div>

          )}

        </div>

      )}


      {/* =================================================
          ANIME CARDS
      ================================================= */}

      {loading ||
      searchLoading ? (

        <p>
          Loading anime...
        </p>

      ) : anime.length > 0 ? (

        <div className="cards">

          {anime.map(
            (item) => {

              const favorite =
                isFavorite(
                  item.mal_id,
                  "Anime"
                );


              return (

                <Link
                  to={`/anime/${item.mal_id}`}
                  className="card"
                  key={
                    item.mal_id
                  }
                >

                  {/* =====================================
                      POSTER
                  ===================================== */}

                  <div className="anime-card-poster">

                    <img
                      src={
                        item.images
                          ?.jpg
                          ?.large_image_url ||
                        item.images
                          ?.jpg
                          ?.image_url ||
                        ""
                      }
                      alt={
                        item.title
                      }
                    />


                    {/* =================================
                        FAVORITE BUTTON
                    ================================= */}

                    <button
                      type="button"
                      className={
                        favorite
                          ? "anime-card-favorite favorite-active"
                          : "anime-card-favorite"
                      }
                      onClick={(
                        event
                      ) =>
                        toggleFavorite(
                          event,
                          item
                        )
                      }
                      aria-label={
                        favorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      title={
                        favorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >

                      {favorite
                        ? "❤️"
                        : "♡"}

                    </button>

                  </div>


                  {/* =====================================
                      CARD INFO
                  ===================================== */}

                  <div className="card-info">

                    {/* TITLE */}

                    <h3>
                      {item.title}
                    </h3>


                    {/* META */}

                    <div className="card-meta">

                      <span>
                        ⭐{" "}
                        {item.score ||
                          "N/A"}
                      </span>


                      <span>
                        {item.type ||
                          "Anime"}
                      </span>

                    </div>


                    {/* EPISODES */}

                    <p>

                      {item.episodes
                        ? `${item.episodes} Episodes`
                        : "Episodes N/A"}

                    </p>


                    {/* =================================
                        GENRE TAGS
                    ================================= */}

                    {item.genres?.length >
                      0 && (

                      <div className="card-genres">

                        {item.genres
                          .slice(
                            0,
                            3
                          )
                          .map(
                            (
                              genre
                            ) => (

                              <span
                                className="card-genre"
                                key={
                                  genre.mal_id ||
                                  genre.name
                                }
                              >

                                {
                                  genre.name
                                }

                              </span>

                            )
                          )}

                      </div>

                    )}

                  </div>

                </Link>

              );

            }
          )}

        </div>

      ) : (

        <div className="coming-soon">

          {isSearching

            ? `No anime found for "${query}".`

            : selectedGenre !==
              "All"

            ? `No ${selectedGenre} anime found.`

            : "No anime found."}

        </div>

      )}


      {/* =================================================
          PAGINATION
      ================================================= */}

      {!isSearching && (

        <div className="pagination">

          <button
            onClick={() =>
              setPage(
                (previous) =>
                  Math.max(
                    previous - 1,
                    1
                  )
              )
            }
            disabled={
              page === 1
            }
          >
            ← Previous
          </button>


          <span>
            Page {page}
          </span>


          <button
            onClick={() =>
              setPage(
                (previous) =>
                  previous + 1
              )
            }
          >
            Next →
          </button>

        </div>

      )}

    </div>

  );

}


export default Anime;