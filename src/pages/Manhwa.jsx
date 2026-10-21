import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  searchManhwa,
  getPopularManhwa,
} from "../services/api";

import { syncFavorites } from "../services/favoriteService";

import {
  getFavorites,
  isFavorite,
  toggleFavorite as toggleSharedFavorite,
} from "../services/favorites";


function Manhwa() {

  // =====================================================
  // STATE
  // =====================================================

  const [query, setQuery] =
    useState("");

  const [manhwa, setManhwa] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [searching, setSearching] =
    useState(false);

  const [error, setError] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const totalPages = 10;

  const [
    favoriteManhwaIds,
    setFavoriteManhwaIds,
  ] = useState([]);


  // =====================================================
  // LOAD FAVORITES
  // =====================================================

  useEffect(() => {

    const loadFavorites = () => {

      try {

        const favorites =
          getFavorites();


        const manhwaIds =
          favorites
            .filter(
              (item) =>
                (
                  item.category ||
                  ""
                ) === "Manhwa" &&
                item.id
            )
            .map(
              (item) =>
                String(item.id)
            );


        setFavoriteManhwaIds(
          manhwaIds
        );

      } catch (error) {

        console.error(
          "Error loading manhwa favorites:",
          error
        );

        setFavoriteManhwaIds([]);

      }

    };


    // Load immediately
    loadFavorites();


    // Same-tab changes
    window.addEventListener(
      "favoritesChanged",
      loadFavorites
    );


    // Other-tab changes
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
  // TOGGLE MANHWA FAVORITE
  // =====================================================

  const toggleFavorite = async (
    event,
    item
  ) => {

    // Don't open Manhwa Details
    event.preventDefault();
    event.stopPropagation();


    if (!item?.id) {
      return;
    }


    try {

      // Use shared favorites service
      toggleSharedFavorite(
        item,
        "Manhwa"
      );


      // Get latest favorites
      const favorites =
        getFavorites();


      const manhwaFavoriteIds =
        favorites
          .filter(
            (favorite) =>
              (
                favorite.category ||
                ""
              ) === "Manhwa" &&
              favorite.id
          )
          .map(
            (favorite) =>
              String(
                favorite.id
              )
          );


      // Update UI immediately
      setFavoriteManhwaIds(
        manhwaFavoriteIds
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
          "User not logged in. Manhwa favorite saved locally."
        );

        return;
      }


      try {

        await syncFavorites({
          manhwaFavorites:
            manhwaFavoriteIds,
        });


        console.log(
          "Manhwa favorites synced:",
          manhwaFavoriteIds
        );

      } catch (error) {

        console.error(
          "Manhwa favorite sync error:",
          error
        );

      }

    } catch (error) {

      console.error(
        "Manhwa favorite update error:",
        error
      );

    }

  };


  // =====================================================
  // LOAD POPULAR MANHWA
  // =====================================================

  const loadPopularManhwa = async (
    page = 1
  ) => {

    try {

      setLoading(true);

      setError("");


      const results =
        await getPopularManhwa(
          page
        );


      setManhwa(
        results || []
      );


      setCurrentPage(
        page
      );

    } catch (error) {

      console.error(
        "Popular manhwa loading error:",
        error
      );


      setError(
        "Unable to load manhwa. Please try again."
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    loadPopularManhwa(1);

  }, []);


  // =====================================================
  // SEARCH MANHWA
  // =====================================================

  const handleSearch = async () => {

    if (!query.trim()) {
      return;
    }


    setSearching(true);

    setError("");


    try {

      const results =
        await searchManhwa(
          query.trim()
        );


      const koreanManhwa =
        results.filter(
          (item) =>
            item.countryOfOrigin ===
            "KR"
        );


      setManhwa(
        koreanManhwa
      );


      setCurrentPage(1);

    } catch (error) {

      console.error(
        "Manhwa search error:",
        error
      );


      setError(
        "Unable to search manhwa. Please try again."
      );

    } finally {

      setSearching(false);

    }

  };


  // =====================================================
  // CLEAR SEARCH
  // =====================================================

  const handleClearSearch = () => {

    setQuery("");

    setError("");

    loadPopularManhwa(1);

  };


  // =====================================================
  // PAGE CHANGE
  // =====================================================

  const handlePageChange = (
    page
  ) => {

    if (
      page < 1 ||
      page > totalPages ||
      page === currentPage ||
      loading
    ) {

      return;

    }


    setQuery("");

    loadPopularManhwa(
      page
    );

  };


  // =====================================================
  // PAGE NUMBERS
  // =====================================================

  const pageNumbers = [];


  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {

    pageNumbers.push(
      page
    );

  }


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div className="details-page">

      {/* ================= BACK ================= */}

      <Link
        to="/"
        className="back-btn"
      >
        ← Back to Home
      </Link>


      {/* ================= HEADER ================= */}

      <h1>
        ⚔️ Manhwa
      </h1>


      <p
        style={{
          color: "#aaa",
          marginBottom: "25px",
        }}
      >
        Discover and explore manhwa.
      </p>


      {/* ================= SEARCH ================= */}

      <div className="anime-search">

        <input
          type="text"
          placeholder="Search manhwa..."
          value={query}
          onChange={(e) =>
            setQuery(
              e.target.value
            )
          }
          onKeyDown={(e) => {

            if (
              e.key === "Enter"
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
            searching
          }
        >
          {searching
            ? "🔄 Searching..."
            : "🔍 Search"}
        </button>

      </div>


      {/* ================= CLEAR SEARCH ================= */}

      {query.trim() && (

        <button
          onClick={
            handleClearSearch
          }
          style={{
            marginTop: "12px",
            padding: "8px 14px",
            borderRadius: "8px",
            border:
              "1px solid rgba(150, 80, 255, 0.35)",
            background:
              "rgba(140, 70, 240, 0.08)",
            color: "#c69cff",
            cursor: "pointer",
          }}
        >
          ← Show Popular Manhwa
        </button>

      )}


      {/* ================= GENRES ================= */}

      <div className="genre-filters">

        <button className="genre-active">
          All
        </button>

        <button>
          Action
        </button>

        <button>
          Adventure
        </button>

        <button>
          Comedy
        </button>

        <button>
          Romance
        </button>

        <button>
          Fantasy
        </button>

      </div>


      {/* ================= CONTENT ================= */}

      {loading ||
      searching ? (

        <div className="coming-soon">

          {searching
            ? "🔄 Searching manhwa..."
            : "🔄 Loading popular manhwa..."}

        </div>

      ) : error ? (

        <div className="coming-soon">
          ❌ {error}
        </div>

      ) : manhwa.length > 0 ? (

        <>

          {/* ================= SECTION HEADER ================= */}

          <div
            className="section-header"
            style={{
              marginTop: "35px",
              marginBottom: "20px",
            }}
          >

            <h2>
              ⚔️{" "}

              {query.trim()
                ? "Search Results"
                : "Popular Manhwa"}

            </h2>


            <span
              style={{
                color: "#aaa",
                fontSize: "14px",
              }}
            >

              {query.trim()
                ? `${manhwa.length} results`
                : `Page ${currentPage} of ${totalPages}`}

            </span>

          </div>


          {/* ================= MANHWA CARDS ================= */}

          <div className="cards">

            {manhwa.map(
              (item) => {

                const favorite =
                  isFavorite(
                    item.id,
                    "Manhwa"
                  );


                return (

                  <Link
                    to={`/manhwa/${item.id}`}
                    className="card"
                    key={
                      item.id
                    }
                  >

                    {/* ================= POSTER ================= */}

                    <div className="anime-card-poster">

                      {item.coverImage?.large ? (

                        <img
                          src={
                            item.coverImage
                              .large
                          }
                          alt={
                            item.title
                              ?.romaji ||
                            "Manhwa"
                          }
                        />

                      ) : (

                        <div
                          className="continue-icon"
                          style={{
                            height: "320px",
                          }}
                        >
                          ⚔️
                        </div>

                      )}


                      {/* ================= FAVORITE ================= */}

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


                    {/* ================= CARD INFO ================= */}

                    <div className="card-info">

                      <h3>

                        {item.title
                          ?.english ||

                          item.title
                            ?.romaji ||

                          item.title
                            ?.native ||

                          "Unknown Manhwa"}

                      </h3>


                      <div className="card-meta">

                        <span>

                          ⭐{" "}

                          {item.averageScore
                            ? (
                                item.averageScore /
                                10
                              ).toFixed(1)
                            : "N/A"}

                        </span>


                        <span>
                          MANHWA
                        </span>

                      </div>


                      <p
                        style={{
                          marginTop: "8px",
                          fontSize: "13px",
                          color: "#777",
                        }}
                      >

                        {item.chapters
                          ? `${item.chapters} Chapters`
                          : "Chapters N/A"}

                      </p>

                    </div>

                  </Link>

                );

              }
            )}

          </div>


          {/* ================= PAGINATION ================= */}

          {!query.trim() && (

            <div className="pagination">

              <button
                className="pagination-btn"
                onClick={() =>
                  handlePageChange(
                    currentPage - 1
                  )
                }
                disabled={
                  currentPage === 1 ||
                  loading
                }
              >
                ←
              </button>


              {pageNumbers.map(
                (page) => (

                  <button
                    key={
                      page
                    }
                    className={`pagination-btn ${
                      currentPage ===
                      page
                        ? "pagination-active"
                        : ""
                    }`}
                    onClick={() =>
                      handlePageChange(
                        page
                      )
                    }
                    disabled={
                      loading
                    }
                  >
                    {page}
                  </button>

                )
              )}


              <button
                className="pagination-btn"
                onClick={() =>
                  handlePageChange(
                    currentPage + 1
                  )
                }
                disabled={
                  currentPage ===
                    totalPages ||
                  loading
                }
              >
                →
              </button>

            </div>

          )}

        </>

      ) : (

        <div className="coming-soon">
          No manhwa found.
        </div>

      )}

    </div>

  );

}


export default Manhwa;