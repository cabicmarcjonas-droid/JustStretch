import { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext, ThemeContext } from "../context/AppContext";
import "../css/Navbar.css";

function SettingsDropdown({ email, onClose }) {
  const { toggleTheme, isDark } = useContext(ThemeContext);
  const { onLogout } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    onClose();
    navigate("/");
  };

  return (
    <div
      className="settings-dropdown"
      role="menu"
      aria-label="Settings"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="settings-user">
        <span className="settings-label">Signed in as</span>
        <span className="settings-email" translate="no" title={email}>
          {email}
        </span>
      </div>

      <div className="settings-divider" />

      <div className="settings-row" role="group" aria-label="Appearance">
        <div className="settings-row-text">
          <span className="settings-row-title">Dark mode</span>
          <span className="settings-row-hint">{isDark ? "On" : "Off"}</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label={`Dark mode ${isDark ? "enabled" : "disabled"}, click to toggle`}
          className={`theme-switch ${isDark ? "on" : ""}`}
          onClick={toggleTheme}
        >
          <span className="theme-switch-thumb" />
        </button>
      </div>

      <div className="settings-divider" />

      <button
        type="button"
        role="menuitem"
        className="settings-logout"
        onClick={handleLogout}
      >
        Log out
      </button>

      <p aria-live="polite" className="sr-only">
        {isDark ? "Dark mode enabled" : "Light mode enabled"}
      </p>
    </div>
  );
}

export default function Navbar({ variant = "app", exerciseTitle }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const settingsBtnRef = useRef(null);
  const { isLoggedIn, userEmail } = useContext(UserContext);

  // Close settings on outside click / Esc
  useEffect(() => {
    if (!settingsOpen) return;
    const onDown = (e) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target) &&
        settingsBtnRef.current &&
        !settingsBtnRef.current.contains(e.target)
      ) {
        setSettingsOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setSettingsOpen(false);
        settingsBtnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [settingsOpen]);

  // Close mobile menu on Esc
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Exercise minimal: left Back, center title, right settings
  if (variant === "exercise") {
    return (
      <nav className="app-navbar exercise-navbar" aria-label="Exercise navigation">
        <div className="navbar-inner">
          <Link to="/main" className="back-link">
            &larr; Back
          </Link>
          <h1 className="exercise-nav-title text-balance truncate" title={exerciseTitle}>
            {exerciseTitle || "Exercise"}
          </h1>
          {isLoggedIn ? (
            <div className="navbar-actions">
              <button
                ref={settingsBtnRef}
                type="button"
                className="settings-btn"
                aria-label={`Settings, signed in as ${userEmail}`}
                aria-haspopup="menu"
                aria-expanded={settingsOpen}
                onClick={() => setSettingsOpen((v) => !v)}
              >
                <span className="settings-icon" aria-hidden="true">⚙</span>
                <span className="settings-text">Settings</span>
              </button>
              {settingsOpen && (
                <div ref={settingsRef} className="settings-anchor">
                  <SettingsDropdown email={userEmail} onClose={() => setSettingsOpen(false)} />
                </div>
              )}
            </div>
          ) : (
            <span className="navbar-placeholder" aria-hidden="true" />
          )}
        </div>
      </nav>
    );
  }

  const appLinks = [
    { label: "Routine", href: "#workouts" },
    { label: "Streak", href: "#streak" },
    { label: "Benefits", href: "#benefits" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];
  const landingLinks = [
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];

  const links = variant === "landing" ? landingLinks : appLinks;

  return (
    <nav className="app-navbar" aria-label="Main navigation">
      <div className="navbar-inner">
        <button type="button" className="logo" onClick={scrollToTop} aria-label="Scroll to top">
          JUST STRETCH
        </button>

        {/* Desktop links */}
        <ul className="navbar-links" role="list">
          {links.map((l) => (
            <li key={l.label}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
          {!isLoggedIn && variant === "landing" && (
            <li>
              <Link to="/login" className="login-link">
                Login
              </Link>
            </li>
          )}
        </ul>

        {/* Right cluster */}
        <div className="navbar-actions">
          {isLoggedIn ? (
            <>
              <button
                ref={settingsBtnRef}
                type="button"
                className="settings-btn"
                aria-label={`Settings, signed in as ${userEmail}`}
                aria-haspopup="menu"
                aria-expanded={settingsOpen}
                onClick={() => setSettingsOpen((v) => !v)}
              >
                <span className="settings-icon" aria-hidden="true">⚙</span>
                <span className="settings-text">Settings</span>
              </button>
              {settingsOpen && (
                <div ref={settingsRef} className="settings-anchor">
                  <SettingsDropdown email={userEmail} onClose={() => setSettingsOpen(false)} />
                </div>
              )}
            </>
          ) : variant === "app" ? (
            <Link to="/login" className="login-link-desktop">
              Login
            </Link>
          ) : null}

          {/* Mobile hamburger */}
          <button
            type="button"
            className="hamburger"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className={`hamburger-line ${menuOpen ? "open-top" : ""}`} />
            <span className={`hamburger-line ${menuOpen ? "open-middle" : ""}`} />
            <span className={`hamburger-line ${menuOpen ? "open-bottom" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div id="mobile-menu" className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <ul className="mobile-links">
            {links.map((l) => (
              <li key={l.label}>
                <a href={l.href} onClick={() => setMenuOpen(false)}>
                  {l.label}
                </a>
              </li>
            ))}
            {!isLoggedIn ? (
              <li>
                <Link to="/login" className="mobile-login" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
              </li>
            ) : (
              <>
                <li className="mobile-user">
                  <span className="mobile-user-label">Signed in as</span>
                  <span className="mobile-user-email" translate="no">
                    {userEmail}
                  </span>
                </li>
                <li className="mobile-settings-row">
                  <SettingsDropdown email={userEmail} onClose={() => setMenuOpen(false)} />
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}
