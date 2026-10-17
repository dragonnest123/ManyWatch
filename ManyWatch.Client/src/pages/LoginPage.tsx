import { Link } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm';
import { AppHeader } from '../shared/AppHeader';

export function LoginPage() {
  return (
    <>
      <AppHeader />

      <main className="page form-page">
        <Link className="back-link" to="/">
          ← Back
        </Link>

        <section className="card">
          <h1>Log in</h1>
          <LoginForm />
          <p>
            No account yet? <Link to="/register">Sign up</Link>
          </p>
        </section>
      </main>
    </>
  );
}
