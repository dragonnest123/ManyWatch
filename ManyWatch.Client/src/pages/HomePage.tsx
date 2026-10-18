import { Link } from 'react-router-dom';
import { AppHeader } from '../shared/AppHeader';

export function HomePage() {
  return (
    <>
      <AppHeader />

      <main className="page home-page">
        <section className="hero">
          <h1>ManyWatch</h1>
          <p>Create a room and watch together</p>

          <div className="actions">
            <Link className="button" to="/rooms/create">
              Create room
            </Link>

            <Link className="button secondary" to="/rooms/join">
              Join room
            </Link>

            <Link className="button secondary" to="/rooms">
              Browse rooms
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
