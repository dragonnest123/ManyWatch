import { Link, useSearchParams } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm';
import { buildAuthPath, getRoomRedirect } from '../features/auth/model/redirects';
import { AppHeader } from '../shared/AppHeader';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirect = getRoomRedirect(searchParams);

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
            No account yet? <Link to={buildAuthPath('/register', redirect)}>Sign up</Link>
          </p>
        </section>
      </main>
    </>
  );
}
