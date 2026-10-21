
import {
  searchMangaDex,
  getMangaDexChapters,
  getMangaDexChapterPages,
} from "../mangaDexSource";

/* Original Blue Lock manga ID */
const ORIGINAL_BLUE_LOCK_ID =
  "4141c5dc-c525-4df5-afd7-cc7d192a832f";

/* Normalize titles for matching */
const normalizeTitle = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

/* Get primary and alternative titles */
const getMangaTitles = (manga) => {
  const attributes = manga?.attributes || {};

  return [
    ...Object.values(attributes.title || {}),
    ...(attributes.altTitles || []).flatMap((item) =>
      Object.values(item || {})
    ),
  ].filter(Boolean);
};

/* Parse chapter numbers, including decimals */
const parseChapterNumber = (value) => {
  if (value == null || String(value).trim() === "") {
    return null;
  }

  const match = String(value)
    .trim()
    .match(/^(\d+(?:\.\d+)?)/);

  if (!match) return null;

  const number = Number(match[1]);
  return Number.isFinite(number) ? number : null;
};

/* Preserve original Blue Lock handling */
const isBlueLockRequest = (titles) =>
  titles.some((title) => {
    const normalized = normalizeTitle(title);

    return (
      normalized === "blue lock" ||
      normalized === "blue lock manga"
    );
  });

/* Score title similarity */
const scoreTitle = (requestedTitles, manga) => {
  if (!manga?.attributes) return 0;

  const candidates = getMangaTitles(manga).map(normalizeTitle);
  let bestScore = 0;

  for (const requested of requestedTitles) {
    const target = normalizeTitle(requested);
    if (!target) continue;

    for (const candidate of candidates) {
      if (!candidate) continue;

      if (candidate === target) {
        bestScore = Math.max(bestScore, 100);
      } else if (
        candidate.includes(target) ||
        target.includes(candidate)
      ) {
        bestScore = Math.max(bestScore, 80);
      } else {
        const targetWords = new Set(target.split(" "));
        const candidateWords = new Set(candidate.split(" "));

        const common = [...targetWords].filter((word) =>
          candidateWords.has(word)
        ).length;

        const similarity =
          common /
          Math.max(targetWords.size, candidateWords.size, 1);

        if (similarity >= 0.8) {
          bestScore = Math.max(bestScore, 90);
        }
      }
    }
  }

  return bestScore;
};

/* Reject editions of the wrong manga/manhwa format */
const hasWrongFormat = (manga, requestedType) => {
  const tags = manga?.attributes?.tags || [];

  const formatTags = tags
    .map((tag) =>
      normalizeTitle(
        tag.attributes?.name?.en ||
          Object.values(tag.attributes?.name || {})[0] ||
          ""
      )
    )
    .filter(Boolean);

  const isManhwa = formatTags.some((tag) =>
    ["manhwa", "korean", "webtoon"].some((word) =>
      tag.includes(word)
    )
  );

  const isManga = formatTags.some((tag) =>
    ["manga", "japanese"].some((word) => tag.includes(word))
  );

  if (requestedType === "manhwa" && isManga && !isManhwa) {
    return true;
  }

  if (requestedType === "manga" && isManhwa && !isManga) {
    return true;
  }

  return false;
};

/* Reject known My Hero Academia spin-offs and doujinshi */
const isUnwantedEdition = (manga) => {
  const primaryTitles = Object.values(
    manga?.attributes?.title || {}
  ).map(normalizeTitle);

  const unwantedPatterns = [
    "team up mission",
    "rondo of opalus",
    "vigilantes",
    "smash",
    "special spin off",
    "special spinoff",
  ];

  const hasUnwantedTitle = primaryTitles.some((title) =>
    unwantedPatterns.some((pattern) =>
      title.includes(pattern)
    )
  );

  const hasDoujinshiTag = (
    manga?.attributes?.tags || []
  ).some((tag) =>
    Object.values(tag.attributes?.name || {}).some(
      (name) => normalizeTitle(name).includes("doujinshi")
    )
  );

  return hasUnwantedTitle || hasDoujinshiTag;
};

/* MangaDex source adapter */
const mangaDexSource = {
  id: "mangadex",
  name: "MangaDex",

  search: async (title) => {
    try {
      const response = await searchMangaDex(title);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error("MangaDex search failed:", title, error);
      return [];
    }
  },

  getChapters: async (mangaId, language = "en") => {
    try {
      const response = await getMangaDexChapters(
        mangaId,
        language
      );

      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error(
        "MangaDex chapter request failed:",
        mangaId,
        error
      );
      return [];
    }
  },

  getPages: async (chapterId) => {
    try {
      const response = await getMangaDexChapterPages(chapterId);

      return Array.isArray(response?.pages)
        ? response.pages
        : [];
    } catch (error) {
      console.error(
        "MangaDex page request failed:",
        chapterId,
        error
      );

      return [];
    }
  },
};

