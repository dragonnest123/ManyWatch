import { Link } from 'react-router-dom';
import { JoinRoomForm } from '../features/rooms/components/JoinRoomForm';
import { AppHeader } from '../shared/AppHeader';

export function JoinRoomPage() {
  return (
    <>
      <AppHeader />

      <main className="page form-page">
        <Link className="back-link" to="/">
          ← Back
        </Link>

        <section className="card">
          <h1>Join room</h1>
          <JoinRoomForm />
        </section>
      </main>
    </>
  );
}
