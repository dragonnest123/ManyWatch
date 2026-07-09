import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <h1>ManyWatch</h1>
        <p>Create a room and watch together.</p>

        <div className="actions">
          <Link className="button" to="/rooms/create">
            Create room
          </Link>

          <Link className="button secondary" to="/rooms/join">
            Join room
          </Link>
        </div>
      </section>
    </main>
  );
}
