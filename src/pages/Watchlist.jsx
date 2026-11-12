
import { useEffect, useState } from "react";
import {
  getWatchlist,
  updateWatchlistStatus,
  removeFromWatchlist,
} from "../services/watchlist";

function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const data = await getWatchlist();
        setItems(data || []);
      } catch (err) {
        setError(err.message || "Unable to load watchlist.");
      } finally {
        setLoading(false);
      }
    };

    loadWatchlist();
  }, []);

  const handleStatusChange = async (item, status) => {
    try {
      const updated = await updateWatchlistStatus(
        item.itemId,
        item.category,
        status
      );

      setItems(updated || []);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemove = async (item) => {
    try {
      const updated = await removeFromWatchlist(
        item.itemId,
        item.category
      );

      setItems(updated || []);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="watchlist-page">
      <h1>📋 My Watchlist</h1>
      <p>Keep track of your Anime, Manga and Manhwa.</p>

      {loading && <p>Loading your watchlist...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p>Your watchlist is empty. Add your first title!</p>
      )}

      <div className="watchlist-grid">
        {items.map((item) => (
          <div
            className="watchlist-card"
            key={`${item.category}-${item.itemId}`}
          >
            <img
              src={item.image || ""}
              alt={item.title}
            />

            <div className="watchlist-info">
              <h3>{item.title}</h3>
              <p>{item.category}</p>

              <select
                value={item.status}
                onChange={(event) =>
                  handleStatusChange(item, event.target.value)
                }
              >
                <option value="Watching">Watching</option>
                <option value="Completed">Completed</option>
                <option value="Plan to Watch">Plan to Watch</option>
                <option value="On Hold">On Hold</option>
                <option value="Dropped">Dropped</option>
              </select>

              <button
                type="button"
                onClick={() => handleRemove(item)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Watchlist;
