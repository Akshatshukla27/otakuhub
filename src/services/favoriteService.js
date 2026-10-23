
const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

export const syncFavorites = async (favorites) => {
  const token = localStorage.getItem("otakuhubToken");

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/auth/favorites`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(favorites),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Favorite sync failed:", data.message);
      return null;
    }

    console.log("Favorites synced:", data);
    return data;
  } catch (error) {
    console.error("Favorite sync error:", error);
    return null;
  }
};
