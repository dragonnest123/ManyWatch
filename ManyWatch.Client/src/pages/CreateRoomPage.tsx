import { Link } from 'react-router-dom';
import { CreateRoomForm } from '../features/rooms/components/CreateRoomForm';

export function CreateRoomPage() {
  return (
    <main className="page">
      <Link to="/">← Back</Link>

      <section className="card">
        <h1>Create room</h1>
        <CreateRoomForm />
      </section>
    </main>
  );
}
