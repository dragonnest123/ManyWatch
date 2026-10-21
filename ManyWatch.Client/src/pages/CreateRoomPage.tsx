import { Link } from 'react-router-dom';
import { CreateRoomForm } from '../features/rooms/components/CreateRoomForm';
import { AppHeader } from '../shared/AppHeader';

export function CreateRoomPage() {
  return (
    <>
      <AppHeader />

      <main className="page form-page">
        <Link className="back-link" to="/">
          Back
        </Link>

        <section className="card form-card">
          <p className="eyebrow">Start a screening</p>
          <h1>Create a room</h1>
          <p className="card-lead">
            Name your room, choose who can join, then share the link with your audience
          </p>
          <CreateRoomForm />
        </section>
      </main>
    </>
  );
}