const sources = [mangaDexSource];

/* Search all configured sources */
export const searchSources = async (title) => {
  const results = [];

  for (const source of sources) {
    try {
      const response = await source.search(title);
      const matches = Array.isArray(response) ? response : [];

      results.push(
        ...matches
          .filter((manga) => manga?.id)
          .map((manga) => ({
            ...manga,
            sourceId: source.id,
            sourceName: source.name,
          }))
      );
    } catch (error) {
      console.error(
        `Source search failed: ${source.name}`,
        error
      );
    }
  }

  return results;
};

/* Find a readable chapter and return its chapter list */
export const findReadableChapter = async ({
  titles = [],
  chapterNumber,
  language = "en",
  type = "manga",
}) => {
  const requestedChapter = parseChapterNumber(chapterNumber);

  const requestedTitles = [
    ...new Set(
      (Array.isArray(titles) ? titles : [titles])
        .filter(Boolean)
        .map((title) => String(title).trim())
        .filter(Boolean)
    ),
  ];

  const originalBlueLockOnly =
    isBlueLockRequest(requestedTitles);

  if (
    requestedChapter === null ||
    requestedTitles.length === 0
  ) {
    console.warn("Missing title or invalid chapter number.");
    return null;
  }

  const uniqueManga = new Map();

  /* Search every requested title */
  for (const title of requestedTitles) {
    for (const source of sources) {
      try {
        const response = await source.search(title);
        const results = Array.isArray(response)
          ? response
          : [];

        console.log("SEARCH SUMMARY:", {
          source: source.name,
          title,
          resultCount: results.length,
        });

        for (const manga of results) {
          if (manga?.id && manga.attributes) {
            uniqueManga.set(`${source.id}:${manga.id}`, {
              manga,
              source,
            });
          }
        }
      } catch (error) {
        console.error(
          `Search failed for "${title}"`,
          error
        );
      }
    }
  }

  /* Always use the original Blue Lock entry */
  if (originalBlueLockOnly) {
    try {
      const response = await fetch(
        `https://api.mangadex.org/manga/${ORIGINAL_BLUE_LOCK_ID}`
      );

      if (!response.ok) {
        throw new Error(
          `MangaDex returned HTTP ${response.status}`
        );
      }

      const data = await response.json();
      const originalManga = data?.data;

      if (
        originalManga?.id === ORIGINAL_BLUE_LOCK_ID &&
        originalManga.attributes
      ) {
        uniqueManga.set(
          `mangadex:${ORIGINAL_BLUE_LOCK_ID}`,
          {
            manga: originalManga,
            source: mangaDexSource,
          }
        );
      }
    } catch (error) {
      console.error(
        "Could not fetch original Blue Lock:",
        error
      );
    }
  }

  /* Filter and rank editions */
  const candidates = [...uniqueManga.values()]
    .filter(({ manga }) => manga?.attributes)
    .map(({ manga, source }) => ({
      manga,
      source,
      score: scoreTitle(requestedTitles, manga),
    }))
    .filter(({ manga }) => {
      if (originalBlueLockOnly) {
        return manga.id === ORIGINAL_BLUE_LOCK_ID;
      }

      const primaryTitles = Object.values(
        manga.attributes?.title || {}
      ).map(normalizeTitle);

      const requested = requestedTitles.map(normalizeTitle);

      const exactPrimaryTitleMatch = requested.some(
        (title) => primaryTitles.includes(title)
      );

      return (
        exactPrimaryTitleMatch &&
        !isUnwantedEdition(manga) &&
        !hasWrongFormat(manga, type)
      );
    })
    .sort((a, b) => b.score - a.score);
    console.table(
  candidates.map(({ manga, score }) => ({
    id: manga.id,
    title: Object.values(
      manga.attributes?.title || {}
    ).join(" | "),
    lastChapter: manga.attributes?.lastChapter,
    score,
  }))
);


let bestReadable = null;
let bestReadableScore = -1;
let bestChapterCount = -1;
let externalFallback = null;
let externalFallbackScore = -1;
let externalFallbackChapterCount = -1;


  /* Check each matching edition */
  for (const candidate of candidates) {
    const { manga, source, score } = candidate;

    if (
      originalBlueLockOnly &&
      manga.id !== ORIGINAL_BLUE_LOCK_ID
    ) {
      continue;
    }

    let chapterResponse = [];

    try {
      chapterResponse = await source.getChapters(
        manga.id,
        language
      );
    } catch (error) {
      console.error(
        "Could not retrieve chapter list:",
        manga.id,
        error
      );
      continue;
    }

    const chapters = Array.isArray(chapterResponse)
      ? chapterResponse
      : [];

    const languageChapters = chapters
      .filter((item) => {
        const attributes = item?.attributes || {};
        const number = parseChapterNumber(
          attributes.chapter
        );

        return (
          number !== null &&
          (!attributes.translatedLanguage ||
            attributes.translatedLanguage === language)
        );
      })
      .sort(
        (a, b) =>
          parseChapterNumber(a.attributes?.chapter) -
          parseChapterNumber(b.attributes?.chapter)
      );

    console.log("CHAPTER FETCH DEBUG:", {
      allTitles: getMangaTitles(manga),
      mangaId: manga.id,
      mangaTitle: Object.values(
        manga.attributes?.title || {}
        
      ),
      fetchedCount: chapters.length,
      validChapterCount: languageChapters.length,
      chapterNumbers: languageChapters.map(
        (item) => item.attributes?.chapter
      ),
      lastChapter: manga.attributes?.lastChapter,
    });

    const matchingChapters = languageChapters.filter(
      (chapter) =>
        parseChapterNumber(chapter.attributes?.chapter) ===
        requestedChapter
    );

    /* Prefer chapters hosted by MangaDex */
    for (const chapter of matchingChapters) {
      if (chapter.attributes?.externalUrl) {
        continue;
      }

      let pages = [];

      try {
        pages = await source.getPages(chapter.id);
      } catch (error) {
        console.warn(
          "Chapter page request failed:",
          chapter.id,
          error
        );
        continue;
      }

      if (!Array.isArray(pages) || pages.length === 0) {
        continue;
      }

      const groupRelationship =
        chapter.relationships?.find(
          (relationship) =>
            relationship.type === "scanlation_group"
        );

      const readableCandidate = {
        mangaId: manga.id,
        chapterId: chapter.id,
        chapterNumber:
          chapter.attributes?.chapter ??
          String(requestedChapter),
        chapterTitle: chapter.attributes?.title || "",
        pages,
        scanlationGroup:
          groupRelationship?.attributes?.name || null,
        sourceName: source.name,
        source,
        result: manga,
        chapter,
        externalUrl: "",
        chapters: languageChapters.filter(
          (item) => !item.attributes?.externalUrl
        ),
      };

      const chapterCount =
        readableCandidate.chapters.length;

      if (
        !bestReadable ||
        score > bestReadableScore ||
        (score === bestReadableScore &&
          chapterCount > bestChapterCount)
      ) {
        bestReadable = readableCandidate;
        bestReadableScore = score;
        bestChapterCount = chapterCount;
      }

      break;
    }

    /* Remember an external URL if no hosted edition works */
   
/* Keep the best external fallback, not just the first one */
const externalChapter = matchingChapters.find(
  (chapter) => Boolean(chapter.attributes?.externalUrl)
);

const externalChapterCount = languageChapters.length;

if (
  externalChapter &&
  (
    !externalFallback ||
    score > externalFallbackScore ||
    (
      score === externalFallbackScore &&
      externalChapterCount > externalFallbackChapterCount
    )
  )
) {
  externalFallback = {
    mangaId: manga.id,
    chapterId: externalChapter.id,
    chapterNumber:
      externalChapter.attributes?.chapter ??
      String(requestedChapter),
    chapterTitle:
      externalChapter.attributes?.title || "",
    pages: [],
    scanlationGroup: null,
    sourceName: source.name,
    source,
    result: manga,
    chapter: externalChapter,
    externalUrl: externalChapter.attributes.externalUrl,
    chapters: languageChapters,
  };

  externalFallbackScore = score;
  externalFallbackChapterCount = externalChapterCount;
}

  }

  if (bestReadable) {
    console.log("BEST READABLE EDITION SELECTED:", {
      mangaId: bestReadable.mangaId,
      title: Object.values(
        bestReadable.result.attributes?.title || {}
      ),
      chapterCount: bestReadable.chapters.length,
      chapterNumbers: bestReadable.chapters.map(
        (item) => item.attributes?.chapter
      ),
    });

    return bestReadable;
  }

  if (externalFallback) {
    console.log(
      "USING EXTERNAL FALLBACK:",
      externalFallback.externalUrl
    );

    return externalFallback;
  }

  console.warn("NO READABLE CHAPTER FOUND:", {
    titles: requestedTitles,
    chapter: requestedChapter,
    type,
    originalBlueLockOnly,
  });

  return null;
};

export default {
  searchSources,
  findReadableChapter,
};
