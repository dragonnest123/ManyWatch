import { Link } from 'react-router-dom';
import { RegisterForm } from '../features/auth/components/RegisterForm';
import { AppHeader } from '../shared/AppHeader';

export function RegisterPage() {
  return (
    <>
      <AppHeader />

      <main className="page form-page">
        <Link className="back-link" to="/">
          ← Back
        </Link>

        <section className="card">
          <h1>Sign up</h1>
          <RegisterForm />
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </section>
      </main>
    </>
  );
}
