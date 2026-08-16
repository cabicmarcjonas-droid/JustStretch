import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <NavLink to="/home" className="brand">
        JustStretch<span className="brand-dot">.</span>
      </NavLink>

      <nav className="nav-links">
        <NavLink
          to="/session"
          className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
        >
          Start Session
        </NavLink>
      </nav>
    </header>
  );
}
