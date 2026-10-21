import axios from "axios";


/* =========================================================
   ANILIST CONFIG
========================================================= */

const ANILIST_URL =
  "https://graphql.anilist.co";


/* =========================================================
   CACHE
========================================================= */

const ANILIST_CACHE_TIME =
  30 * 1000; // 30 seconds

const anilistCache =
  new Map();

/* =========================================================
   ACTIVE REQUESTS
   Prevents duplicate simultaneous requests.
========================================================= */

const anilistPendingRequests =
  new Map();

/* =========================================================
   ANILIST REQUEST
   - Cache
   - Duplicate request protection
   - 429 retry
   - Timeout
========================================================= */

const anilistRequest = async (
  query,
  variables = {}
) => {

  const cacheKey =
    JSON.stringify({
      query,
      variables,
    });

  /* =====================================================
     CACHE CHECK
  ===================================================== */

  const cachedRequest =
    anilistCache.get(
      cacheKey
    );

  if (
    cachedRequest &&
    Date.now() -
      cachedRequest.timestamp <
      ANILIST_CACHE_TIME
  ) {

    console.log(
      "AniList cache hit."
    );

    return cachedRequest.data;
  }

  /* =====================================================
     DUPLICATE REQUEST CHECK
  ===================================================== */

  if (
    anilistPendingRequests.has(
      cacheKey
    )
  ) {

    console.log(
      "Reusing existing AniList request."
    );

    return anilistPendingRequests.get(
      cacheKey
    );
  }

  /* =====================================================
     CREATE REQUEST
  ===================================================== */

  const requestPromise =
    (async () => {
      let attempt = 0;
      const maxRetries = 2;
      while (
        attempt <= maxRetries
      ) {
        try {
          console.log(
            `AniList request attempt ${
              attempt + 1
            }`
          );
          const response =
            await axios.post(
              ANILIST_URL,
              {
                query,
                variables,
              },
              {
                headers: {
                  "Content-Type":
                    "application/json",

                  Accept:
                    "application/json",
                },

                timeout: 15000,
              }
            );


          /* ===========================================
             GRAPHQL ERROR
          =========================================== */

          if (
            response.data?.errors
          ) {

            console.error(
              "AniList GraphQL error:",
              response.data.errors
            );
            throw new Error(
              "AniList request failed."
            );
          }
          const result =
            response.data?.data;
          /* ===========================================
             SAVE TO CACHE
          =========================================== */

          anilistCache.set(
            cacheKey,
            {
              data: result,
              timestamp:
                Date.now(),
            }
          );
          return result;
        } catch (error) {
          const status =
            error.response?.status;
          /* ===========================================
             RATE LIMIT 429
          =========================================== */

          if (
            status === 429 &&
            attempt < maxRetries
          ) {

            let waitTime =
              5000 *
              Math.pow(
                2,
                attempt
              );
            const retryAfter =
              error.response
                ?.headers
                ?.["retry-after"];
            if (retryAfter) {

              const retrySeconds =
                Number(
                  retryAfter
                );
              if (
                Number.isFinite(
                  retrySeconds
                )
              ) {
                waitTime =
                  Math.max(
                    retrySeconds *
                      1000,
                    1000
                  );
              }
            }
            console.warn(
              `AniList rate limit reached. Retrying in ${Math.ceil(
                waitTime / 1000
              )} seconds...`
            );
            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  waitTime
                )
            );

            attempt++;
            continue;
          }
          /* ===========================================
             OTHER ERROR
          =========================================== */

          console.error(
            "AniList request error:",
            error.response?.data ||
              error.message
          );
          throw error;
        }
      }
    })();
  anilistPendingRequests.set(
    cacheKey,
    requestPromise
  );
  try {
    return await requestPromise;
  } finally {
    anilistPendingRequests.delete(
      cacheKey
    );
  }
};
/* =========================================================
   ANIME MAPPER
========================================================= */

