import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getManhwaDetails } from "../services/api";
import { syncFavorites } from "../services/favoriteService";

function ManhwaDetails() {
  const { id } = useParams();

  const [manhwa, setManhwa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [lastChapter, setLastChapter] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);

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
  // LOAD MANHWA DETAILS
  // =====================================================

  useEffect(() => {
    const loadManhwa = async () => {
      try {
        setLoading(true);

        const data =
          await getManhwaDetails(id);

        setManhwa(data);

        // -----------------------------------------------
        // LOAD ACCOUNT-SPECIFIC PROGRESS
        // -----------------------------------------------

        const user = getUser();

        if (user) {
          const userId =
            user._id || user.id;

          const progressKey =
            `manhwaProgress_${userId}`;

          const savedProgress =
            JSON.parse(
              localStorage.getItem(
                progressKey
              ) || "{}"
            );

          const savedItem =
            savedProgress[id];

          // ------------------------------------------------
          // IMPORTANT:
          // If a progress record exists, the manhwa has
          // actually been started.
          // Chapter 1 also counts as started.
          // ------------------------------------------------

          if (
            savedItem !== undefined
          ) {
            setHasStarted(true);

            if (
              savedItem &&
              typeof savedItem ===
                "object"
            ) {
              setLastChapter(
                Number(
                  savedItem.progress || 1
                )
              );
            } else {
              setLastChapter(
                Number(savedItem) || 1
              );
            }
          } else {
            setHasStarted(false);
            setLastChapter(1);
          }
        } else {
          setHasStarted(false);
          setLastChapter(1);
        }

        // -----------------------------------------------
        // LOAD FAVORITES
        // -----------------------------------------------

        const favorites =
          JSON.parse(
            localStorage.getItem(
              "favorites"
            ) || "[]"
          );

        const alreadyFavorite =
          favorites.some(
            (item) =>
              String(item.id) ===
                String(data.id) &&
              item.category ===
                "Manhwa"
          );

        setIsFavorite(
          alreadyFavorite
        );
      } catch (error) {
        console.error(
          "Error loading manhwa details:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadManhwa();
  }, [id]);

  // =====================================================
  // TOGGLE FAVORITE
  // =====================================================

  const toggleFavorite = async () => {
    if (!manhwa) {
      return;
    }

    const favorites =
      JSON.parse(
        localStorage.getItem(
          "favorites"
        ) || "[]"
      );

    let updatedFavorites;

    if (isFavorite) {
      updatedFavorites =
        favorites.filter(
          (item) =>
            !(
              item.category ===
                "Manhwa" &&
              String(item.id) ===
                String(manhwa.id)
            )
        );

      setIsFavorite(false);
    } else {
      updatedFavorites = [
        ...favorites,
        {
          ...manhwa,
          category: "Manhwa",
        },
      ];

      setIsFavorite(true);
    }

    // -----------------------------------------------
    // SAVE LOCALLY
    // -----------------------------------------------

    localStorage.setItem(
      "favorites",
      JSON.stringify(
        updatedFavorites
      )
    );

    // -----------------------------------------------
    // SYNC WITH MONGODB
    // -----------------------------------------------

    const manhwaFavoriteIds =
      updatedFavorites
        .filter(
          (item) =>
            item.category ===
              "Manhwa" &&
            item.id
        )
        .map((item) =>
          String(item.id)
        );

    try {
      await syncFavorites({
        manhwaFavorites:
          manhwaFavoriteIds,
      });
    } catch (error) {
      console.error(
        "Manhwa favorite sync error:",
        error
      );
    }
  };

  // =====================================================
  // UPDATE READING PROGRESS
  // =====================================================

  const updateProgress = (
    newChapter
  ) => {
    if (!manhwa) {
      return;
    }

    const safeChapter =
      Math.max(
        Number(newChapter) || 1,
        1
      );

    // Saving progress means the manhwa
    // has officially been started.
    setHasStarted(true);

    setLastChapter(
      safeChapter
    );

    const user = getUser();

    if (!user) {
      return;
    }

    const userId =
      user._id || user.id;

    const progressKey =
      `manhwaProgress_${userId}`;

    try {
      const savedProgress =
        JSON.parse(
          localStorage.getItem(
            progressKey
          ) || "{}"
        );

      savedProgress[id] = {
        progress: safeChapter,

        title:
          manhwa.title?.english ||
          manhwa.title?.romaji ||
          manhwa.title?.native ||
          "Manhwa",

        image:
          manhwa.coverImage?.large ||
          "",
      };

      localStorage.setItem(
        progressKey,
        JSON.stringify(
          savedProgress
        )
      );
    } catch (error) {
      console.error(
        "Manhwa progress save error:",
        error
      );
    }
  };

  // =====================================================
  // START READING
  // =====================================================

  const startReading = () => {
    updateProgress(1);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="details-page">

        <div className="details-container">

          <h2>
            Loading manhwa details...
          </h2>

        </div>

      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (!manhwa) {
    return (
      <div className="details-page">

        <div className="details-container">

          <h2>
            Manhwa details not available.
          </h2>

          <Link
            to="/manhwa"
            className="back-btn"
          >
            ← Back to Manhwa
          </Link>

        </div>

      </div>
    );
  }

  // =====================================================
  // BASIC DATA
  // =====================================================

  const title =
    manhwa.title?.english ||
    manhwa.title?.romaji ||
    manhwa.title?.native ||
    "Unknown Manhwa";

  const score =
    manhwa.averageScore
      ? (
          manhwa.averageScore /
          10
        ).toFixed(1)
      : "N/A";

  const maxChapter =
    Number(manhwa.chapters) ||
    9999;

  // =====================================================
  // READING SOURCES
  // =====================================================

  const readingSources =
    Array.from(
      new Map(
        (manhwa.externalLinks || [])
          .filter(
            (source) =>
              source?.url
          )
          .map((source) => [
            source.url,
            source,
          ])
      ).values()
    );

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="details-page">

      {/* =================================================
          BACK
      ================================================= */}

      <Link
        to="/manhwa"
        className="back-btn"
      >
        ← Back to Manhwa
      </Link>

      {/* =================================================
          DETAILS
      ================================================= */}

      <div className="details-container">

        <img
          className="details-poster"
          src={
            manhwa.coverImage?.large
          }
          alt={title}
        />

        <div className="details-info">

          <h1>
            {title}
          </h1>

          {/* SCORE */}

          <p className="details-score">
            ⭐ {score}
          </p>

          {/* FAVORITE */}

          <button
            className="favorite-btn"
            onClick={
              toggleFavorite
            }
          >
            {isFavorite
              ? "💔 Remove from Favorites"
              : "❤️ Add to Favorites"}
          </button>

          {/* READING PROGRESS */}

          <div className="progress-section">

            <h3>
              📚 Reading Progress
            </h3>

            <p>
              Chapter{" "}
              {lastChapter}

              {manhwa.chapters
                ? ` / ${manhwa.chapters}`
                : ""}
            </p>

            <div className="progress-controls">

              <button
                onClick={() => {
                  const newChapter =
                    Math.max(
                      lastChapter - 1,
                      1
                    );

                  updateProgress(
                    newChapter
                  );
                }}
                disabled={
                  lastChapter <= 1
                }
              >
                −
              </button>

              <span>
                {lastChapter}
              </span>

              <button
                onClick={() => {
                  const newChapter =
                    Math.min(
                      lastChapter + 1,
                      maxChapter
                    );

                  updateProgress(
                    newChapter
                  );
                }}
                disabled={
                  manhwa.chapters &&
                  lastChapter >=
                    maxChapter
                }
              >
                +
              </button>

            </div>

            {/* =================================================
                START / CONTINUE BUTTON
            ================================================= */}

            <Link
              to={`/manhwa/${manhwa.id}/read/${lastChapter}`}
              className="read-btn"
              onClick={() => {
                if (!hasStarted) {
                  startReading();
                }
              }}
            >
              {hasStarted
                ? `📖 Continue Chapter ${lastChapter}`
                : "📖 Start Reading"}
            </Link>

          </div>

          {/* TYPE */}

          <p>
            <strong>
              Type:
            </strong>{" "}
            MANHWA
          </p>

          {/* STATUS */}

          <p>
            <strong>
              Status:
            </strong>{" "}
            {manhwa.status ||
              "N/A"}
          </p>

          {/* CHAPTERS */}

          <p>
            <strong>
              Chapters:
            </strong>{" "}
            {manhwa.chapters ||
              "N/A"}
          </p>

          {/* VOLUMES */}

          <p>
            <strong>
              Volumes:
            </strong>{" "}
            {manhwa.volumes ||
              "N/A"}
          </p>

          {/* GENRES */}

          <div className="details-genres">

            <strong>
              Genres:
            </strong>

            <div className="genre-tags">

              {manhwa.genres?.length >
              0 ? (

                manhwa.genres.map(
                  (genre) => (

                    <span
                      key={
                        genre.id ||
                        genre
                      }
                      className="genre-tag"
                    >
                      {genre.name ||
                        genre}
                    </span>

                  )
                )

              ) : (

                <span className="genre-tag">
                  N/A
                </span>

              )}

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          OFFICIAL READING SOURCES
      ================================================= */}

      {readingSources.length >
        0 && (

        <div className="reading-sources">

          <h2>
            📚 Official Reading Sources
          </h2>

          <p
            style={{
              color: "#888",
              marginTop: "5px",
            }}
          >
            Open an authorized source
            to read this manhwa.
          </p>

          <div className="reading-links">

            {readingSources.map(
              (source) => (

                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reading-source-link"
                >
                  📚{" "}
                  {source.site ||
                    "Official Source"}{" "}
                  →
                </a>

              )
            )}

          </div>

        </div>

      )}

      {/* =================================================
          DESCRIPTION
      ================================================= */}

      <div className="synopsis">

        <h2>
          📖 Description
        </h2>

        <p
          dangerouslySetInnerHTML={{
            __html:
              manhwa.description ||
              "Description not available.",
          }}
        />

      </div>

    </div>
  );
}

export default ManhwaDetails;