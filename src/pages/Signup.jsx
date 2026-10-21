import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (event) => {
    event.preventDefault();

    setError("");

    // Basic validation
    if (!username || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Signup failed.");
        return;
      }

      // Account created successfully
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error);
      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-glow auth-glow-one"></div>
      <div className="auth-glow auth-glow-two"></div>

      <div className="auth-container">

        {/* Left side */}
        <div className="auth-intro">

          <div className="auth-brand">
            🎌 <span>OtakuHub</span>
          </div>

          <h1>
            Start Your
            <br />
            <span>Otaku Journey.</span>
          </h1>

          <p>
            Create your account and keep all your
            anime, manga and manhwa activities in one place.
          </p>

          <div className="auth-features">
            <div>✓ Build your personal collection</div>
            <div>✓ Track anime & chapter progress</div>
            <div>✓ Save your favorite titles</div>
          </div>

        </div>

        {/* Signup card */}
        <div className="auth-card">

          <div className="auth-card-header">

            <div className="auth-icon">
              ✨
            </div>

            <h2>Create Account</h2>

            <p>
              Join OtakuHub today
            </p>

          </div>

          <form onSubmit={handleSignup}>

            {/* Username */}
            <div className="form-group">

              <label>Username</label>

              <div className="input-wrapper">
                <span>👤</span>

                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                />
              </div>

            </div>

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
                  placeholder="Create a password"
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
                  {showPassword
                    ? "🙈"
                    : "👁️"}
                </button>

              </div>

            </div>

            {/* Error message */}
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

            {/* Signup button */}
            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Account →"}
            </button>

          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <p className="auth-footer">

            Already have an account?{" "}

            <Link to="/login">
              Sign In
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

export default Signup;