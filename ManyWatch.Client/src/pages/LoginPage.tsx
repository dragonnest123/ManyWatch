import { Link, useSearchParams } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm';
import { buildAuthPath, getAuthRedirect } from '../features/auth/model/redirects';
import { AppHeader } from '../shared/AppHeader';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirect = getAuthRedirect(searchParams);

  return (
    <>
      <AppHeader />

      <main className="page form-page">
        <Link className="back-link" to="/">
          Back
        </Link>

        <section className="card form-card">
          <p className="eyebrow">Welcome back</p>
          <h1>Log in</h1>
          <p className="card-lead">Sign in to keep friends, invitations and chats in one place</p>
          <LoginForm />
          <p>
            No account yet? <Link to={buildAuthPath('/register', redirect)}>Sign up</Link>
          </p>
        </section>
      </main>
    </>
  );
}