const mapAnime = (
  anime
) => {

  if (!anime) {
    return null;
  }
  const image =
    anime.coverImage?.extraLarge ||
    anime.coverImage?.large ||
    anime.coverImage?.medium ||
    "";
  return {
    mal_id:
      anime.idMal ||
      anime.id,
    title:
      anime.title?.english ||
      anime.title?.romaji ||
      anime.title?.native ||
      "Unknown Anime",
    images: {
      jpg: {
        image_url:
          image,
        large_image_url:
          image,
      },
    },
    score:
      anime.averageScore
        ? anime.averageScore / 10
        : null,
    type:
      anime.format ||
      "Anime",
    episodes:
      anime.episodes ||
      null,
    status:
      anime.status ||
      null,
    synopsis:
      anime.description
        ? anime.description
            .replace(
              /<br\s*\/?>/gi,
              "\n"
            )
            .replace(
              /<[^>]*>/g,
              ""
            )
        : "",
    duration:
      anime.duration
        ? `${anime.duration} min per episode`
        : null,

    year:
      anime.startDate?.year ||
      null,
    aired: {

      from:
        anime.startDate?.year
          ? `${anime.startDate.year}-${String(
              anime.startDate.month ||
                1
            ).padStart(
              2,
              "0"
            )}-${String(
              anime.startDate.day ||
                1
            ).padStart(
              2,
              "0"
            )}`
          : null,
    },
    genres:
      (anime.genres || []).map(
        (
          genre,
          index
        ) => ({

          mal_id:
            index + 1,

          name:
            genre,

        })
      ),

    studios:
      anime.studios?.nodes ||
      [],
    source:
      anime.source ||
      null,
    season:
      anime.season ||
      null,
    season_year:
      anime.seasonYear ||
      null,
    popularity:
      anime.popularity ||
      null,
    members:
      anime.popularity ||
      null,
    rating:
      anime.isAdult
        ? "R+"
        : null,
    trailer:
      null,
  };
};

/* =========================================================
   ANIME GRAPHQL FIELDS
========================================================= */

const ANIME_FIELDS = `
  id
  idMal

  title {
    romaji
    english
    native
  }

  coverImage {
    large
    extraLarge
    medium
  }

  averageScore
  format
  status
  episodes
  duration
  description

  startDate {
    year
    month
    day
  }

  genres

  studios {
    nodes {
      id
      name
    }
  }

  source
  season
  seasonYear
  popularity
  isAdult
`;


/* =========================================================
   TOP ANIME
========================================================= */

export const getTopAnime =
  async (
    page = 1
  ) => {

    const graphqlQuery = `
      query ($page: Int) {

        Page(
          page: $page
          perPage: 20
        ) {

          media(
            type: ANIME
            sort: SCORE_DESC
            isAdult: false
          ) {

            ${ANIME_FIELDS}

          }

        }

      }
    `;


    const data =
      await anilistRequest(
        graphqlQuery,
        {
          page,
        }
      );


    return (
      data?.Page?.media ||
      []
    ).map(
      mapAnime
    );

  };
/* =========================================================
   🔥 TRENDING CONTENT
========================================================= */

const getAllTrending = async () => {
  const graphqlQuery = `
    query {

      animeTrending: Page(
        page: 1
        perPage: 8
      ) {
        media(
          type: ANIME
          sort: TRENDING_DESC
          isAdult: false
        ) {
          id
          idMal

          title {
            romaji
            english
            native
          }

          coverImage {
            large
            extraLarge
          }

          averageScore
        }
      }

      mangaTrending: Page(
        page: 1
        perPage: 8
      ) {
        media(
          type: MANGA
          countryOfOrigin: JP
          sort: TRENDING_DESC
        ) {
          id

          title {
            romaji
            english
            native
          }

          coverImage {
            large
          }

          averageScore
        }
      }

      manhwaTrending: Page(
        page: 1
        perPage: 8
      ) {
        media(
          type: MANGA
          countryOfOrigin: KR
          sort: TRENDING_DESC
        ) {
          id

          title {
            romaji
            english
            native
          }

          coverImage {
            large
          }

          averageScore
        }
      }

    }
  `;

  return await anilistRequest(graphqlQuery);
};


