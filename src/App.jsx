import { useEffect, useState } from "react";
import {
  NavLink,
  Routes,
  Route,
} from "react-router-dom";
import {
  getTopAnime,
  getPopularManga,
  getPopularManhwa,

  getFeaturedAnime,
  getFeaturedManga,
  getFeaturedManhwa,

  getTrendingAnime,
  getTrendingManga,
  getTrendingManhwa,

  searchAnime,
  searchManga,
  searchManhwa,
} from "./services/api";

import Anime from "./pages/Anime";
import AnimeDetails from "./pages/animeDetails";
import Manga from "./pages/Manga";
import MangaDetails from "./pages/MangaDetails";
import Manhwa from "./pages/Manhwa";
import ManhwaDetails from "./pages/ManhwaDetails";
import Favorites from "./pages/Favorites";
import Reader from "./pages/Reader";
import Login from "./pages/login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";

const navLinkClass = ({ isActive }) =>
  isActive ? "nav-active" : "";
function App() {
 const [anime, setAnime] = useState([]);
const [manga, setManga] = useState([]);
const [manhwa, setManhwa] = useState([]);

const [featuredAnime, setFeaturedAnime] = useState([]);
const [featuredManga, setFeaturedManga] = useState([]);
const [featuredManhwa, setFeaturedManhwa] = useState([]);

/* TRENDING */
const [trendingAnime, setTrendingAnime] = useState([]);
const [trendingManga, setTrendingManga] = useState([]);
const [trendingManhwa, setTrendingManhwa] = useState([]);
  const [continueItems, setContinueItems] = useState([]);
  const [currentUser, setCurrentUser] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [search, setSearch] =
    useState("");
  const [searchResults, setSearchResults] =
    useState([]);
  const [searchLoading, setSearchLoading] =
    useState(false);
  const [trendingIndex, setTrendingIndex] =
  useState(0);
const [featuredIndex, setFeaturedIndex] = useState(0);
const [featuredCategory, setFeaturedCategory] = useState("anime");  // =====================================================

  // LOAD CURRENT USER

  // =====================================================

useEffect(() => {
  setFeaturedIndex(0);

  const interval = setInterval(() => {
    setFeaturedIndex((current) => current + 1);
  }, 5000);

  return () => clearInterval(interval);
}, [featuredCategory]);

  useEffect(() => {
    try {
      const savedUser =
        JSON.parse(
          localStorage.getItem(
            "otakuhubCurrentUser"
          )
        );
      setCurrentUser(savedUser);
    } catch (error) {
      console.error(
        "Current user error:",
        error
      );
      setCurrentUser(null);
    }
  }, []);

  // =====================================================

  // SEARCH

  // =====================================================
  const removeContinueItem = async (type, id) => {
    const token = localStorage.getItem("otakuhubToken");
    const user = currentUser;
    if (!user) {
      return;
    }
    const userId = user._id || user.id;
    if (token) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/auth/progress/${type}/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          console.error(
            "Failed to remove progress from MongoDB."
          );
        }
      } catch (error) {
        console.error("Remove progress error:", error);
      }
    }
    const progressKey = `${type}Progress_${userId}`;
    try {
      const savedProgress = JSON.parse(
        localStorage.getItem(progressKey) || "{}"
      );
      delete savedProgress[id];
      localStorage.setItem(
        progressKey,
        JSON.stringify(savedProgress)
      );
    } catch (error) {
      console.error("Local progress remove error:", error);
    }
    setContinueItems((previousItems) =>
      previousItems.filter(
        (item) =>
          !(
            item.type === type &&
            String(item.id) === String(id)
          )
      )
    );
  };
  const handleSearch = async (searchTerm = search) => {
  const query = searchTerm.trim();
  if (!query) {

    setSearchResults([]);

    return;

  }



  console.log("GLOBAL SEARCH:", query);



  setSearchLoading(true);



  try {

    const [

      animeResults,

      mangaResults,

      manhwaResults,

    ] = await Promise.all([

      searchAnime(query),

      searchManga(query),

      searchManhwa(query),

    ]);



    const combinedResults = [

      ...animeResults.slice(0, 4).map((item) => ({

        ...item,

        searchType: "anime",

      })),



      ...mangaResults.slice(0, 4).map((item) => ({

        ...item,

        searchType: "manga",

      })),



      ...manhwaResults.slice(0, 4).map((item) => ({

        ...item,

        searchType: "manhwa",

      })),

    ];



    setSearchResults(combinedResults);

  } catch (error) {

    console.error("Search error:", error);

    setSearchResults([]);

  } finally {

    setSearchLoading(false);

  }

};

  // =====================================================

  // =====================================================
  // HANDLE NAVBAR SEARCH ON HOME
  // =====================================================

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("search") || "";

    console.log("URL SEARCH FOUND:", query);

    if (!query.trim()) {
      return;
    }

    setSearch(query);
    handleSearch(query);
  }, []);

  // LOAD CONTINUE WATCHING / READING

  // =====================================================



  useEffect(() => {

    const loadContinueProgress = async () => {



      // -------------------------------------------------

      // No logged-in user

      // -------------------------------------------------



      if (!currentUser) {

        setContinueItems([]);

        return;

      }





      const token =

        localStorage.getItem(

          "otakuhubToken"

        );





      const userId =

        currentUser._id ||

        currentUser.id;





      if (!userId) {

        setContinueItems([]);

        return;

      }





      const savedContinue = [];





      // =================================================

      // LOCAL STORAGE HELPER

      // =================================================



      const getLocalProgress = (type) => {

        try {

          return JSON.parse(

            localStorage.getItem(

              `${type}Progress_${userId}`

            ) || "{}"

          );

        } catch (error) {

          console.error(

            `Local ${type} progress error:`,

            error

          );



          return {};

        }

      };





      // =================================================

      // GET LOCAL PROGRESS

      // =================================================



      const localAnime =

        getLocalProgress("anime");



      const localManga =

        getLocalProgress("manga");



      const localManhwa =

        getLocalProgress("manhwa");





      // =================================================

      // GET MONGODB PROGRESS

      // =================================================



      let mongoProgress = {

        anime: {},

        manga: {},

        manhwa: {},

      };





      if (token) {

        try {

          const response = await fetch(

            "http://localhost:5000/api/auth/progress",

            {

              method: "GET",



              headers: {

                Authorization:

                  `Bearer ${token}`,

              },

            }

          );





          if (response.ok) {

            const data =

              await response.json();



            mongoProgress =

              data.readingProgress ||

              {

                anime: {},

                manga: {},

                manhwa: {},

              };





            console.log(

              "MongoDB progress:",

              mongoProgress

            );

          }

        } catch (error) {

          console.error(

            "MongoDB progress error:",

            error

          );

        }

      }





      // =================================================

      // MERGE LOCAL + MONGODB

      // MongoDB progress gets priority.

      // =================================================



      const addProgressItems = (

        type,

        localData,

        mongoData,

        defaultTitle

      ) => {



        // Start with local progress

        const merged = {

          ...localData,

        };





        // MongoDB progress overwrites

        // local progress when same ID exists

        Object.entries(

  mongoData || {}

).forEach(

  ([id, mongoItem]) => {



    const existing =

      merged[id];



    const mongoProgress =

      typeof mongoItem === "object"

        ? mongoItem.progress

        : mongoItem;



    const mongoTitle =

      typeof mongoItem === "object"

        ? mongoItem.title

        : "";



    const mongoImage =

      typeof mongoItem === "object"

        ? mongoItem.image

        : "";



    merged[id] = {

      progress:

        Number(mongoProgress),



      title:

        mongoTitle ||

        existing?.title ||

        defaultTitle,



      image:

        mongoImage ||

        existing?.image ||

        "",

    };

  }

);





        // Add merged items to Continue list

        Object.entries(

          merged

        ).forEach(

          ([id, item]) => {



            const progress =

              typeof item === "object"

                ? item.progress

                : item;





            if (

              Number(progress) > 0

            ) {



              savedContinue.push({

                type,

                id,



                progress:

                  Number(progress),



                title:

                  typeof item ===

                  "object"

                    ? item.title ||

                      defaultTitle

                    : defaultTitle,



                image:

                  typeof item ===
                  "object"
                    ? item.image ||
                      ""
                    : "",
              });
            }
          }
        );
      };
      // =================================================
      // ANIME
      // =================================================
      addProgressItems(
        "anime",
        localAnime,
        mongoProgress.anime,
        "Anime"
      );

      // =================================================
      // MANGA
      // =================================================
      addProgressItems(
        "manga",
        localManga,
        mongoProgress.manga,
        "Manga"
      );
      // =================================================
      // MANHWA
      // =================================================
      addProgressItems(
        "manhwa",
        localManhwa,
        mongoProgress.manhwa,
        "Manhwa"
      );
      // =================================================
      // SET CONTINUE ITEMS
      // =================================================
      setContinueItems(
        savedContinue
      );
    };
    loadContinueProgress();
  }, [currentUser]);

  // =====================================================
  // LOAD HOME DATA
  // =====================================================
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // -------------------------------------------------
      // Trending Anime
      // -------------------------------------------------

      try {
        const trendingAnimeData =
          await getTrendingAnime();

        setTrendingAnime(
          trendingAnimeData.slice(0, 8)
        );
      } catch (error) {
        console.error(
          "Trending Anime error:",
          error
        );
      }


      // -------------------------------------------------
      // Trending Manga
      // -------------------------------------------------

      try {
        const trendingMangaData =
          await getTrendingManga();

        setTrendingManga(
          trendingMangaData.slice(0, 8)
        );
      } catch (error) {
        console.error(
          "Trending Manga error:",
          error
        );
      }


      // -------------------------------------------------
      // Trending Manhwa
      // -------------------------------------------------

      try {
        const trendingManhwaData =
          await getTrendingManhwa();

        setTrendingManhwa(
          trendingManhwaData.slice(0, 8)
        );
      } catch (error) {
        console.error(
          "Trending Manhwa error:",
          error
        );
      }


      setLoading(false);

            // -------------------------------------------------
      // Featured Anime
      // -------------------------------------------------

      try {
        const featuredAnimeData =
          await getFeaturedAnime();

        setFeaturedAnime(featuredAnimeData);
      } catch (error) {
        console.error(
          "Featured anime error:",
          error
        );
      }


      // -------------------------------------------------
      // Featured Manga
      // -------------------------------------------------

      try {
        const featuredMangaData =
          await getFeaturedManga();

        setFeaturedManga(featuredMangaData);
      } catch (error) {
        console.error(
          "Featured manga error:",
          error
        );
      }


      // -------------------------------------------------
      // Featured Manhwa
      // -------------------------------------------------

      try {
        const featuredManhwaData =
          await getFeaturedManhwa();

        setFeaturedManhwa(featuredManhwaData);
      } catch (error) {
        console.error(
          "Featured manhwa error:",
          error
        );
      }

      // -------------------------------------------------
      // Anime
      // -------------------------------------------------
      try {
        const animeData =
          await getTopAnime();
        setAnime(
          animeData.slice(0, 8)
        );
      } catch (error) {
        console.error(
          "Anime error:",
          error
        );
      }

      // -------------------------------------------------
      // Manga
      // -------------------------------------------------
      try {
        const mangaData =
          await getPopularManga();
        setManga(mangaData);
      } catch (error) {
        console.error(
          "Manga error:",
          error
        );
      }

      // -------------------------------------------------
      // Manhwa
      // -------------------------------------------------
      try {
        const manhwaData =
          await getPopularManhwa();
        setManhwa(manhwaData);
      } catch (error) {
        console.error(
          "Manhwa error:",
          error
        );
      }
      setLoading(false);
    };
    loadData();
  }, []);
  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="app">
      {/* =================================================
          NAVBAR
      ================================================= */}
      {/* =================================================
          HERO
      ================================================= */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-small">
            WELCOME TO OTAKUHUB
          </p>
          <h1>
            Discover Your Next
            <span> Adventure</span>
          </h1>
          <p className="hero-description">
            Explore thousands of Anime, Manga and Manhwa
            all in one place.
          </p>
          <NavLink
            to="/anime"
            className="explore-btn"
          >
            Explore Now →
          </NavLink>
        </div>
          </section>
<section className="featured-section">
  <div className="featured-heading">
    <div>
      <p className="featured-subtitle">DISCOVER SOMETHING AMAZING</p>
      <h2>✨ Featured</h2>
    </div>

    <div className="featured-tabs">
      <button
        type="button"
        className={
          featuredCategory === "anime"
            ? "featured-tab active"
            : "featured-tab"
        }
        onClick={() => setFeaturedCategory("anime")}
      >
        🎌 Anime
      </button>

      <button
        type="button"
        className={
          featuredCategory === "manga"
            ? "featured-tab active"
            : "featured-tab"
        }
        onClick={() => setFeaturedCategory("manga")}
      >
        📚 Manga
      </button>

      <button
        type="button"
        className={
          featuredCategory === "manhwa"
            ? "featured-tab active"
            : "featured-tab"
        }
        onClick={() => setFeaturedCategory("manhwa")}
      >
        ⚔️ Manhwa
      </button>
    </div>
  </div>

  {(() => {
    const featuredItems =
  featuredCategory === "anime"
    ? featuredAnime
    : featuredCategory === "manga"
    ? featuredManga
    : featuredManhwa;

    if (!featuredItems.length) {
      return (
        <div className="featured-loading">
          Loading featured titles...
        </div>
      );
    }

    const featured =
      featuredItems[featuredIndex % featuredItems.length];

    const isAnime = featuredCategory === "anime";

    const title = isAnime
      ? featured.title
      : featured.title?.english ||
        featured.title?.romaji ||
        featured.title?.native ||
        "Unknown Title";

    const image = isAnime
      ? featured.images?.jpg?.large_image_url ||
        featured.images?.jpg?.image_url
      : featured.coverImage?.extraLarge ||
        featured.coverImage?.large;

    const rating = isAnime
      ? featured.score
      : featured.averageScore
      ? featured.averageScore / 10
      : null;

    const description = isAnime
      ? featured.synopsis
      : featured.description
      ? featured.description.replace(/<[^>]*>/g, "")
      : null;

    const itemId = isAnime
      ? featured.mal_id
      : featured.id;

    const link = `/${featuredCategory}/${itemId}`;

    return (
      <div
        className="featured-card"
        style={{
          backgroundImage: `linear-gradient(
            90deg,
            rgba(5, 10, 25, 0.98) 0%,
            rgba(5, 10, 25, 0.88) 42%,
            rgba(5, 10, 25, 0.25) 100%
          ), url(${image})`,
        }}
      >
        <div className="featured-content">
          <span className="featured-label">
            {featuredCategory === "anime"
              ? "🎌 FEATURED ANIME"
              : featuredCategory === "manga"
              ? "📚 FEATURED MANGA"
              : "⚔️ FEATURED MANHWA"}
          </span>

          <h2>{title}</h2>

          <div className="featured-meta">
            <span>
              ⭐ {rating ? Number(rating).toFixed(1) : "N/A"}
            </span>

            <span>
              {featuredCategory === "anime"
                ? "Anime"
                : featuredCategory === "manga"
                ? "Manga"
                : "Manhwa"}
            </span>

            {isAnime && featured.episodes && (
              <span>📺 {featured.episodes} Episodes</span>
            )}
          </div>

          <p>
            {description
              ? description.length > 220
                ? `${description.substring(0, 220)}...`
                : description
              : "Discover this amazing title on OtakuHub."}
          </p>

          <div className="featured-buttons">
            <NavLink
              to={link}
              className="featured-watch-btn"
            >
              {isAnime ? "▶ Watch Now" : "📖 View Now"}
            </NavLink>

            <NavLink
              to={link}
              className="featured-details-btn"
            >
              View Details
            </NavLink>
          </div>

          <div className="featured-dots">
            {featuredItems.map((_, index) => (
              <button
                key={index}
                type="button"
                className={
                  index ===
                  featuredIndex % featuredItems.length
                    ? "featured-dot active"
                    : "featured-dot"
                }
                onClick={() => setFeaturedIndex(index)}
                aria-label={`Show featured ${
                  featuredCategory
                } ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  })()}
</section>

      {/* =================================================
          TRENDING SLIDER
      ================================================= */}

      {(() => {
        const trendingItems = [
  ...trendingAnime.slice(0, 6).map((item) => ({
            id: item.mal_id,
            type: "anime",
            title: item.title,
            image:
              item.images?.jpg?.large_image_url ||
              item.images?.jpg?.image_url,
            rating: item.score,
            label: "ANIME",
            emoji: "🎌",
            link: `/anime/${item.mal_id}`,
          })),

          ...trendingManga.slice(0, 6).map((item) => ({
            id: item.id,
            type: "manga",
            title:
              item.title?.english ||
              item.title?.romaji ||
              item.title?.native ||
              "Unknown Title",
            image: item.coverImage?.large,
            rating: item.averageScore
              ? item.averageScore / 10
              : null,
            label: "MANGA",
            emoji: "📚",
            link: `/manga/${item.id}`,
          })),

...trendingManhwa.slice(0, 6).map((item) => ({id: item.id,
            type: "manhwa",
            title:
              item.title?.english ||
              item.title?.romaji ||
              item.title?.native ||
              "Unknown Title",
            image: item.coverImage?.large,
            rating: item.averageScore
              ? item.averageScore / 10
              : null,
            label: "MANHWA",
            emoji: "⚔️",
            link: `/manhwa/${item.id}`,
          })),
        ];

        const visibleItems = 4;

        const maxIndex = Math.max(
          0,
          trendingItems.length - visibleItems
        );

        const nextSlide = () => {
          setTrendingIndex((current) =>
            current >= maxIndex
              ? 0
              : current + 1
          );
        };

        const previousSlide = () => {
          setTrendingIndex((current) =>
            current <= 0
              ? maxIndex
              : current - 1
          );
        };

        return (
          <section className="trending-section">

            <div className="trending-header">

              <div>
                <p className="trending-subtitle">
                  WHAT'S HOT RIGHT NOW
                </p>

                <h2>
                  🔥 Trending Now
                </h2>
              </div>


              <div className="trending-controls">

                <button
                  type="button"
                  onClick={previousSlide}
                  aria-label="Previous trending items"
                >
                  ←
                </button>

                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next trending items"
                >
                  →
                </button>

              </div>

            </div>


            {trendingItems.length > 0 ? (

              <div className="trending-slider">

                <div
                  className="trending-track"
                  style={{
                    transform:
                      `translateX(-${trendingIndex * 25}%)`,
                  }}
                >

                  {trendingItems.map((item) => (

                    <div
                      className="trending-slide"
                      key={`${item.type}-${item.id}`}
                    >

                      <NavLink
                        to={item.link}
                        className="trending-card"
                      >

                        <div className="trending-image-wrapper">

                          <img
                            src={item.image}
                            alt={item.title}
                          />

                          <span
                            className={`trending-badge trending-${item.type}`}
                          >
                            {item.emoji} {item.label}
                          </span>

                          <span className="trending-number">
                            #
                            {trendingItems.indexOf(item) + 1}
                          </span>

                        </div>


                        <div className="trending-card-info">

                          <h3>
                            {item.title}
                          </h3>

                          <div className="trending-meta">

                            <span>
                              ⭐{" "}
                              {item.rating
                                ? Number(item.rating).toFixed(1)
                                : "N/A"}
                            </span>

                            <span>
                              {item.type === "anime"
                                ? "Anime"
                                : item.type === "manga"
                                ? "Manga"
                                : "Manhwa"}
                            </span>

                          </div>

                        </div>

                      </NavLink>

                    </div>

                  ))}

                </div>

              </div>

            ) : (

              <div className="trending-loading">
                🔥 Loading trending titles...
              </div>

            )}

          </section>
        );
      })()}


      {/* =================================================
          SEARCH RESULTS
      ================================================= */}
      {searchResults.length > 0 && (



        <section className="section">



          <div className="section-header">



            <h2>

              🔍 Search Results

            </h2>





            <button

              className="view-all"

              onClick={() =>

                setSearchResults([])

              }

            >

              Clear

            </button>



          </div>





          {searchLoading ? (



            <p>

              Searching...

            </p>



          ) : (



            <>



              {/* =========================================

                  ANIME SEARCH RESULTS

              ========================================= */}



              {searchResults.filter(

                (item) =>

                  item.searchType ===

                  "anime"

              ).length > 0 && (



                <>



                  <div className="section-header">



                    <h2>

                      🎌 Anime

                    </h2>



                  </div>





                  <div className="cards">



                    {searchResults

                      .filter(

                        (item) =>

                          item.searchType ===

                          "anime"

                      )

                      .map((item) => (



                        <NavLink

                          to={`/anime/${item.mal_id}`}

                          className="card"

                          key={`anime-${item.mal_id}`}

                        >



                          <img

                            src={

                              item.images

                                ?.jpg

                                ?.large_image_url ||

                              item.images

                                ?.jpg

                                ?.image_url

                            }

                            alt={item.title}

                          />





                          <div className="card-info">



                            <h3>

                              {item.title}

                            </h3>





                            <div className="card-meta">



                              <span>

                                ⭐{" "}

                                {item.score ||

                                  "N/A"}

                              </span>





                              <span>

                                🎌 ANIME

                              </span>



                            </div>





                            <p>

                              {item.episodes

                                ? `${item.episodes} Episodes`

                                : "Episodes N/A"}

                            </p>



                          </div>



                        </NavLink>



                      ))}



                  </div>



                </>



              )}





              {/* =========================================

                  MANGA SEARCH RESULTS

              ========================================= */}



              {searchResults.filter(

                (item) =>

                  item.searchType ===

                  "manga"

              ).length > 0 && (



                <>



                  <div className="section-header">



                    <h2>

                      📚 Manga

                    </h2>



                  </div>





                  <div className="cards">



                    {searchResults

                      .filter(

                        (item) =>

                          item.searchType ===

                          "manga"

                      )

                      .map((item) => (



                        <NavLink

                          to={`/manga/${item.id}`}

                          className="card"

                          key={`manga-${item.id}`}

                        >



                          <img

                            src={

                              item.coverImage

                                ?.large

                            }

                            alt={

                              item.title

                                ?.english ||

                              item.title

                                ?.romaji ||

                              item.title

                                ?.native

                            }

                          />





                          <div className="card-info">



                            <h3>

                              {item.title

                                ?.english ||

                                item.title

                                  ?.romaji ||

                                item.title

                                  ?.native ||

                                "Unknown Title"}

                            </h3>





                            <div className="card-meta">



                              <span>

                                ⭐{" "}

                                {item.averageScore

                                  ? item.averageScore /

                                    10

                                  : "N/A"}

                              </span>





                              <span>

                                📚 MANGA

                              </span>



                            </div>





                            <p>

                              {item.chapters

                                ? `${item.chapters} Chapters`

                                : "Chapters N/A"}

                            </p>



                          </div>



                        </NavLink>



                      ))}



                  </div>



                </>



              )}





              {/* =========================================

                  MANHWA SEARCH RESULTS

              ========================================= */}



              {searchResults.filter(

                (item) =>

                  item.searchType ===

                  "manhwa"

              ).length > 0 && (



                <>



                  <div className="section-header">



                    <h2>

                      ⚔️ Manhwa

                    </h2>



                  </div>





                  <div className="cards">



                    {searchResults

                      .filter(

                        (item) =>

                          item.searchType ===

                          "manhwa"

                      )

                      .map((item) => (



                        <NavLink

                          to={`/manhwa/${item.id}`}

                          className="card"

                          key={`manhwa-${item.id}`}

                        >



                          <img

                            src={

                              item.coverImage

                                ?.large

                            }

                            alt={

                              item.title

                                ?.english ||

                              item.title

                                ?.romaji ||

                              item.title

                                ?.native

                            }

                          />





                          <div className="card-info">



                            <h3>

                              {item.title

                                ?.english ||

                                item.title

                                  ?.romaji ||

                                item.title

                                  ?.native ||

                                "Unknown Title"}

                            </h3>





                            <div className="card-meta">



                              <span>

                                ⭐{" "}

                                {item.averageScore

                                  ? item.averageScore /

                                    10

                                  : "N/A"}

                              </span>





                              <span>

                                ⚔️ MANHWA

                              </span>



                            </div>





                            <p>

                              {item.chapters

                                ? `${item.chapters} Chapters`

                                : "Chapters N/A"}

                            </p>



                          </div>



                        </NavLink>



                      ))}



                  </div>



                </>



              )}



            </>



          )}



        </section>



      )}





      {/* =================================================

          CONTINUE WATCHING / READING

      ================================================= */}



      {continueItems.length > 0 && (



        <section className="section">



          <div className="section-header">



            <h2>

              ▶️ Continue Watching / Reading

            </h2>



          </div>





          <div className="continue-list">



            {continueItems.map((item) => (

              <div

                key={`${item.type}-${item.id}`}

                className="continue-card"

              >

                <NavLink

                  to={`/${item.type}/${item.id}${

                    item.type === "anime"

                      ? ""

                      : `/read/${item.progress}`

                  }`}

                  className="continue-card-link"

                >

                  {item.image ? (

                    <img

                      src={item.image}

                      alt={item.title || "Title"}

                      className="continue-image"

                    />

                  ) : (

                    <div className="continue-icon">

                      {item.type === "anime"

                        ? "🎌"

                        : item.type === "manga"

                        ? "📚"

                        : "⚔️"}

                    </div>

                  )}



                  <div className="continue-info">

                    <h3>

                      {item.title ||

                        (item.type === "anime"

                          ? "Anime"

                          : item.type === "manga"

                          ? "Manga"

                          : "Manhwa")}

                    </h3>
                    <p>
                      {item.type === "anime"
                        ? `Episode ${item.progress}`
                        : `Chapter ${item.progress}`}
                    </p>
                  </div>
                  <span className="continue-arrow">
                    →
                  </span>
                </NavLink>
                <button
                  className="continue-remove"
                  onClick={() =>
                    removeContinueItem(
                      item.type,
                      item.id
                    )
                  }
                  title="Remove from Continue"
                  aria-label="Remove from Continue"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      {/* =================================================
          TOP ANIME
      ================================================= */}

      <section className="section">
        <div className="section-header">
          <h2>
            🔥 Top Anime
          </h2>
          <NavLink
            to="/anime"
            className="view-all"
          >
            View All →
          </NavLink>
        </div>
        {loading ? (
          <p>
            Loading anime...
          </p>
        ) : anime.length > 0 ? (
          <div className="cards">
            {anime.map(
              (item) => (
                <NavLink
                  to={`/anime/${item.mal_id}`}
                  className="card"
                  key={item.mal_id}
                >
                  <img
                    src={
                      item.images
                        .jpg
                        .large_image_url
                    }
                    alt={item.title}
                  />
                  <div className="card-info">
                    <h3>
                      {item.title}
                    </h3>
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
                    <p>
                      {item.episodes
                        ? `${item.episodes} Episodes`
                        : "Episodes N/A"}
                    </p>
                  </div>
                </NavLink>
              )
            )}
          </div>
        ) : (
          <div className="coming-soon">
            🔥 Anime data is temporarily unavailable.
          </div>
        )}
      </section>

      {/* =================================================
          POPULAR MANGA
      ================================================= */}

      <section className="section">
        <div className="section-header">
          <h2>
            📚 Popular Manga
          </h2>
          <NavLink
            to="/manga"
            className="view-all"
          >
            View All →
          </NavLink>
        </div>
        {loading ? (

          <p>
            Loading manga...
          </p>
        ) : manga.length > 0 ? (
          <div className="cards">
            {manga.map(
              (item) => (
                <NavLink
                  to={`/manga/${item.id}`}
                  className="card"
                  key={item.id}
                >

                  <img
                    src={
                      item.coverImage
                        ?.large
                    }
                    alt={
                      item.title
                        ?.english ||
                      item.title
                        ?.romaji ||
                      item.title
                        ?.native
                    }
                  />
                  <div className="card-info">
                    <h3>
                      {item.title
                        ?.english ||
                        item.title
                          ?.romaji ||
                        item.title
                          ?.native ||
                        "Unknown Title"}
                    </h3>
                    <div className="card-meta">
                      <span>
                        ⭐{" "}
                        {item.averageScore
                          ? item.averageScore /
                            10
                          : "N/A"}
                      </span>
                      <span>
                        {item.format ||
                          "Manga"}
                      </span>
                    </div>
                    <p>
                      {item.chapters
                        ? `${item.chapters} Chapters`
                        : "Chapters N/A"}
                    </p>
                  </div>
                </NavLink>

              )

            )}

          </div>

        ) : (

          <div className="coming-soon">
            📚 Manga data is temporarily unavailable.
            <br />
            Please try again later.
          </div>

        )}
      </section>

      {/* =================================================
          POPULAR MANHWA
      ================================================= */}
      <section className="section">
        <div className="section-header">
          <h2>
            ⚔️ Popular Manhwa
          </h2>
          <NavLink
            to="/manhwa"
            className="view-all"
          >
            View All →
          </NavLink>
        </div>
        {loading ? (
          <p>
            Loading manhwa...
          </p>
        ) : manhwa.length > 0 ? (
          <div className="cards">
            {manhwa.map(
              (item) => (
                <NavLink
                  to={`/manhwa/${item.id}`}
                  className="card"
                  key={item.id}
                >
                  <img
                    src={
                      item.coverImage
                        ?.large
                    }
                    alt={
                      item.title
                        ?.english ||
                      item.title
                        ?.romaji ||
                      item.title
                        ?.native
                    }
                  />
                  <div className="card-info">
                    <h3>
                      {item.title
                        ?.english ||
                        item.title
                          ?.romaji ||
                        item.title
                          ?.native ||
                        "Unknown Title"}
                    </h3>
                    <div className="card-meta">
                      <span>
                        ⭐{" "}
                        {item.averageScore
                          ? item.averageScore /
                            10
                          : "N/A"}
                      </span>
                      <span>
                        MANHWA
                      </span>
                    </div>
                    <p>
                      {item.chapters
                        ? `${item.chapters} Chapters`
                        : "Chapters N/A"}
                    </p>
                  </div>
                </NavLink>
              )
            )}
          </div>
        ) : (
          <div className="coming-soon">
            ⚔️ Manhwa data is temporarily unavailable.
            <br />
            Please try again later.
          </div>
        )}
      </section>
    </div>
  );
}
// =======================================================

// ROUTES

// =======================================================

function AppRouter() {
  return (
    <>
      <Navbar />
      <main className="page-content">
      <Routes>
        <Route
          path="/"
          element={<App />}
        />
       <Route
  path="/anime/:id"
  element={<AnimeDetails />}
/>
        <Route
          path="/manga"
          element={<Manga />}
        />
        <Route
          path="/manhwa"
          element={<Manhwa />}
        />
        <Route
          path="/anime/:id"
          element={<AnimeDetails />}
        />
        <Route
          path="/manga/:id"
          element={<MangaDetails />}
        />
        <Route
          path="/manhwa/:id"
          element={<ManhwaDetails />}
        />
        <Route
          path="/favorites"
          element={<Favorites />}
        />
        <Route
          path="/login"
          element={<Login />}
        />
        <Route
          path="/signup"
          element={<Signup />}
        />
        <Route
          path="/profile"
          element={<Profile />}
        />
        <Route
          path="/:type/:id/read/:chapter"
          element={<Reader />}
        />
<Route
  path="/"
  element={<App />}
/>

<Route
  path="/anime"
  element={<Anime />}
/>
        </Routes>
</main>
    </>
  );
}
export default AppRouter;
