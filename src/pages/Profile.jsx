import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [readingProgress, setReadingProgress] =
    useState({
      anime: {},
      manga: {},
      manhwa: {},
    });

  // =====================================================
  // LOAD PROFILE + READING PROGRESS
  // =====================================================

  useEffect(() => {
    const fetchProfile = async () => {
      const token =
        localStorage.getItem("otakuhubToken");

      const savedUser =
        JSON.parse(
          localStorage.getItem(
            "otakuhubCurrentUser"
          ) || "null"
        );

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // -----------------------------------------------
        // Get profile from MongoDB
        // -----------------------------------------------

        const profileResponse =
          await fetch(
            "http://localhost:5000/api/auth/profile",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const profileData =
          await profileResponse.json();

        if (profileResponse.ok) {
          setCurrentUser(profileData.user);
        } else if (savedUser) {
          setCurrentUser(savedUser);
        }

        // -----------------------------------------------
        // Get reading progress from MongoDB
        // -----------------------------------------------

        const progressResponse =
          await fetch(
            "http://localhost:5000/api/auth/progress",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (progressResponse.ok) {
          const progressData =
            await progressResponse.json();

          const mongoProgress =
            progressData.readingProgress || {};

          setReadingProgress({
            anime:
              mongoProgress.anime || {},
            manga:
              mongoProgress.manga || {},
            manhwa:
              mongoProgress.manhwa || {},
          });
        }
      } catch (error) {
        console.error(
          "Profile fetch error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // =====================================================
  // FAVORITES
  // =====================================================

  const animeFavorites =
    currentUser?.animeFavorites || [];

  const mangaFavorites =
    currentUser?.mangaFavorites || [];

  const manhwaFavorites =
    currentUser?.manhwaFavorites || [];

  const totalFavorites =
    animeFavorites.length +
    mangaFavorites.length +
    manhwaFavorites.length;

  // =====================================================
  // READING PROGRESS COUNTS
  // =====================================================

  const animeProgressCount =
    Object.keys(
      readingProgress.anime || {}
    ).length;

  const mangaProgressCount =
    Object.keys(
      readingProgress.manga || {}
    ).length;

  const manhwaProgressCount =
    Object.keys(
      readingProgress.manhwa || {}
    ).length;

  const totalProgress =
    animeProgressCount +
    mangaProgressCount +
    manhwaProgressCount;

  // =====================================================
  // LOGIN CHECK
  // =====================================================

  if (!currentUser) {
    if (loading) {
      return (
        <div className="auth-page">
          <div className="auth-card">
            <div className="auth-card-header">
              <div className="auth-icon">
                ⏳
              </div>

              <h2>
                Loading Profile...
              </h2>

              <p>
                Please wait.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-icon">
              🔐
            </div>

            <h2>
              Login Required
            </h2>

            <p>
              Please sign in to view your
              profile.
            </p>
          </div>

          <Link
            to="/login"
            className="auth-btn"
            style={{
              display: "block",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">

      {/* =================================================
          PROFILE HERO
      ================================================= */}

      <div className="profile-shell">

        <section className="profile-hero">

          <div className="profile-avatar-large">
            👤
          </div>

          <div className="profile-hero-info">

            <div className="profile-badge">
              ✨ OTAKU PROFILE
            </div>

            <h1>
              {currentUser.username}
            </h1>

            <p>
              {currentUser.email}
            </p>

          </div>

          <div className="profile-hero-side">
            <span>📚</span>
            <strong>
              {totalProgress}
            </strong>
            <small>
              Active Titles
            </small>
          </div>

        </section>


        {/* =================================================
            STAT CARDS
        ================================================= */}

        <section className="profile-stats-grid">

          <div className="profile-stat-card favorites-stat">

            <div className="profile-stat-icon">
              ❤️
            </div>

            <div className="profile-stat-content">
              <strong>
                {totalFavorites}
              </strong>

              <span>
                Favorites
              </span>
            </div>

          </div>


          <div className="profile-stat-card anime-stat">

            <div className="profile-stat-icon">
              ▶️
            </div>

            <div className="profile-stat-content">
              <strong>
                {animeProgressCount}
              </strong>

              <span>
                Anime
              </span>
            </div>

          </div>


          <div className="profile-stat-card manga-stat">

            <div className="profile-stat-icon">
              📚
            </div>

            <div className="profile-stat-content">
              <strong>
                {mangaProgressCount}
              </strong>

              <span>
                Manga
              </span>
            </div>

          </div>


          <div className="profile-stat-card manhwa-stat">

            <div className="profile-stat-icon">
              ⚔️
            </div>

            <div className="profile-stat-content">
              <strong>
                {manhwaProgressCount}
              </strong>

              <span>
                Manhwa
              </span>
            </div>

          </div>

        </section>


        {/* =================================================
            ACTIVITY OVERVIEW
        ================================================= */}

        <section className="profile-dashboard-card">

          <div className="profile-section-heading">

            <div>
              <span className="profile-section-icon">
                📊
              </span>

              <div>
                <h2>
                  Your Activity
                </h2>

                <p>
                  Your personal OtakuHub overview
                </p>
              </div>
            </div>

          </div>


          <div className="activity-overview-grid">

            <div className="activity-overview-item">

              <span className="activity-overview-number">
                {totalFavorites}
              </span>

              <span className="activity-overview-label">
                Titles in collection
              </span>

            </div>


            <div className="activity-overview-item">

              <span className="activity-overview-number">
                {totalProgress}
              </span>

              <span className="activity-overview-label">
                Titles with progress
              </span>

            </div>


            <div className="activity-overview-item">

              <span className="activity-overview-number">
                {animeProgressCount}
              </span>

              <span className="activity-overview-label">
                Anime tracked
              </span>

            </div>


            <div className="activity-overview-item">

              <span className="activity-overview-number">
                {mangaProgressCount +
                  manhwaProgressCount}
              </span>

              <span className="activity-overview-label">
                Reading tracked
              </span>

            </div>

          </div>

        </section>


        {/* =================================================
            READING ACTIVITY
        ================================================= */}

        <section className="profile-dashboard-card">

          <div className="profile-section-heading">

            <div>
              <span className="profile-section-icon">
                📚
              </span>

              <div>
                <h2>
                  Reading Activity
                </h2>

                <p>
                  Pick up where you left off
                </p>
              </div>
            </div>

          </div>


          <div className="profile-reading-grid">

            {/* ================= ANIME ================= */}

            {Object.entries(
              readingProgress.anime || {}
            ).map(
              ([id, item]) => {

                const progress =
                  typeof item === "object"
                    ? item.progress
                    : item;

                const title =
                  typeof item === "object"
                    ? item.title
                    : "Anime";

                const image =
                  typeof item === "object"
                    ? item.image
                    : "";

                return (
                  <div
                    className="profile-media-card"
                    key={`anime-${id}`}
                  >

                    {image ? (
                      <img
                        src={image}
                        alt={title}
                        className="profile-media-image"
                      />
                    ) : (
                      <div className="profile-media-placeholder">
                        🎌
                      </div>
                    )}

                    <div className="profile-media-content">

                      <span className="profile-media-type anime-type">
                        ANIME
                      </span>

                      <h3>
                        {title || "Anime"}
                      </h3>

                      <p>
                        Episode {progress}
                      </p>

                      <Link
                        to={`/anime/${id}`}
                        className="profile-media-btn"
                      >
                        Continue →
                      </Link>

                    </div>

                  </div>
                );
              }
            )}


            {/* ================= MANGA ================= */}

            {Object.entries(
              readingProgress.manga || {}
            ).map(
              ([id, item]) => {

                const progress =
                  typeof item === "object"
                    ? item.progress
                    : item;

                const title =
                  typeof item === "object"
                    ? item.title
                    : "Manga";

                const image =
                  typeof item === "object"
                    ? item.image
                    : "";

                return (
                  <div
                    className="profile-media-card"
                    key={`manga-${id}`}
                  >

                    {image ? (
                      <img
                        src={image}
                        alt={title}
                        className="profile-media-image"
                      />
                    ) : (
                      <div className="profile-media-placeholder">
                        📚
                      </div>
                    )}

                    <div className="profile-media-content">

                      <span className="profile-media-type manga-type">
                        MANGA
                      </span>

                      <h3>
                        {title || "Manga"}
                      </h3>

                      <p>
                        Chapter {progress}
                      </p>

                      <Link
                        to={`/manga/${id}/read/${progress}`}
                        className="profile-media-btn"
                      >
                        Continue →
                      </Link>

                    </div>

                  </div>
                );
              }
            )}


            {/* ================= MANHWA ================= */}

            {Object.entries(
              readingProgress.manhwa || {}
            ).map(
              ([id, item]) => {

                const progress =
                  typeof item === "object"
                    ? item.progress
                    : item;

                const title =
                  typeof item === "object"
                    ? item.title
                    : "Manhwa";

                const image =
                  typeof item === "object"
                    ? item.image
                    : "";

                return (
                  <div
                    className="profile-media-card"
                    key={`manhwa-${id}`}
                  >

                    {image ? (
                      <img
                        src={image}
                        alt={title}
                        className="profile-media-image"
                      />
                    ) : (
                      <div className="profile-media-placeholder">
                        ⚔️
                      </div>
                    )}

                    <div className="profile-media-content">

                      <span className="profile-media-type manhwa-type">
                        MANHWA
                      </span>

                      <h3>
                        {title || "Manhwa"}
                      </h3>

                      <p>
                        Chapter {progress}
                      </p>

                      <Link
                        to={`/manhwa/${id}/read/${progress}`}
                        className="profile-media-btn"
                      >
                        Continue →
                      </Link>

                    </div>

                  </div>
                );
              }
            )}


            {/* ================= EMPTY ================= */}

            {totalProgress === 0 && (
              <div className="profile-empty-new">

                <div className="profile-empty-icon">
                  📖
                </div>

                <h3>
                  Nothing here yet
                </h3>

                <p>
                  Start watching or reading something
                  and your progress will appear here.
                </p>

                <Link
                  to="/"
                  className="profile-explore-btn"
                >
                  Explore Now →
                </Link>

              </div>
            )}

          </div>

        </section>


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="profile-bottom-actions">

          <Link
            to="/favorites"
            className="profile-primary-action"
          >
            ❤️ View Favorites
          </Link>

          <Link
            to="/"
            className="profile-secondary-action"
          >
            ← Back to Home
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Profile;