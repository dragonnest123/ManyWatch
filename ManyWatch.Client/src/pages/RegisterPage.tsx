import { Link, useSearchParams } from 'react-router-dom';
import { RegisterForm } from '../features/auth/components/RegisterForm';
import { buildAuthPath, getAuthRedirect } from '../features/auth/model/redirects';
import { AppHeader } from '../shared/AppHeader';

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const redirect = getAuthRedirect(searchParams);

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
            Already have an account? <Link to={buildAuthPath('/login', redirect)}>Log in</Link>
          </p>
        </section>
      </main>
    </>
  );
}
