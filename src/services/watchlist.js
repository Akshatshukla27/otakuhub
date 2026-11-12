
import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/api/auth/watchlist`;

const getToken = () => {
  return localStorage.getItem("otakuhubToken");
};
// GET WATCHLIST
export const getWatchlist = async () => {
  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch watchlist.");
  }

  return data.watchlist;
};

// ADD ITEM
export const addToWatchlist = async (item, category, status) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      itemId: String(item.mal_id || item.id),
      category,
      title: item.title || item.name || "Untitled",
      image:
        item.images?.jpg?.large_image_url ||
        item.images?.jpg?.image_url ||
        item.coverImage?.large ||
        item.image ||
        "",
      status: status || "Plan to Watch",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to add to watchlist.");
  }

  return data.watchlist;
};

// UPDATE STATUS
export const updateWatchlistStatus = async (
  itemId,
  category,
  status
) => {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(itemId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ category, status }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update status.");
  }

  return data.watchlist;
};

// REMOVE ITEM
export const removeFromWatchlist = async (itemId, category) => {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(itemId)}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ category }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to remove item.");
  }

  return data.watchlist;
};
