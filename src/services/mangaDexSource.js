
import axios from "axios";

const mangaDexApi = axios.create({
  baseURL: "https://api.mangadex.org",
});

/* =====================================================
   SEARCH MANGADEX
===================================================== */

export const searchMangaDex = async (title) => {
  try {
    const response = await mangaDexApi.get("/manga", {
      params: {
        title: title.trim(),
        limit: 100,
        "order[relevance]": "desc",
      },
    });

    const results = Array.isArray(response.data?.data)
      ? response.data.data
      : [];

    console.log("MANGADEX SEARCH TITLE:", title);
    console.log("MANGADEX RESULTS FOUND:", results.length);

    
console.table(
  results.map((manga) => ({
    id: manga.id,
    title: Object.values(
      manga.attributes?.title || {}
    ).join(" | "),
    alternativeTitles: (
      manga.attributes?.altTitles || []
    )
      .flatMap((item) => Object.values(item || {}))
      .join(" | "),
    originalLanguage:
      manga.attributes?.originalLanguage,
    year: manga.attributes?.year,
    status: manga.attributes?.status,
    lastChapter: manga.attributes?.lastChapter,
    officialEnglishLink:
      manga.attributes?.links?.engtl || "",
    myAnimeListId:
      manga.attributes?.links?.mal || "",
  }))
);


    // IMPORTANT: Return the results to sourceManager.js.
    return results;
  } catch (error) {
    console.error(
      "MangaDex search error:",
      title,
      error.response?.data || error.message
    );

    return [];
  }
};

/* =====================================================
   GET CHAPTERS
===================================================== */



export const getMangaDexChapters = async (
  mangaId,
  language = "en"
) => {
  try {
    const allChapters = [];
    const limit = 100;
    let offset = 0;
    let total = 0;

    do {
      const response = await mangaDexApi.get(
        `/manga/${mangaId}/feed`,
        {
          params: {
            limit,
            offset,
            "order[chapter]": "asc",
            "includes[]": "scanlation_group",
          },
        }
      );

      const data = response.data;
      const chapters = Array.isArray(data?.data)
        ? data.data
        : [];

      allChapters.push(...chapters);
      total = data?.total ?? allChapters.length;
      offset += chapters.length;

      console.log("MANGADEX FEED PAGE:", {
        mangaId,
        offset,
        received: chapters.length,
        total,
      });

      if (chapters.length === 0) break;
    } while (offset < total);

    // Filter locally so we can inspect all language variants.
    const filteredChapters = allChapters.filter(
      (chapter) =>
        chapter.attributes?.translatedLanguage === language
    );

    console.log("MANGADEX TOTAL CHAPTERS:", {
      mangaId,
      allLanguages: allChapters.length,
      selectedLanguage: language,
      selectedCount: filteredChapters.length,
    });

    return filteredChapters;
  } catch (error) {
    console.error(
      "MangaDex chapters error:",
      mangaId,
      error.response?.data || error.message
    );

    return [];
  }
};



/* =====================================================
   GET CHAPTER PAGES
===================================================== */

export const getMangaDexChapterPages = async (
  chapterId
) => {
  try {
    console.log("MANGADEX AT-HOME REQUEST:", chapterId);

    const response = await mangaDexApi.get(
      `/at-home/server/${chapterId}`
    );

    const data = response.data;

    console.log("MANGADEX AT-HOME RESPONSE:", data);

    if (!data) {
      console.warn("MANGADEX RETURNED EMPTY RESPONSE.");

      return { pages: [] };
    }

    console.log("AT-HOME RESULT:", data.result);
    console.log("AT-HOME BASE URL:", data.baseUrl);
    console.log("AT-HOME CHAPTER:", data.chapter);

    if (
      !data.chapter ||
      typeof data.chapter !== "object"
    ) {
      console.warn(
        "MANGADEX DID NOT RETURN CHAPTER OBJECT."
      );

      return {
        ...data,
        pages: [],
      };
    }

    console.log("CHAPTER KEYS:", Object.keys(data.chapter));

    const hash = data.chapter.hash;

    console.log("CHAPTER HASH:", hash);

    const normalFiles = Array.isArray(data.chapter.data)
      ? data.chapter.data
      : [];

    console.log("NORMAL PAGE FILES:", normalFiles);

    const dataSaverFiles = Array.isArray(
      data.chapter.dataSaver
    )
      ? data.chapter.dataSaver
      : [];

    console.log("DATA SAVER FILES:", dataSaverFiles);

    if (!hash) {
      console.warn("MANGADEX CHAPTER HAS NO HASH.");

      return {
        ...data,
        pages: [],
      };
    }

    let filenames = normalFiles;
    let folder = "data";

    if (filenames.length === 0) {
      filenames = dataSaverFiles;
      folder = "data-saver";
    }

    if (filenames.length === 0) {
      console.warn("MANGADEX CHAPTER HAS NO PAGE FILES.");

      return {
        ...data,
        pages: [],
      };
    }

    if (!data.baseUrl) {
      console.warn("MANGADEX DID NOT RETURN BASE URL.");

      return {
        ...data,
        pages: [],
      };
    }

    const baseUrl = data.baseUrl;

    const pages = filenames.map(
      (filename) =>
        `${baseUrl}/${folder}/${hash}/${filename}`
    );

    console.log("MANGADEX PAGE MODE:", folder);
    console.log("MANGADEX PAGE COUNT:", pages.length);
    console.log("MANGADEX PAGES:", pages);

    return {
      ...data,
      pages,
    };
  } catch (error) {
    console.error(
      "MangaDex chapter pages error:",
      error.response?.data || error.message
    );

    return {
      pages: [],
      error: error.response?.data || error.message,
    };
  }
};
