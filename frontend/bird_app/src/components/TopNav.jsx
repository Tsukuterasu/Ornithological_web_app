import { NavLink } from "react-router-dom";

const links = [
  { to: "/add-species", label: "Add Species" },
  { to: "/", label: "Directory" },
  { to: "/table", label: "Bird Table" },
  { to: "/add-image", label: "Add Image" },
];

function TopNav() {
  return (
    <header className="top-nav">
      <div className="nav-inner">
        <div className="brand">
          <span className="brand-icon">B</span>
          <span className="brand-name">Bird App</span>
        </div>
        <nav className="nav-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <span className="nav-chip">API: http://127.0.0.1:5000</span>
        </div>
      </div>
    </header>
  );
}

export default TopNav;
