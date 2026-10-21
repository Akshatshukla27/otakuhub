
import axios from "axios";

const mangaDexApi = axios.create({
  baseURL: "https://api.mangadex.org",
  timeout: 20000,
});

/* =====================================================
   SEARCH MANGADEX
===================================================== */


export const searchMangaDex = async (title) => {
  try {
    console.log("SEARCH TEST V2 - UPDATED FILE RUNNING");
    const response = await mangaDexApi.get("/manga", {
      params: {
        title,
        limit: 20,
        "order[relevance]": "desc",
        "availableTranslatedLanguage[]": ["en"],
        "includes[]": ["cover_art"],
      },
    });

    const results = response.data?.data || [];

    console.log("MANGADEX SEARCH TITLE:", title);
    console.log("ENGLISH-AVAILABLE RESULTS:", results.length);

    console.table(
      results.map((manga) => ({
        id: manga.id,
        title: Object.values(
          manga.attributes?.title || {}
        ).join(" / "),
        status: manga.attributes?.status,
      }))
    );

    return results;
  } catch (error) {
    console.error(
      "MangaDex search error:",
      error.response?.data || error.message
    );

    return [];
  }
};

/* =====================================================
   GET CHAPTERS
   Fetches up to 500 chapters in batches of 100.
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

    console.log("MANGADEX FEED REQUEST:", {
      mangaId,
      language,
    });

    do {
      const response = await mangaDexApi.get(
        `/manga/${mangaId}/feed`,
        {
          params: {
            limit,
            offset,
            "translatedLanguage[]": language,
            "order[chapter]": "asc",
            "includes[]": "scanlation_group",
          },
        }
      );

      const data = response.data;
      const chapters = data?.data || [];

      total = data?.total ?? allChapters.length + chapters.length;

      console.log("MANGADEX FEED RESPONSE:", {
        mangaId,
        status: response.status,
        total: data?.total,
        offset,
        returned: chapters.length,
        language,
        errors: data?.errors || [],
      });

      allChapters.push(...chapters);

      if (chapters.length === 0) {
        break;
      }

      offset += chapters.length;

      // Avoid excessive requests.
      if (allChapters.length >= 500) {
        break;
      }
    } while (offset < total);

    console.log("MANGADEX TOTAL CHAPTERS:", total);
    console.log("MANGADEX OFFSET:", offset);
    console.log("EN CHAPTERS FETCHED:", allChapters.length);

    return allChapters;
  } catch (error) {
    console.error("MangaDex chapters error:", {
      mangaId,
      language,
      status: error.response?.status,
      response: error.response?.data,
      message: error.message,
    });

    return [];
  }
};

/* =====================================================
   GET CHAPTER PAGES
===================================================== */

export const getMangaDexChapterPages = async (chapterId) => {
  try {
    console.log("MANGADEX AT-HOME REQUEST:", chapterId);

    const response = await mangaDexApi.get(
      `/at-home/server/${chapterId}`
    );

    const data = response.data;

    console.log("MANGADEX AT-HOME RESPONSE:", {
      result: data?.result,
      baseUrl: data?.baseUrl,
      chapterId,
    });

    if (!data?.chapter || !data.baseUrl) {
      console.warn("MANGADEX CHAPTER DATA OR BASE URL MISSING.");

      return {
        ...data,
        pages: [],
      };
    }

    const hash = data.chapter.hash;
    const normalFiles = Array.isArray(data.chapter.data)
      ? data.chapter.data
      : [];
    const dataSaverFiles = Array.isArray(data.chapter.dataSaver)
      ? data.chapter.dataSaver
      : [];

    let filenames = normalFiles;
    let folder = "data";

    if (filenames.length === 0) {
      filenames = dataSaverFiles;
      folder = "data-saver";
    }

    if (!hash || filenames.length === 0) {
      console.warn("MANGADEX CHAPTER HAS NO PAGE FILES:", {
        chapterId,
        hash,
        normalPageCount: normalFiles.length,
        dataSaverPageCount: dataSaverFiles.length,
      });

      return {
        ...data,
        pages: [],
      };
    }

    const pages = filenames.map(
      (filename) =>
        `${data.baseUrl}/${folder}/${hash}/${filename}`
    );

    console.log("MANGADEX PAGE MODE:", folder);
    console.log("MANGADEX PAGE COUNT:", pages.length);

    return {
      ...data,
      pages,
    };
  } catch (error) {
    console.error("MangaDex chapter pages error:", {
      chapterId,
      status: error.response?.status,
      response: error.response?.data,
      message: error.message,
    });

    return {
      pages: [],
      error: error.response?.data || error.message,
    };
  }
};