/* =========================================================
   🔥 TRENDING ANIME
========================================================= */

export const getTrendingAnime = async () => {
  try {
    const data = await getAllTrending();

    return (
      data?.animeTrending?.media || []
    ).map(mapAnime);

  } catch (error) {
    console.error("Trending Anime error:", error);
    return [];
  }
};


/* =========================================================
   🔥 TRENDING MANGA
========================================================= */

export const getTrendingManga = async () => {
  try {
    const data = await getAllTrending();

    return data?.mangaTrending?.media || [];

  } catch (error) {
    console.error("Trending Manga error:", error);
    return [];
  }
};


/* =========================================================
   🔥 TRENDING MANHWA
========================================================= */

export const getTrendingManhwa = async () => {
  try {
    const data = await getAllTrending();

    return data?.manhwaTrending?.media || [];

  } catch (error) {
    console.error("Trending Manhwa error:", error);
    return [];
  }
};

/* =========================================================
   SEARCH ANIME
========================================================= */

export const searchAnime =
  async (
    query
  ) => {

    const graphqlQuery = `
      query ($search: String) {

        Page(
          page: 1
          perPage: 20
        ) {

          media(
            type: ANIME
            search: $search
            isAdult: false
            sort: SEARCH_MATCH
          ) {
            ${ANIME_FIELDS}
          }
        }
      }
    `;
    const data =
      await anilistRequest(
        graphqlQuery,
        {
          search:
            query,
        }
      );
    return (
      data?.Page?.media ||
      []
    ).map(
      mapAnime
    );
  };
/* =========================================================
   ANIME DETAILS
========================================================= */

export const getAnimeDetails =
  async (
    id
  ) => {

    const graphqlQuery = `
      query ($idMal: Int) {

        Media(
          idMal: $idMal
          type: ANIME
        ) {

          ${ANIME_FIELDS}
        }
      }
    `;
    const data =
      await anilistRequest(
        graphqlQuery,
        {
          idMal:
            Number(id),
        }
      );
    return mapAnime(
      data?.Media
    );
  };
/* =========================================================
   ANIME BY GENRE
========================================================= */

export const getAnimeByGenre =
  async (
    genre,
    page = 1
  ) => {

    const graphqlQuery = `
      query (
        $page: Int
        $genre: String
      ) {

        Page(
          page: $page
          perPage: 20
        ) {

          media(
            type: ANIME
            genre: $genre
            isAdult: false
            sort: POPULARITY_DESC
          ) {

            ${ANIME_FIELDS}

          }

        }

      }
    `;

    const data =
      await anilistRequest(
        graphqlQuery,
        {
          page,
          genre,
        }
      );
    return (
      data?.Page?.media ||
      []
    ).map(
      mapAnime
    );
  };
/* =========================================================
   ALL ANIME GENRES
========================================================= */

export const getAnimeGenres =
  async () => {

    const graphqlQuery = `
      query {
        GenreCollection
      }
    `;
    const data =
      await anilistRequest(
        graphqlQuery
      );
    return (
      data?.GenreCollection ||
      []
    ).sort(
      (a, b) =>
        a.localeCompare(b)
    );
  };
/* =========================================================
   MANGA
========================================================= */

const MANGA_FIELDS = `
  id

  title {
    romaji
    english
    native
  }

  coverImage {
    large
    extraLarge
    medium
  }

  averageScore
  format
  status
  chapters
  volumes
  description
  genres
`;
/* =========================================================
   POPULAR MANGA
========================================================= */

