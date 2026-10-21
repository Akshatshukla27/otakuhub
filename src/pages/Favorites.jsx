import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Favorites() {
  const [favorites, setFavorites] =
    useState([]);

  const [category, setCategory] =
    useState("All");

  const [loading, setLoading] =
    useState(true);


  // =====================================================
  // GET CURRENT USER
  // =====================================================

  const getUser = () => {
    try {
      return JSON.parse(
        localStorage.getItem(
          "otakuhubCurrentUser"
        ) || "null"
      );
    } catch (error) {
      return null;
    }
  };


  // =====================================================
  // GET ACCOUNT FAVORITES KEY
  // =====================================================

  const getFavoritesKey = () => {
    const user = getUser();

    const userId =
      user?._id || user?.id;

    return userId
      ? `favorites_${userId}`
      : "favorites";
  };


  // =====================================================
  // LOAD FAVORITES
  // =====================================================

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const favoritesKey =
          getFavoritesKey();

        // -----------------------------------------------
        // LOAD SAVED FAVORITES
        // -----------------------------------------------

        const savedFavorites =
          JSON.parse(
            localStorage.getItem(
              favoritesKey
            ) || "[]"
          );

        console.log(
          "LOADED FAVORITES:",
          savedFavorites
        );

        // -----------------------------------------------
        // USE SAVED FAVORITES DIRECTLY
        // -----------------------------------------------

        setFavorites(
          Array.isArray(
            savedFavorites
          )
            ? savedFavorites
            : []
        );

      } catch (error) {
        console.error(
          "Favorites loading error:",
          error
        );

        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);


  // =====================================================
  // COUNTS
  // =====================================================

  const animeCount =
    favorites.filter(
      (item) =>
        (item.category ||
          "Anime") ===
        "Anime"
    ).length;

  const mangaCount =
    favorites.filter(
      (item) =>
        item.category ===
        "Manga"
    ).length;

  const manhwaCount =
    favorites.filter(
      (item) =>
        item.category ===
        "Manhwa"
    ).length;


  // =====================================================
  // FILTER
  // =====================================================

  const filteredFavorites =
    category === "All"
      ? favorites
      : favorites.filter(
          (item) => {
            const itemCategory =
              item.category ||
              "Anime";

            return (
              itemCategory ===
              category
            );
          }
        );


  // =====================================================
  // GET TITLE
  // =====================================================

  const getTitle = (item) => {
    if (
      typeof item.title ===
      "string"
    ) {
      return item.title;
    }

    return (
      item.title?.english ||
      item.title?.romaji ||
      item.title?.native ||
      "Unknown Title"
    );
  };


  // =====================================================
  // GET IMAGE
  // =====================================================

  const getImage = (item) => {
    const itemCategory =
      item.category ||
      "Anime";

    // Anime
    if (
      itemCategory ===
      "Anime"
    ) {
      return (
        item.images?.jpg
          ?.large_image_url ||
        item.images?.jpg
          ?.image_url ||
        ""
      );
    }

    // Manga / Manhwa
    return (
      item.coverImage?.large ||
      ""
    );
  };


  // =====================================================
  // REMOVE FAVORITE
  // =====================================================

  const removeFavorite =
    async (
      itemToRemove
    ) => {

      const removeCategory =
        itemToRemove.category ||
        "Anime";

      const removeId =
        removeCategory ===
        "Anime"
          ? String(
              itemToRemove.mal_id
            )
          : String(
              itemToRemove.id
            );


      // -----------------------------------------------
      // REMOVE FROM STATE
      // -----------------------------------------------

      const updatedFavorites =
        favorites.filter(
          (item) => {

            const itemCategory =
              item.category ||
              "Anime";

            if (
              itemCategory !==
              removeCategory
            ) {
              return true;
            }

            const itemId =
              itemCategory ===
              "Anime"
                ? String(
                    item.mal_id
                  )
                : String(
                    item.id
                  );

            return (
              itemId !==
              removeId
            );
          }
        );


      setFavorites(
        updatedFavorites
      );


      // -----------------------------------------------
      // SAVE LOCAL STORAGE
      // -----------------------------------------------

      const favoritesKey =
        getFavoritesKey();

      localStorage.setItem(
        favoritesKey,
        JSON.stringify(
          updatedFavorites
        )
      );


      // -----------------------------------------------
      // UPDATE MONGODB
      // -----------------------------------------------

      const token =
        localStorage.getItem(
          "otakuhubToken"
        );

      if (!token) {
        return;
      }


      // Anime IDs

      const animeFavoriteIds =
        updatedFavorites
          .filter(
            (item) =>
              (item.category ||
                "Anime") ===
                "Anime" &&
              item.mal_id
          )
          .map(
            (item) =>
              String(
                item.mal_id
              )
          );


      // Manga IDs

      const mangaFavoriteIds =
        updatedFavorites
          .filter(
            (item) =>
              item.category ===
                "Manga" &&
              item.id
          )
          .map(
            (item) =>
              String(
                item.id
              )
          );


      // Manhwa IDs

      const manhwaFavoriteIds =
        updatedFavorites
          .filter(
            (item) =>
              item.category ===
                "Manhwa" &&
              item.id
          )
          .map(
            (item) =>
              String(
                item.id
              )
          );


      try {
        const response =
          await fetch(
            "http://localhost:5000/api/auth/favorites",
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                animeFavorites:
                  animeFavoriteIds,

                mangaFavorites:
                  mangaFavoriteIds,

                manhwaFavorites:
                  manhwaFavoriteIds,
              }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {
          console.error(
            "Favorite removal sync failed:",
            data.message
          );
        }

      } catch (error) {
        console.error(
          "Favorite removal sync error:",
          error
        );
      }
    };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="details-page">

        <Link
          to="/"
          className="back-btn"
        >
          ← Back to Home
        </Link>

        <div className="favorite-empty">

          <div className="favorite-empty-icon">
            ⏳
          </div>

          <h2>
            Loading Favorites...
          </h2>

          <p>
            Getting your favorites.
          </p>

        </div>

      </div>
    );
  }


  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="details-page">

      {/* BACK */}

      <Link
        to="/"
        className="back-btn"
      >
        ← Back to Home
      </Link>


      {/* HEADER */}

      <div className="favorites-header">

        <h1>
          ❤️ My Favorites
        </h1>

        <p>
          Your personal collection
          of anime, manga and
          manhwa.
        </p>

      </div>


      {/* =================================================
          CATEGORY TABS
      ================================================= */}

      <div className="favorite-tabs">

        <button
          className={
            category === "All"
              ? "tab-active"
              : ""
          }
          onClick={() =>
            setCategory("All")
          }
        >
          All{" "}
          <span className="tab-count">
            {favorites.length}
          </span>
        </button>


        <button
          className={
            category === "Anime"
              ? "tab-active"
              : ""
          }
          onClick={() =>
            setCategory("Anime")
          }
        >
          🎌 Anime{" "}
          <span className="tab-count">
            {animeCount}
          </span>
        </button>


        <button
          className={
            category === "Manga"
              ? "tab-active"
              : ""
          }
          onClick={() =>
            setCategory("Manga")
          }
        >
          📚 Manga{" "}
          <span className="tab-count">
            {mangaCount}
          </span>
        </button>


        <button
          className={
            category === "Manhwa"
              ? "tab-active"
              : ""
          }
          onClick={() =>
            setCategory("Manhwa")
          }
        >
          📖 Manhwa{" "}
          <span className="tab-count">
            {manhwaCount}
          </span>
        </button>

      </div>


      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {filteredFavorites.length ===
      0 ? (

        <div className="favorite-empty">

          <div className="favorite-empty-icon">
            💜
          </div>

          <h2>
            No favorites yet
          </h2>

          <p>
            Add your favorite anime,
            manga or manhwa and
            they'll appear here.
          </p>

        </div>

      ) : (

        <div className="cards">

          {filteredFavorites.map(
            (item) => {

              const itemCategory =
                item.category ||
                "Anime";

              const isAnime =
                itemCategory ===
                "Anime";

              const isManga =
                itemCategory ===
                "Manga";


              const cardLink =
                isAnime
                  ? `/anime/${item.mal_id}`
                  : isManga
                  ? `/manga/${item.id}`
                  : `/manhwa/${item.id}`;


              const itemKey =
                isAnime
                  ? item.mal_id
                  : item.id;


              return (
                <div
                  className="favorite-card-wrapper"
                  key={`${itemCategory}-${itemKey}`}
                >

                  {/* CARD */}

                  <Link
                    to={cardLink}
                    className="card"
                  >

                    {/* IMAGE */}

                    {getImage(
                      item
                    ) ? (

                      <img
                        src={getImage(
                          item
                        )}
                        alt={getTitle(
                          item
                        )}
                      />

                    ) : (

                      <div
                        className="continue-icon"
                        style={{
                          height:
                            "320px",
                        }}
                      >
                        {isAnime
                          ? "🎌"
                          : isManga
                          ? "📚"
                          : "📖"}
                      </div>

                    )}


                    {/* INFO */}

                    <div className="card-info">

                      <h3>
                        {getTitle(
                          item
                        )}
                      </h3>


                      {/* META */}

                      <div className="card-meta">

                        <span>
                          ⭐{" "}

                          {isAnime
                            ? item.score ||
                              "N/A"
                            : item.averageScore
                            ? (
                                item.averageScore /
                                10
                              ).toFixed(
                                1
                              )
                            : "N/A"}
                        </span>


                        <span>
                          {isAnime
                            ? item.type ||
                              "Anime"
                            : isManga
                            ? item.format ||
                              "Manga"
                            : "MANHWA"}
                        </span>

                      </div>


                      {/* EPISODES */}

                      {isAnime && (
                        <p>
                          {item.episodes
                            ? `${item.episodes} Episodes`
                            : "Episodes N/A"}
                        </p>
                      )}

                    </div>

                  </Link>


                  {/* REMOVE */}

                  <button
                    className="remove-favorite-btn"
                    onClick={() =>
                      removeFavorite(
                        item
                      )
                    }
                  >
                    🗑️ Remove
                  </button>

                </div>
              );
            }
          )}

        </div>

      )}

    </div>
  );
}

export default Favorites;