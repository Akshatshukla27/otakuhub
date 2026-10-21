import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const navLinkClass = ({ isActive }) =>
  isActive ? "nav-active" : "";

function Navbar() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const savedUser = JSON.parse(
        localStorage.getItem(
          "otakuhubCurrentUser"
        ) || "null"
      );

      setCurrentUser(savedUser);
    } catch (error) {
      console.error(
        "Navbar user error:",
        error
      );

      setCurrentUser(null);
    }
  }, []);

  const handleSearch = () => {
  const value = search.trim();

  if (!value) {
    return;
  }

  window.location.href =
    `/?search=${encodeURIComponent(value)}`;
};

  const handleLogout = () => {
    localStorage.removeItem(
      "otakuhubCurrentUser"
    );

    localStorage.removeItem(
      "otakuhubToken"
    );

    setCurrentUser(null);

    navigate("/");
  };

  return (
    <nav className="navbar">

      <NavLink
        to="/"
        className="logo"
      >
        🎌 OtakuHub
      </NavLink>

      <div className="nav-links">

        <NavLink
          to="/"
          className={navLinkClass}
          end
        >
          Home
        </NavLink>

        <NavLink
          to="/anime"
          className={navLinkClass}
        >
          Anime
        </NavLink>

        <NavLink
          to="/manga"
          className={navLinkClass}
        >
          Manga
        </NavLink>

        <NavLink
          to="/manhwa"
          className={navLinkClass}
        >
          Manhwa
        </NavLink>

        <NavLink
          to="/favorites"
          className={navLinkClass}
        >
          ❤️ Favorites
        </NavLink>

      </div>

      <div className="nav-actions">

        <input
          type="text"
          className="search-input"
          placeholder="Search anime, manga or manhwa..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />

        <button
          className="search-btn"
          onClick={handleSearch}
        >
          🔍
        </button>

        {currentUser ? (
          <div className="user-menu">

            <NavLink
              to="/profile"
              className="profile-btn"
            >
              👤 Profile
            </NavLink>

            <span className="user-name">
              {currentUser.username}
            </span>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>
        ) : (
          <NavLink
            to="/login"
            className="login-btn"
          >
            Login
          </NavLink>
        )}

      </div>

    </nav>
  );
}

export default Navbar;