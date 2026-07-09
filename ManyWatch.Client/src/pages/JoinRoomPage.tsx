import { Link } from 'react-router-dom';
import { JoinRoomForm } from '../features/rooms/components/JoinRoomForm';

export function JoinRoomPage() {
  return (
    <main className="page">
      <Link to="/">← Back</Link>

      <section className="card">
        <h1>Join room</h1>
        <JoinRoomForm />
      </section>
    </main>
  );
}
