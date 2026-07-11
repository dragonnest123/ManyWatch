import { Link, NavLink } from 'react-router-dom';

export function AppHeader() {
  return (
    <header className="app-header">
      <Link className="brand" to="/">
        ManyWatch
      </Link>

      <nav className="top-nav" aria-label="Main navigation">
        <NavLink end to="/">
          Home
        </NavLink>
        <NavLink to="/rooms/create">Create</NavLink>
        <NavLink to="/rooms/join">Join</NavLink>
      </nav>
    </header>
  );
}