export const getPopularManga =
  async (
    page = 1
  ) => {

    const graphqlQuery = `
      query ($page: Int) {

        Page(
          page: $page
          perPage: 20
        ) {

          media(
            type: MANGA
            countryOfOrigin: JP
            sort: POPULARITY_DESC
          ) {
            ${MANGA_FIELDS}
          }
        }
      }
    `;
    const data =
      await anilistRequest(
        graphqlQuery,
        {
          page,
        }
      );
    return (
      data?.Page?.media ||
      []
    );
  };
/* =========================================================
   SEARCH MANGA
========================================================= */

export const searchManga =
  async (
    query
  ) => {

    const graphqlQuery = `
      query ($search: String) {

        Page(
          page: 1
          perPage: 20
        ) {

          media(
            type: MANGA
            countryOfOrigin: JP
            search: $search
          ) {
            ${MANGA_FIELDS}
          }
        }
      }
    `;
    const data =
      await anilistRequest(
        graphqlQuery,
        {
          search:
            query,
        }
      );
    return (
      data?.Page?.media ||
      []
    );
  };
/* =========================================================
   MANGA DETAILS
========================================================= */

export const getMangaDetails =
  async (
    id
  ) => {

    const graphqlQuery = `
      query ($id: Int) {

        Media(
          id: $id
          type: MANGA
        ) {

          ${MANGA_FIELDS}

          externalLinks {
            id
            url
            site
            type
          }
        }
      }
    `;
    const data =
      await anilistRequest(
        graphqlQuery,
        {
          id:
            Number(id),
        }
      );
    return (
      data?.Media ||
      null
    );
  };
/* =========================================================
   MANHWA
========================================================= */

/* =========================================================
   POPULAR MANHWA
========================================================= */

export const getPopularManhwa =
  async (
    page = 1
  ) => {

    const graphqlQuery = `
      query ($page: Int) {
        Page(
          page: $page
          perPage: 20
        ) {
          media(
            type: MANGA
            countryOfOrigin: KR
            sort: POPULARITY_DESC
          ) {
            ${MANGA_FIELDS}
          }
        }
      }
    `;
    const data =
      await anilistRequest(
        graphqlQuery,
        {
          page,
        }
      );
    return (
      data?.Page?.media ||
      []
    );
  };
/* =========================================================
   SEARCH MANHWA
========================================================= */

export const searchManhwa =
  async (
    query
  ) => {

    const graphqlQuery = `
      query ($search: String) {

        Page(
          page: 1
          perPage: 20
        ) {

          media(
            type: MANGA
            countryOfOrigin: KR
            search: $search
          ) {
            ${MANGA_FIELDS}
          }
        }
      }
    `;
    const data =
      await anilistRequest(
        graphqlQuery,
        {
          search:
            query,
        }
      );


    return (
      data?.Page?.media ||
      []
    );

  };

/* =========================================================
   MANHWA DETAILS
========================================================= */

export const getManhwaDetails =
  async (
    id
  ) => {

    const graphqlQuery = `
      query ($id: Int) {

        Media(
          id: $id
          type: MANGA
        ) {

          ${MANGA_FIELDS}

          externalLinks {
            id
            url
            site
            type
          }

        }

      }
    `;

    const data =
      await anilistRequest(
        graphqlQuery,
        {
          id:
            Number(id),
        }
      );

    return (
      data?.Media ||
      null
    );
  };

/* =========================================================
   ANIME OFFICIAL STREAMING EPISODES
========================================================= */

export const getAnimeStreaming =
  async (
    malId
  ) => {

    const graphqlQuery = `
      query ($idMal: Int) {

        Media(
          idMal: $idMal
          type: ANIME
        ) {

          id

          title {
            romaji
            english
            native
          }

          siteUrl

          streamingEpisodes {
            title
            thumbnail
            url
            site
          }

        }

      }
    `;

    try {

      const data =
        await anilistRequest(
          graphqlQuery,
          {
            idMal:
              Number(malId),
          }
        );
      return (
        data?.Media
          ?.streamingEpisodes ||
        []
      );

    } catch (error) {

      console.error(
        "Anime streaming error:",
        error
      );

      return [];

    }

  };
  /* =========================================================
   FEATURED CONTENT
========================================================= */

