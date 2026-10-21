/* =====================================================
   SHARED FAVORITES SERVICE
===================================================== */


/* =====================================================
   GET CURRENT USER
===================================================== */

export const getCurrentUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem(
        "otakuhubCurrentUser"
      ) || "null"
    );
  } catch (error) {
    console.error(
      "Current user error:",
      error
    );

    return null;
  }
};


/* =====================================================
   GET USER ID
===================================================== */

export const getUserId = () => {
  const user =
    getCurrentUser();

  return (
    user?._id ||
    user?.id ||
    null
  );
};


/* =====================================================
   GET FAVORITES STORAGE KEY
===================================================== */

export const getFavoritesKey = () => {
  const userId =
    getUserId();

  if (!userId) {
    return "favorites";
  }

  return `favorites_${userId}`;
};


/* =====================================================
   GET ALL FAVORITES
===================================================== */

export const getFavorites = () => {
  try {
    const key =
      getFavoritesKey();

    const saved =
      JSON.parse(
        localStorage.getItem(
          key
        ) || "[]"
      );

    return Array.isArray(saved)
      ? saved
      : [];

  } catch (error) {

    console.error(
      "Get favorites error:",
      error
    );

    return [];
  }
};


/* =====================================================
   SAVE ALL FAVORITES
===================================================== */

export const saveFavorites = (
  favorites
) => {
  try {

    const key =
      getFavoritesKey();

    localStorage.setItem(
      key,
      JSON.stringify(
        favorites
      )
    );

    // Tell other components
    // that favorites changed.
    window.dispatchEvent(
      new Event(
        "favoritesChanged"
      )
    );

    return true;

  } catch (error) {

    console.error(
      "Save favorites error:",
      error
    );

    return false;
  }
};


/* =====================================================
   CHECK FAVORITE
===================================================== */

export const isFavorite = (
  id,
  category
) => {

  const favorites =
    getFavorites();

  const normalizedId =
    String(id);

  const normalizedCategory =
    category || "Anime";

  return favorites.some(
    (item) => {

      const itemCategory =
        item.category ||
        "Anime";

      const itemId =
        itemCategory ===
        "Anime"
          ? item.mal_id
          : item.id;

      return (
        itemCategory ===
          normalizedCategory &&
        String(itemId) ===
          normalizedId
      );
    }
  );
};


/* =====================================================
   ADD FAVORITE
===================================================== */

export const addFavorite = (
  item,
  category
) => {

  if (!item) {
    return false;
  }

  const favorites =
    getFavorites();

  const normalizedCategory =
    category || "Anime";

  const itemId =
    normalizedCategory ===
    "Anime"
      ? item.mal_id
      : item.id;

  if (!itemId) {
    console.warn(
      "Cannot favorite item without ID."
    );

    return false;
  }

  const alreadyExists =
    favorites.some(
      (favorite) => {

        const favoriteCategory =
          favorite.category ||
          "Anime";

        const favoriteId =
          favoriteCategory ===
          "Anime"
            ? favorite.mal_id
            : favorite.id;

        return (
          favoriteCategory ===
            normalizedCategory &&
          String(
            favoriteId
          ) ===
            String(itemId)
        );
      }
    );

  if (alreadyExists) {
    return false;
  }

  const favoriteItem = {
    ...item,
    category:
      normalizedCategory,
  };

  saveFavorites([
    ...favorites,
    favoriteItem,
  ]);

  return true;
};


/* =====================================================
   REMOVE FAVORITE
===================================================== */

export const removeFavorite = (
  id,
  category
) => {

  const normalizedId =
    String(id);

  const normalizedCategory =
    category || "Anime";

  const favorites =
    getFavorites();

  const updated =
    favorites.filter(
      (item) => {

        const itemCategory =
          item.category ||
          "Anime";

        const itemId =
          itemCategory ===
          "Anime"
            ? item.mal_id
            : item.id;

        return !(
          itemCategory ===
            normalizedCategory &&
          String(itemId) ===
            normalizedId
        );
      }
    );

  saveFavorites(
    updated
  );

  return true;
};


/* =====================================================
   TOGGLE FAVORITE
===================================================== */

export const toggleFavorite = (
  item,
  category
) => {

  if (!item) {
    return false;
  }

  const normalizedCategory =
    category || "Anime";

  const itemId =
    normalizedCategory ===
    "Anime"
      ? item.mal_id
      : item.id;

  if (!itemId) {
    return false;
  }

  if (
    isFavorite(
      itemId,
      normalizedCategory
    )
  ) {

    removeFavorite(
      itemId,
      normalizedCategory
    );

    return false;
  }

  addFavorite(
    item,
    normalizedCategory
  );

  return true;
};


/* =====================================================
   GET FAVORITES BY CATEGORY
===================================================== */

export const getFavoritesByCategory =
  (category) => {

    const favorites =
      getFavorites();

    if (!category) {
      return favorites;
    }

    return favorites.filter(
      (item) =>
        (
          item.category ||
          "Anime"
        ) === category
    );
  };