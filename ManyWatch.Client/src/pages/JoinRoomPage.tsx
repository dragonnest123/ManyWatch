import { Link } from 'react-router-dom';
import { JoinRoomForm } from '../features/rooms/components/JoinRoomForm';
import { AppHeader } from '../shared/AppHeader';

export function JoinRoomPage() {
  return (
    <>
      <AppHeader />

      <main className="page form-page">
        <Link className="back-link" to="/">
          Back
        </Link>

        <section className="card form-card">
          <p className="eyebrow">Have an invite?</p>
          <h1>Join a room</h1>
          <p className="card-lead">Paste the room ID from your invitation to take a seat</p>
          <JoinRoomForm />
        </section>
      </main>
    </>
  );
}