/* =========================================================
   FEATURED CONTENT
========================================================= */

export const getFeaturedAnime = async () => {
  const graphqlQuery = `
    query {
      onePiece: Media(
        search: "One Piece"
        type: ANIME
        isAdult: false
      ) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        averageScore
        format
        status
        episodes
        description
      }

      blackClover: Media(
        search: "Black Clover"
        type: ANIME
        isAdult: false
      ) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        averageScore
        format
        status
        episodes
        description
      }

      naruto: Media(
        search: "Naruto"
        type: ANIME
        isAdult: false
      ) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        averageScore
        format
        status
        episodes
        description
      }

      bleach: Media(
        search: "Bleach"
        type: ANIME
        isAdult: false
      ) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        averageScore
        format
        status
        episodes
        description
      }

      jjk: Media(
        search: "Jujutsu Kaisen"
        type: ANIME
        isAdult: false
      ) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        averageScore
        format
        status
        episodes
        description
      }
    }
  `;

  const data = await anilistRequest(graphqlQuery);

  return [
    data?.onePiece,
    data?.blackClover,
    data?.naruto,
    data?.bleach,
    data?.jjk,
  ].filter(Boolean).map(mapAnime);
};


export const getFeaturedManga = async () => {
  const graphqlQuery = `
    query {
      berserk: Media(
        search: "Berserk"
        type: MANGA
        countryOfOrigin: JP
      ) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        averageScore
        format
        status
        chapters
        volumes
        description
      }

      onePiece: Media(
        search: "One Piece"
        type: MANGA
        countryOfOrigin: JP
      ) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        averageScore
        format
        status
        chapters
        volumes
        description
      }

      vagabond: Media(
        search: "Vagabond"
        type: MANGA
        countryOfOrigin: JP
      ) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        averageScore
        format
        status
        chapters
        volumes
        description
      }

      blueLock: Media(
        search: "Blue Lock"
        type: MANGA
        countryOfOrigin: JP
      ) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        averageScore
        format
        status
        chapters
        volumes
        description
      }

      vinlandSaga: Media(
        search: "Vinland Saga"
        type: MANGA
        countryOfOrigin: JP
      ) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        averageScore
        format
        status
        chapters
        volumes
        description
      }
    }
  `;

  const data = await anilistRequest(graphqlQuery);

  return [
    data?.berserk,
    data?.onePiece,
    data?.vagabond,
    data?.blueLock,
    data?.vinlandSaga,
  ].filter(Boolean);
};


export const getFeaturedManhwa = async () => {
  const graphqlQuery = `
    query {
      soloLeveling: Media(
        search: "Solo Leveling"
        type: MANGA
        countryOfOrigin: KR
      ) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        averageScore
        format
        status
        chapters
        volumes
        description
      }

      omniscientReader: Media(
        search: "Omniscient Reader"
        type: MANGA
        countryOfOrigin: KR
      ) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        averageScore
        format
        status
        chapters
        volumes
        description
      }

      towerOfGod: Media(
        search: "Tower of God"
        type: MANGA
        countryOfOrigin: KR
      ) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        averageScore
        format
        status
        chapters
        volumes
        description
      }

      lookism: Media(
        search: "Lookism"
        type: MANGA
        countryOfOrigin: KR
      ) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        averageScore
        format
        status
        chapters
        volumes
        description
      }

      omniscient: Media(
        search: "The World After the Fall"
        type: MANGA
        countryOfOrigin: KR
      ) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
        }
        averageScore
        format
        status
        chapters
        volumes
        description
      }
    }
  `;

  const data = await anilistRequest(graphqlQuery);

  return [
    data?.soloLeveling,
    data?.omniscientReader,
    data?.towerOfGod,
    data?.lookism,
    data?.omniscient,
  ].filter(Boolean);
};