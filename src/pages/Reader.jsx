import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  useEffect,
  useState,
} from "react";
import {
  getMangaDetails,
  getManhwaDetails,
} from "../services/api";
import {
  findReadableChapter,
} from "../services/sources/sourceManager";
function Reader() {
  const {
    type,
    id,
    chapter,
  } = useParams();
  const navigate = useNavigate();
  const currentChapter =
    Number(chapter) || 1;
  // =====================================================
  // STATE
  // =====================================================
  const [savedChapter, setSavedChapter] =
    useState(currentChapter);
  const [title, setTitle] =
    useState("");
  const [image, setImage] =
    useState("");
  const [pages, setPages] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [externalUrl, setExternalUrl] =
    useState("");
  const [scanlationGroup, setScanlationGroup] =
    useState("");
  const [isFullscreen, setIsFullscreen] =
    useState(false);
  const [readingMode, setReadingMode] =
    useState(false);
  const [availableChapters, setAvailableChapters] =
    useState([]);
  const [selectedSource, setSelectedSource] =
  useState("mangadex");
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
  // LOAD SAVED PROGRESS
  // =====================================================
  useEffect(() => {
    const loadProgress = async () => {
      const token =
        localStorage.getItem(
          "otakuhubToken"
        );
      const user = getUser();
      // -----------------------------------------------
      // MONGODB
      // -----------------------------------------------
      if (token && user) {
        try {
          const response =
            await fetch(
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
            const progress =
              data.readingProgress?.[
                type
              ]?.[id];
            if (progress) {
              if (
                typeof progress ===
                "object"
              ) {
                setSavedChapter(
                  Number(
                    progress.progress ||
                      1
                  )
                );
              } else {
                setSavedChapter(
                  Number(progress) || 1
                );
              }
              return;
            }
          }
        } catch (error) {
          console.error(
            "MongoDB progress load error:",
            error
          );
        }
      }
      // -----------------------------------------------
      // LOCAL STORAGE FALLBACK
      // -----------------------------------------------
      if (user) {
        const userId =
          user._id || user.id;
        const progressKey =
          `${type}Progress_${userId}`;
        try {
          const savedProgress =
            JSON.parse(
              localStorage.getItem(
                progressKey
              ) || "{}"
            );
          const savedItem =
            savedProgress[id];
          if (
            savedItem &&
            typeof savedItem ===
              "object"
          ) {
            setSavedChapter(
              Number(
                savedItem.progress ||
                  1
              )
            );
          } else if (
            savedItem !== undefined
          ) {
            setSavedChapter(
              Number(savedItem) || 1
            );
          }
        } catch (error) {
          console.error(
            "Local progress load error:",
            error
          );
        }
      }
    };
    loadProgress();
  }, [type, id]);
  // =====================================================
  // LOAD READER
  // =====================================================
  useEffect(() => {
    const loadReader =
      async () => {
        try {
          setLoading(true);
          setError("");
          setPages([]);
          setExternalUrl("");
          setScanlationGroup("");
          setAvailableChapters([]);
          // -------------------------------------------
          // VALIDATE TYPE
          // -------------------------------------------
          if (
            type !== "manga" &&
            type !== "manhwa"
          ) {
            throw new Error(
              "Invalid reader type."
            );
          }
          // -------------------------------------------
          // LOAD DETAILS
          // -------------------------------------------
          let details;
          if (type === "manga") {
            details =
              await getMangaDetails(
                id
              );
          }
          if (type === "manhwa") {
            details =
              await getManhwaDetails(
                id
              );
          }
          if (!details) {
            throw new Error(
              "Unable to load title details."
            );
          }
          // -------------------------------------------
          // GET TITLE VARIANTS
          // -------------------------------------------
          const titleVariants = [
            details.title?.english,
            details.title?.romaji,
            details.title?.native,
          ].filter(Boolean);
          const readerTitle =
            titleVariants[0] ||
            (type === "manhwa"
              ? "Manhwa"
              : "Manga");
          // Prefer a MANGA Plus title page when one is known, so users
          // can choose from the chapters available on that service.
          const normalizedTitle = [readerTitle, ...titleVariants]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          const isBlueLock = normalizedTitle.includes("blue lock");
          const blueLockMangaPlusUrl =
            "https://mangaplus.shueisha.tv/truyen-tranh/blue-lock-english-version-57-en";
          const externalLinks = Array.isArray(details.externalLinks)
            ? details.externalLinks
            : [];
          const mangaPlusLink = externalLinks.find((link) => {
            const site = String(link?.site || "").toLowerCase();
            const url = String(link?.url || "").toLowerCase();
            return Boolean(link?.url) &&
              (site.includes("manga plus") || url.includes("mangaplus"));
          });
          const blueLockKMangaUrl =
            "https://api.kmanga.kodansha.com/landing?t=10008";
          const getExternalReadingUrl = (chapterUrl = "") => {
            if (isBlueLock) {
              // MANGA Plus lists the later Blue Lock chapters; use K MANGA
              // for earlier chapters, and MANGA Plus for chapter 247 onward.
              return currentChapter < 247
                ? blueLockKMangaUrl
                : blueLockMangaPlusUrl;
            }
            return (
              mangaPlusLink?.url ||
              chapterUrl ||
              externalLinks.find((link) => link?.type === "INFO")?.url ||
              externalLinks.find((link) => Boolean(link?.url))?.url ||
              ""
            );
          };
          console.log(
            "======================================"
          );
          console.log(
            "READER TYPE:",
            type
          );
          console.log(
            "ANILIST ID:",
            id
          );
          console.log(
            "ANILIST TITLE VARIANTS:",
            titleVariants
          );
          console.log(
            "REQUESTED CHAPTER:",
            currentChapter
          );
          console.log(
            "======================================"
          );
          setTitle(readerTitle);
          setImage(
            details.coverImage?.large ||
              ""
          );
          // -------------------------------------------
          // FIND READABLE MANGADEX CHAPTER
          // -------------------------------------------
          const readable =
            await findReadableChapter({
              titles: titleVariants,
              chapterNumber:
                currentChapter,
              language: "en",
              type,
            });
          // -------------------------------------------
          // MANGADEX FOUND PAGES
          // -------------------------------------------
          if (readable) {
if (readable.externalUrl) {
              const readingUrl = getExternalReadingUrl(readable.externalUrl);
              setPages([]);
              setScanlationGroup("");
              setExternalUrl(readingUrl);
              setError("");
              setAvailableChapters(readable.chapters || []);
              if (!readingUrl) {
                setError("No suitable external reading link was found for this title.");
              }
              await saveProgress(
                currentChapter,
                readerTitle,
                details.coverImage?.large || ""
              );
              return;
            }
            console.log(
              "READER SOURCE ACCEPTED:",
              readable.source.name
            );
            console.log(
              "READER RESULT:",
              readable.result
            );
            console.log(
              "READER CHAPTER:",
              readable.chapter
            );
            setPages(
              readable.pages || []
            );
            setExternalUrl("");
            setError("");
            setAvailableChapters(
              readable.chapters || []
            );
            const groupRelationship =
              readable.chapter
                ?.relationships
                ?.find(
                  (relationship) =>
                    relationship.type ===
                    "scanlation_group"
                );
            setScanlationGroup(
              groupRelationship
                ?.attributes?.name ||
                ""
            );
            await saveProgress(
              currentChapter,
              readerTitle,
              details.coverImage?.large ||
                ""
            );
            return;
          }
          // -------------------------------------------
          // NO READABLE MANGADEX CHAPTER
          // -------------------------------------------
          console.warn(
            "NO READABLE MANGADEX CHAPTER:"
          );
          console.warn({
            type,
            id,
            titleVariants,
            chapter:
              currentChapter,
          });
          // -------------------------------------------
          // OFFICIAL EXTERNAL SOURCE
          // -------------------------------------------
const officialUrl = getExternalReadingUrl("");
if (officialUrl) {
  setPages([]);
  setExternalUrl(officialUrl);
  setScanlationGroup("");
  setError(
    `Chapter ${currentChapter} is not available in the in-app reader. Continue on the available reading site.`
  );
  await saveProgress(
    currentChapter,
    readerTitle,
    details.coverImage?.large || ""
  );
  return;
}
throw new Error(
  `Chapter ${currentChapter} has no available pages or external reading link.`
);
        } catch (error) {
          console.error(
            "Reader loading error:",
            error
          );
          setError(
            error.message ||
              "Unable to load this chapter."
          );
        } finally {
          setLoading(false);
        }
      };
    loadReader();
  }, [
    type,
    id,
    currentChapter,
    selectedSource,
  ]);
  // =====================================================
  // SAVE PROGRESS
  // =====================================================
  const saveProgress =
    async (
      newChapter,
      currentTitle = title,
      currentImage = image
    ) => {
      setSavedChapter(
        newChapter
      );
      const user = getUser();
      if (!user) {
        return;
      }
      // -----------------------------------------------
      // MONGODB
      // -----------------------------------------------
      const token =
        localStorage.getItem(
          "otakuhubToken"
        );
      if (token) {
        try {
          const response =
            await fetch(
              "http://localhost:5000/api/auth/progress",
              {
                method: "PUT",
                headers: {
                  "Content-Type":
                    "application/json",
                  Authorization:
                    `Bearer ${token}`,
                },
                body: JSON.stringify({
                  type,
                  id,
                  progress:
                    newChapter,
                  title:
                    currentTitle,
                  image:
                    currentImage,
                }),
              }
            );
if (!response.ok) {
  const errorData = await response
    .json()
    .catch(() => ({}));
  if (response.status === 401) {
    localStorage.removeItem("otakuhubToken");
    console.warn(
      "Session expired. Progress is saved locally. Please log in again to sync with your account."
    );
  } else {
    console.error(
      "MongoDB progress save failed:",
      errorData.message
    );
  }
}
        } catch (error) {
          console.error(
            "MongoDB progress save error:",
            error
          );
        }
      }
      // -----------------------------------------------
      // ACCOUNT-SPECIFIC LOCAL STORAGE
      // -----------------------------------------------
      const userId =
        user._id || user.id;
      const progressKey =
        `${type}Progress_${userId}`;
      try {
        const existingProgress =
          JSON.parse(
            localStorage.getItem(
              progressKey
            ) || "{}"
          );
        existingProgress[id] = {
          progress:
            newChapter,
          title:
            currentTitle,
          image:
            currentImage,
        };
        localStorage.setItem(
          progressKey,
          JSON.stringify(
            existingProgress
          )
        );
      } catch (error) {
        console.error(
          "Local progress save error:",
          error
        );
      }
    };
  // =====================================================
  // FULLSCREEN
  // =====================================================
  const toggleFullscreen =
    async () => {
      try {
        const readerElement =
          document.querySelector(
            ".reader-page"
          );
        if (
          !document.fullscreenElement
        ) {
          if (
            readerElement?.requestFullscreen
          ) {
            await readerElement.requestFullscreen();
          }
        } else {
          await document.exitFullscreen();
        }
      } catch (error) {
        console.error(
          "Fullscreen error:",
          error
        );
      }
    };
  useEffect(() => {
    const handleFullscreenChange =
      () => {
        setIsFullscreen(
          Boolean(
            document.fullscreenElement
          )
        );
      };
    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );
    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);
  // =====================================================
  // AVAILABLE CHAPTER NUMBERS
  // =====================================================
console.log("READER CHAPTER LIST DEBUG:", {
  availableCount: availableChapters.length,
  chapterNumbers: availableChapters.map(
    (item) => item?.attributes?.chapter
  ),
});
const sortedChapterNumbers = [
  ...new Set(
    availableChapters
      .map((item) =>
        Number(item?.attributes?.chapter)
      )
      .filter((number) => Number.isFinite(number))
  ),
].sort((a, b) => a - b);
  // Make sure the current chapter
  // is still represented.
  if (
    !sortedChapterNumbers.includes(
      currentChapter
    )
  ) {
    sortedChapterNumbers.push(
      currentChapter
    );
    sortedChapterNumbers.sort(
      (a, b) => a - b
    );
  }
  // =====================================================
  // PREVIOUS / NEXT
  // =====================================================
  const changeChapter =
    async (direction) => {
      if (
        sortedChapterNumbers.length ===
        0
      ) {
        return;
      }
      const currentIndex =
        sortedChapterNumbers.findIndex(
          (number) =>
            number ===
            currentChapter
        );
      if (
        currentIndex === -1
      ) {
        return;
      }
      const newIndex =
        currentIndex +
        direction;
      if (
        newIndex < 0 ||
        newIndex >=
          sortedChapterNumbers.length
      ) {
        return;
      }
      const nextChapter =
        sortedChapterNumbers[
          newIndex
        ];
      if (
        nextChapter ===
        currentChapter
      ) {
        return;
      }
      navigate(
        `/${type}/${id}/read/${nextChapter}`
      );
    };
  // =====================================================
  // SELECT CHAPTER
  // =====================================================
  const handleChapterChange =
    (event) => {
      const nextChapter =
        Number(
          event.target.value
        );
      if (
        !Number.isFinite(
          nextChapter
        )
      ) {
        return;
      }
      navigate(
        `/${type}/${id}/read/${nextChapter}`
      );
    };
  // =====================================================
  // PATHS
  // =====================================================
  const backPath =
    `/${type}/${id}`;
  const contentName =
    type === "manhwa"
      ? "Manhwa"
      : "Manga";
  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div
      className={`reader-page ${
        readingMode
          ? "reader-reading-mode"
          : ""
      }`}
    >
      {/* =============================================
          HEADER
      ============================================== */}
<div className="reader-source-selector">
  <label htmlFor="reader-source">Reading source:</label>
  <select
    id="reader-source"
    value={selectedSource}
    onChange={(event) => {
      const source = event.target.value;
      setSelectedSource(source);
        if (source === "asura") {
        window.open(
          "https://asurascans.com/",
          "_blank",
          "noopener,noreferrer"
        );
      } else if (source === "comix") {
        window.open(
          "https://comix.to/",
          "_blank",
          "noopener,noreferrer"
        );
      }
    }}
  >
    <option value="mangadex">MangaDex — in-app reader</option>
    <option value="asura">Asura Scans — open website</option>
    <option value="comix">Comix — open website</option>
  </select>
</div>
      {/* =============================================
          CHAPTER CONTROLS
      ============================================== */}
      <div className="chapter-selector">
        <button
          onClick={() =>
            setReadingMode(
              !readingMode
            )
          }
          className="reader-reading-mode-button"
        >
          {readingMode
            ? "☀️ Normal Mode"
            : "🌙 Reading Mode"}
        </button>
        <button
          onClick={
            toggleFullscreen
          }
          className="reader-fullscreen-button"
        >
          {isFullscreen
            ? "⛶ Exit Fullscreen"
            : "⛶ Fullscreen"}
        </button>
        <button
          onClick={() =>
            changeChapter(-1)
          }
          disabled={
            loading ||
            sortedChapterNumbers.length ===
              0 ||
            sortedChapterNumbers.findIndex(
              (number) =>
                number ===
                currentChapter
            ) <= 0
          }
        >
          ← Previous
        </button>
        {sortedChapterNumbers.length >
          0 && (
          <select
            value={currentChapter}
            onChange={
              handleChapterChange
            }
          >
            {sortedChapterNumbers.map(
              (number) => (
                <option
                  key={number}
                  value={number}
                >
                  Chapter {number}
                </option>
              )
            )}
          </select>
        )}
        <button
          onClick={() =>
            changeChapter(1)
          }
          disabled={
            loading ||
            sortedChapterNumbers.length ===
              0 ||
            sortedChapterNumbers.findIndex(
              (number) =>
                number ===
                currentChapter
            ) ===
              sortedChapterNumbers.length -
                1
          }
        >
          Next →
        </button>
      </div>
      {/* =============================================
          READER CONTENT
      ============================================== */}
      <div className="reader-content">
        {/* LOADING */}
        {loading && (
          <div className="reader-page-placeholder">
            <div
              style={{
                fontSize: "40px",
                marginBottom:
                  "15px",
              }}
            >
              📚
            </div>
            <h2>
              Loading Chapter...
            </h2>
            <p>
              Checking the correct{" "}
              {contentName.toLowerCase()}{" "}
              source.
            </p>
          </div>
        )}
        {/* EXTERNAL SOURCE */}
{/* OFFICIAL EXTERNAL CHAPTER SOURCE */}
{!loading && externalUrl && (
  <div className="reader-page-placeholder">
    {image && (
      <img
        src={image}
        alt={title}
        style={{
          width: "160px",
          maxHeight: "230px",
          objectFit: "cover",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      />
    )}
    <h2>{title}</h2>
    <p>Chapter {currentChapter} is available from an external source.</p>
    <p>
      This chapter cannot be displayed inside OtakuHub unless readable
      chapter pages are available from the source.
    </p>
    <a
      href={externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="read-btn"
    >
      📖 Open Official Chapter
    </a>
    <div style={{ marginTop: "16px" }}>
      <Link to={backPath} className="read-btn">
        📚 Back to {contentName}
      </Link>
    </div>
  </div>
)}
        {/* ERROR WITHOUT EXTERNAL SOURCE */}
        {!loading &&
          error &&
          !externalUrl && (
            <div className="reader-page-placeholder">
              {image && (
                <img
                  src={image}
                  alt={title}
                  style={{
                    width: "160px",
                    maxHeight:
                      "230px",
                    objectFit:
                      "cover",
                    borderRadius:
                      "8px",
                    marginBottom:
                      "20px",
                  }}
                />
              )}
              <div
                style={{
                  fontSize:
                    "40px",
                  marginBottom:
                    "10px",
                }}
              >
                ⚠️
              </div>
              <h2>
                Chapter Unavailable
              </h2>
              <p>
                {error}
              </p>
              <Link
                to={backPath}
                className="read-btn"
              >
                📚 Back to{" "}
                {contentName}
              </Link>
            </div>
          )}
        {/* MANGADEX PAGES */}
        {!loading &&
          !error &&
          pages.length > 0 && (
            <div
              className="reader-pages"
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                alignItems:
                  "center",
                gap: "8px",
                width: "100%",
              }}
            >
              {pages.map(
                (
                  pageUrl,
                  index
                ) => (
                  <img
                    key={`${pageUrl}-${index}`}
                    src={pageUrl}
                    alt={`${title} Chapter ${currentChapter} Page ${index + 1}`}
                    loading={
                      index < 2
                        ? "eager"
                        : "lazy"
                    }
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      maxWidth:
                        "900px",
                      height:
                        "auto",
                    }}
                  />
                )
              )}
              <div
                style={{
                  width:
                    "100%",
                  maxWidth:
                    "900px",
                  padding:
                    "24px 16px",
                  textAlign:
                    "center",
                  fontSize:
                    "12px",
                  opacity:
                    0.65,
                  lineHeight:
                    1.6,
                }}
              >
                <div>
                  📚 Pages provided
                  through MangaDex
                </div>
                {scanlationGroup && (
                  <div>
                    Scanlation:{" "}
                    {
                      scanlationGroup
                    }
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
      {/* =============================================
          BOTTOM NAVIGATION
      ============================================== */}
      <div className="reader-navigation">
        <button
          onClick={() =>
            changeChapter(-1)
          }
          disabled={
            loading ||
            sortedChapterNumbers.findIndex(
              (number) =>
                number ===
                currentChapter
            ) <= 0
          }
        >
          ← Previous Chapter
        </button>
        <div className="reader-progress">
          📍 Chapter{" "}
          {currentChapter}
        </div>
        <button
          onClick={() =>
            changeChapter(1)
          }
          disabled={
            loading ||
            sortedChapterNumbers.findIndex(
              (number) =>
                number ===
                currentChapter
            ) ===
              sortedChapterNumbers.length -
                1
          }
        >
          Next Chapter →
        </button>
      </div>
    </div>
  );
}
export default Reader;
