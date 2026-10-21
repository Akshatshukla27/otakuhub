import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getMangaDetails } from "../services/api";
import { syncFavorites } from "../services/favoriteService";


function MangaDetails() {
  const { id } = useParams();

  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const [lastChapter, setLastChapter] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);


  /* =====================================================
     GET CURRENT USER
  ===================================================== */

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


  /* =====================================================
     LOAD MANGA
  ===================================================== */

  useEffect(() => {
    const loadManga = async () => {
      setLoading(true);

      try {
        const data =
          await getMangaDetails(id);

        console.log(
          "Manga details:",
          data
        );

        setManga(data);


        /* -----------------------------------------------
           LOAD FAVORITES
        ----------------------------------------------- */

        const user = getUser();

        const userId =
          user?._id || user?.id;

        const favoritesKey = userId
          ? `favorites_${userId}`
          : "favorites";

        const savedFavorites =
          JSON.parse(
            localStorage.getItem(
              favoritesKey
            ) || "[]"
          );

        const alreadyFavorite =
          savedFavorites.some(
            (item) =>
              item.category === "Manga" &&
              String(item.id) ===
                String(data.id)
          );

        setIsFavorite(
          alreadyFavorite
        );


        /* -----------------------------------------------
           LOAD ACCOUNT-SPECIFIC PROGRESS
        ----------------------------------------------- */

        if (user) {
          const userId =
            user._id || user.id;

          const progressKey =
            `mangaProgress_${userId}`;

          const savedProgress =
            JSON.parse(
              localStorage.getItem(
                progressKey
              ) || "{}"
            );

          const savedItem =
            savedProgress[id];


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

      } catch (error) {
        console.error(
          "Manga details error:",
          error
        );

        setManga(null);

      } finally {
        setLoading(false);
      }
    };

    loadManga();
  }, [id]);


  /* =====================================================
     TOGGLE FAVORITE
  ===================================================== */

  const toggleFavorite = async () => {
    if (!manga) {
      return;
    }

    const user = getUser();

    const userId =
      user?._id || user?.id;

    const favoritesKey = userId
      ? `favorites_${userId}`
      : "favorites";


    const savedFavorites =
      JSON.parse(
        localStorage.getItem(
          favoritesKey
        ) || "[]"
      );


    const alreadyFavorite =
      savedFavorites.some(
        (item) =>
          item.category === "Manga" &&
          String(item.id) ===
            String(manga.id)
      );


    let updatedFavorites;


    if (alreadyFavorite) {
      updatedFavorites =
        savedFavorites.filter(
          (item) =>
            !(
              item.category ===
                "Manga" &&
              String(item.id) ===
                String(manga.id)
            )
        );

      setIsFavorite(false);

    } else {
      updatedFavorites = [
        ...savedFavorites,
        {
          ...manga,
          category: "Manga",
        },
      ];

      setIsFavorite(true);
    }


    /* -----------------------------------------------
       SAVE LOCALLY
    ----------------------------------------------- */

    localStorage.setItem(
      favoritesKey,
      JSON.stringify(
        updatedFavorites
      )
    );


    /* -----------------------------------------------
       PREPARE MANGA IDS
    ----------------------------------------------- */

    const mangaFavoriteIds =
      updatedFavorites
        .filter(
          (item) =>
            item.category ===
              "Manga" &&
            item.id
        )
        .map((item) =>
          String(item.id)
        );


    /* -----------------------------------------------
       SYNC MONGODB
    ----------------------------------------------- */

    try {
      await syncFavorites({
        mangaFavorites:
          mangaFavoriteIds,
      });

    } catch (error) {
      console.error(
        "Manga favorite sync error:",
        error
      );
    }
  };


  /* =====================================================
     SAVE READING PROGRESS
  ===================================================== */

  const updateProgress = (
    newChapter
  ) => {
    if (!manga) {
      return;
    }

    const maxChapter =
      Number(manga.chapters) || 9999;

    const safeChapter =
      Math.min(
        Math.max(
          Number(newChapter) || 1,
          1
        ),
        maxChapter
      );


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
      `mangaProgress_${userId}`;


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
          manga.title?.english ||
          manga.title?.romaji ||
          manga.title?.native ||
          "Manga",

        image:
          manga.coverImage?.large ||
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
        "Manga progress save error:",
        error
      );
    }
  };


  /* =====================================================
     START READING
  ===================================================== */

  const startReading = () => {
    updateProgress(1);
  };


  /* =====================================================
     CHAPTER SELECTOR
  ===================================================== */

  const handleChapterSelect = (
    event
  ) => {
    const selectedChapter =
      Number(
        event.target.value
      );

    updateProgress(
      selectedChapter
    );
  };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="details-page">
        <p>
          Loading manga...
        </p>
      </div>
    );
  }


  /* =====================================================
     MANGA NOT AVAILABLE
  ===================================================== */

  if (!manga) {
    return (
      <div className="details-page">

        <Link
          to="/manga"
          className="back-btn"
        >
          ← Back to Manga
        </Link>

        <div className="coming-soon">

          <h2>
            Manga is not available
          </h2>

          <p>
            We couldn't load the manga
            details right now.
          </p>

        </div>

      </div>
    );
  }


  /* =====================================================
     BASIC DATA
  ===================================================== */

  const title =
    manga.title?.english ||
    manga.title?.romaji ||
    manga.title?.native ||
    "Unknown Title";


  const score =
    manga.averageScore
      ? (
          manga.averageScore /
          10
        ).toFixed(1)
      : "N/A";


  const maxChapter =
    Number(manga.chapters) || 9999;


  /* =====================================================
     READING SOURCES
  ===================================================== */

  const readingSources =
    Array.from(
      new Map(
        (manga.externalLinks || [])
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


  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="details-page">

      {/* =================================================
          BACK
      ================================================= */}

      <Link
        to="/manga"
        className="back-btn"
      >
        ← Back to Manga
      </Link>


      {/* =================================================
          DETAILS
      ================================================= */}

      <div className="details-container">

        <img
          className="details-poster"
          src={
            manga.coverImage?.large
          }
          alt={title}
        />


        <div className="details-info">

          <h1>
            {title}
          </h1>


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


          {/* SCORE */}

          <p className="details-score">
            ⭐ {score}
          </p>


          {/* INFO */}

          <p>
            <strong>
              Format:
            </strong>{" "}
            {manga.format ||
              "MANGA"}
          </p>

          <p>
            <strong>
              Chapters:
            </strong>{" "}
            {manga.chapters ||
              "N/A"}
          </p>

          <p>
            <strong>
              Volumes:
            </strong>{" "}
            {manga.volumes ||
              "N/A"}
          </p>

          <p>
            <strong>
              Status:
            </strong>{" "}
            {manga.status ||
              "N/A"}
          </p>

          <p>
            <strong>
              Start Date:
            </strong>{" "}
            {manga.startDate ||
              "N/A"}
          </p>

          <p>
            <strong>
              End Date:
            </strong>{" "}
            {manga.endDate ||
              "N/A"}
          </p>


          {/* =================================================
              READING PROGRESS
          ================================================= */}

          <div className="progress-section">

            <h3>
              📚 Reading Progress
            </h3>


            <p>
              Chapter{" "}
              <strong>
                {lastChapter}
              </strong>

              {manga.chapters
                ? ` / ${manga.chapters}`
                : ""}
            </p>


            {/* =================================================
                CHAPTER SELECTOR
            ================================================= */}

            {manga.chapters && (
              <div
                style={{
                  marginBottom:
                    "15px",
                }}
              >

                <label
                  htmlFor="chapter-selector"
                  style={{
                    display:
                      "block",
                    marginBottom:
                      "7px",
                    fontWeight:
                      "600",
                  }}
                >
                  Select Chapter
                </label>


                <select
                  id="chapter-selector"
                  value={lastChapter}
                  onChange={
                    handleChapterSelect
                  }
                  style={{
                    width: "100%",
                    maxWidth:
                      "280px",
                    padding:
                      "11px 12px",
                    borderRadius:
                      "8px",
                    border:
                      "1px solid #444",
                    background:
                      "#181818",
                    color:
                      "#fff",
                    fontSize:
                      "15px",
                    cursor:
                      "pointer",
                  }}
                >

                  {Array.from(
                    {
                      length:
                        Number(
                          manga.chapters
                        ),
                    },
                    (_, index) => {
                      const chapter =
                        index + 1;

                      return (
                        <option
                          key={
                            chapter
                          }
                          value={
                            chapter
                          }
                        >
                          Chapter{" "}
                          {chapter}
                        </option>
                      );
                    }
                  )}

                </select>

              </div>
            )}


            {/* =================================================
                PREVIOUS / CURRENT / NEXT
            ================================================= */}

            <div
              className="progress-controls"
            >

              <button
                onClick={() => {
                  updateProgress(
                    lastChapter - 1
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
                  updateProgress(
                    lastChapter + 1
                  );
                }}
                disabled={
                  lastChapter >=
                  maxChapter
                }
              >
                +
              </button>

            </div>


            {/* =================================================
                START / CONTINUE
            ================================================= */}

            <Link
              to={`/manga/${manga.id}/read/${lastChapter}`}
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


          {/* =================================================
              GENRES
          ================================================= */}

          <div className="details-genres">

            <strong>
              Genres:
            </strong>


            <div className="genre-tags">

              {manga.genres?.length >
              0 ? (

                manga.genres.map(
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
          SYNOPSIS
      ================================================= */}

      <div className="synopsis">

        <h2>
          📖 Synopsis
        </h2>

        <p>
          {manga.description ||
            "No synopsis available."}
        </p>

      </div>


      {/* =================================================
          READING SOURCES
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
              marginTop:
                "5px",
            }}
          >
            Open an authorized
            source to read this
            manga.
          </p>


          <div className="reading-links">

            {readingSources.map(
              (source) => (

                <a
                  key={
                    source.url
                  }
                  href={
                    source.url
                  }
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

    </div>
  );
}

export default MangaDetails;