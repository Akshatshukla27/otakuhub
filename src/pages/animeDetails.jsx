import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getAnimeDetails,
  getAnimeStreaming,
} from "../services/api";

import { syncFavorites } from "../services/favoriteService";

function AnimeDetails() {
  const { id } = useParams();

  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isFavorite, setIsFavorite] = useState(false);

  const [progress, setProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const [streamingEpisodes, setStreamingEpisodes] = useState([]);
  const [streamingLoading, setStreamingLoading] = useState(false);

  // =====================================================
  // CURRENT USER
  // =====================================================

  const getUser = () => {
    try {
      return JSON.parse(
        localStorage.getItem("otakuhubCurrentUser") || "null"
      );
    } catch {
      return null;
    }
  };

  // =====================================================
  // LOAD ANIME DETAILS
  // =====================================================

  useEffect(() => {
    const loadAnime = async () => {
      setLoading(true);

      try {
        const data = await getAnimeDetails(id);

        console.log("Anime details:", data);

        setAnime(data);

        // -----------------------------------------------
        // STREAMING
        // -----------------------------------------------

        setStreamingLoading(true);

        try {
          const streams = await getAnimeStreaming(data.mal_id);

          console.log("Anime streaming:", streams);

          setStreamingEpisodes(streams || []);
        } catch (error) {
          console.error("Streaming information error:", error);
          setStreamingEpisodes([]);
        } finally {
          setStreamingLoading(false);
        }

        // -----------------------------------------------
        // FAVORITES
        // -----------------------------------------------

        const savedFavorites = JSON.parse(
          localStorage.getItem("favorites") || "[]"
        );

        const alreadyFavorite = savedFavorites.some(
          (item) =>
            (item.category || "Anime") === "Anime" &&
            String(item.mal_id) === String(data.mal_id)
        );

        setIsFavorite(alreadyFavorite);

        // -----------------------------------------------
        // PROGRESS
        // -----------------------------------------------

        const user = getUser();

        if (user) {
          const userId = user._id || user.id;
          const progressKey = `animeProgress_${userId}`;

          const savedProgress = JSON.parse(
            localStorage.getItem(progressKey) || "{}"
          );

          const savedItem = savedProgress[id];

          if (savedItem !== undefined) {
            setHasStarted(true);

            if (
              savedItem &&
              typeof savedItem === "object"
            ) {
              setProgress(Number(savedItem.progress || 0));
            } else {
              setProgress(Number(savedItem) || 0);
            }
          } else {
            setHasStarted(false);
            setProgress(0);
          }
        } else {
          setHasStarted(false);
          setProgress(0);
        }
      } catch (error) {
        console.error("Anime details error:", error);
        setAnime(null);
      } finally {
        setLoading(false);
      }
    };

    loadAnime();
  }, [id]);

  // =====================================================
  // UPDATE PROGRESS
  // =====================================================

  const updateProgress = (newProgress) => {
    if (!anime) {
      return;
    }

    const maxEpisodes = Number(anime.episodes) || 999;

    const safeProgress = Math.min(
      Math.max(Number(newProgress) || 0, 0),
      maxEpisodes
    );

    setHasStarted(true);
    setProgress(safeProgress);

    const user = getUser();

    if (!user) {
      return;
    }

    const userId = user._id || user.id;
    const progressKey = `animeProgress_${userId}`;

    const savedProgress = JSON.parse(
      localStorage.getItem(progressKey) || "{}"
    );

    savedProgress[id] = {
      progress: safeProgress,
      title: anime.title || "Anime",
      image:
        anime.images?.jpg?.large_image_url ||
        anime.images?.jpg?.image_url ||
        "",
    };

    localStorage.setItem(
      progressKey,
      JSON.stringify(savedProgress)
    );
  };

  // =====================================================
  // START WATCHING
  // =====================================================

  const startWatching = () => {
    updateProgress(1);
  };

  // =====================================================
  // FAVORITE
  // =====================================================

  const toggleFavorite = async () => {
    if (!anime) {
      return;
    }

    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );

    const alreadyFavorite = savedFavorites.some(
      (item) =>
        (item.category || "Anime") === "Anime" &&
        String(item.mal_id) === String(anime.mal_id)
    );

    let updatedFavorites;

    if (alreadyFavorite) {
      updatedFavorites = savedFavorites.filter(
        (item) =>
          !(
            (item.category || "Anime") === "Anime" &&
            String(item.mal_id) === String(anime.mal_id)
          )
      );

      setIsFavorite(false);
    } else {
      updatedFavorites = [
        ...savedFavorites,
        {
          ...anime,
          category: "Anime",
        },
      ];

      setIsFavorite(true);
    }

    localStorage.setItem(
      "favorites",
      JSON.stringify(updatedFavorites)
    );

    const animeFavoriteIds = updatedFavorites
      .filter(
        (item) =>
          (item.category || "Anime") === "Anime" &&
          item.mal_id
      )
      .map((item) => String(item.mal_id));

    try {
      await syncFavorites({
        animeFavorites: animeFavoriteIds,
      });
    } catch (error) {
      console.error(
        "Anime favorite sync error:",
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
        <p>Loading anime...</p>
      </div>
    );
  }

  // =====================================================
  // NOT AVAILABLE
  // =====================================================

  if (!anime) {
    return (
      <div className="details-page">
        <Link to="/anime" className="back-btn">
          ← Back to Anime
        </Link>

        <div className="coming-soon">
          <h2>Anime is not available</h2>
          <p>
            We couldn't load the anime details right now.
          </p>
        </div>
      </div>
    );
  }

  const progressPercentage = anime.episodes
    ? Math.round((progress / anime.episodes) * 100)
    : 0;

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="details-page">

      <Link to="/anime" className="back-btn">
        ← Back to Anime
      </Link>

      <div className="details-container">

        <img
          className="details-poster"
          src={
            anime.images?.jpg?.large_image_url ||
            anime.images?.jpg?.image_url
          }
          alt={anime.title}
        />

        <div className="details-info">

          <h1>{anime.title}</h1>

          <button
            className="favorite-btn"
            onClick={toggleFavorite}
          >
            {isFavorite
              ? "💔 Remove from Favorites"
              : "❤️ Add to Favorites"}
          </button>

          <p className="details-score">
            ⭐ {anime.score || "N/A"}
          </p>

          <p>
            <strong>Type:</strong>{" "}
            {anime.type || "N/A"}
          </p>

          <p>
            <strong>Episodes:</strong>{" "}
            {anime.episodes || "N/A"}
          </p>

          {/* ============================================
              WATCH ANIME
          ============================================ */}

          <div className="progress-section">

            <h3>▶️ Watch Anime</h3>

            <p className="watch-subtitle">
              Choose an episode to watch from an official source.
            </p>

            {streamingLoading ? (
              <p>
                Finding official streaming sources...
              </p>
            ) : streamingEpisodes.length > 0 ? (
              <div className="anime-watch-list">

                {streamingEpisodes.map(
                  (episode, index) => {

                    if (!episode.url) {
                      return null;
                    }

                    const episodeNumber = index + 1;

                    return (
                      <div
                        key={`${episode.url}-${index}`}
                        className="anime-watch-card"
                      >

                        {episode.thumbnail ? (
                          <img
                            src={episode.thumbnail}
                            alt={
                              episode.title ||
                              `Episode ${episodeNumber}`
                            }
                            className="anime-watch-thumbnail"
                          />
                        ) : (
                          <div className="anime-watch-placeholder">
                            ▶️
                          </div>
                        )}

                        <div className="anime-watch-info">

                          <span className="anime-episode-number">
                            Episode {episodeNumber}
                          </span>

                          <h4>
                            {episode.title ||
                              `Episode ${episodeNumber}`}
                          </h4>

                          <span className="anime-watch-site">
                            📺{" "}
                            {episode.site ||
                              "Official Source"}
                          </span>

                          <a
                            href={episode.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="anime-watch-button"
                          >
                            ▶ Watch
                          </a>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            ) : (
              <div className="profile-empty">
                <span>📺</span>

                <p>
                  No official streaming link is currently
                  available for this anime.
                </p>
              </div>
            )}

          </div>

          {/* ============================================
              PROGRESS
          ============================================ */}

          <div className="progress-section">

            <h3>📊 Watch Progress</h3>

            <p>
              {progress} / {anime.episodes || "?"} episodes watched
            </p>

            <div
              style={{
                width: "100%",
                height: "12px",
                background: "#33333d",
                borderRadius: "10px",
                overflow: "hidden",
                margin: "12px 0 5px",
              }}
            >
              <div
                style={{
                  width: `${progressPercentage}%`,
                  height: "100%",
                  background: "#a855f7",
                  borderRadius: "10px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            <p
              style={{
                color: "#c084fc",
                fontSize: "13px",
                fontWeight: "bold",
                marginBottom: "12px",
              }}
            >
              {progressPercentage}% completed
            </p>

            <div className="progress-controls">

              <button
                onClick={() =>
                  updateProgress(progress - 1)
                }
                disabled={progress <= 0}
              >
                −
              </button>

              <span>{progress}</span>

              <button
                onClick={() =>
                  updateProgress(progress + 1)
                }
                disabled={
                  anime.episodes &&
                  progress >= anime.episodes
                }
              >
                +
              </button>

            </div>

            <Link
              to={`/anime/${anime.mal_id}`}
              className="read-btn"
              onClick={() => {
                if (!hasStarted) {
                  startWatching();
                }
              }}
            >
              {hasStarted
                ? `▶️ Continue Watching — Episode ${
                    progress || 1
                  }`
                : "▶️ Start Watching"}
            </Link>

          </div>

          <p>
            <strong>Status:</strong>{" "}
            {anime.status || "N/A"}
          </p>

          <p>
            <strong>Year:</strong>{" "}
            {anime.year ||
              anime.aired?.from?.slice(0, 4) ||
              "N/A"}
          </p>

          <p>
            <strong>Duration:</strong>{" "}
            {anime.duration || "N/A"}
          </p>

          <div className="details-genres">

            <strong>Genres:</strong>

            <div className="genre-tags">

              {anime.genres?.length > 0 ? (
                anime.genres.map((genre) => (
                  <span
                    key={genre.mal_id}
                    className="genre-tag"
                  >
                    {genre.name}
                  </span>
                ))
              ) : (
                <span className="genre-tag">
                  N/A
                </span>
              )}

            </div>

          </div>

        </div>

      </div>

      <div className="synopsis">

        <h2>📖 Synopsis</h2>

        <p>
          {anime.synopsis ||
            "No synopsis available."}
        </p>

      </div>

    </div>
  );
}

export default AnimeDetails;