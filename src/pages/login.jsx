import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../services/config";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    // Basic validation
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
       `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed.");
        return;
      }

      // Save JWT token
      localStorage.setItem(
        "otakuhubToken",
        data.token
      );

      // Save logged-in user
      localStorage.setItem(
        "otakuhubCurrentUser",
        JSON.stringify(data.user)
      );

      // Go to homepage
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Background decoration */}
      <div className="auth-glow auth-glow-one"></div>
      <div className="auth-glow auth-glow-two"></div>

      <div className="auth-container">

        {/* Left side */}
        <div className="auth-intro">

          <div className="auth-brand">
            🎌 <span>OtakuHub</span>
          </div>

          <h1>
            Your Anime.
            <br />
            Your Manga.
            <br />
            <span>Your Adventure.</span>
          </h1>

          <p>
            Keep track of your favorite anime, manga and
            manhwa all in one place.
          </p>

          <div className="auth-features">
            <div>✓ Track your progress</div>
            <div>✓ Save your favorites</div>
            <div>✓ Discover new titles</div>
          </div>

        </div>

        {/* Login card */}
        <div className="auth-card">

          <div className="auth-card-header">

            <div className="auth-icon">
              🔐
            </div>

            <h2>Welcome Back</h2>

            <p>
              Sign in to continue to OtakuHub
            </p>

          </div>

          <form onSubmit={handleLogin}>

            {/* Email */}
            <div className="form-group">

              <label>Email Address</label>

              <div className="input-wrapper">

                <span>✉️</span>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                />

              </div>

            </div>

            {/* Password */}
            <div className="form-group">

              <label>Password</label>

              <div className="input-wrapper">

                <span>🔒</span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>

              </div>

            </div>

            {/* Error */}
            {error && (
              <p
                style={{
                  color: "#f87171",
                  fontSize: "13px",
                  marginBottom: "15px",
                }}
              >
                {error}
              </p>
            )}

            <div className="auth-options">

              <label className="remember-me">

                <input
                  type="checkbox"
                />

                <span>
                  Remember me
                </span>

              </label>

              <a href="#">
                Forgot password?
              </a>

            </div>

            {/* Login button */}
            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading
                ? "Signing In..."
                : "Sign In →"}
            </button>

          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <p className="auth-footer">

            Don't have an account?{" "}

            <Link to="/signup">
              Create Account
            </Link>

          </p>

          <Link
            to="/"
            className="back-home"
          >
            ← Back to Home
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Login;