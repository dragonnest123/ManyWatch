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
          Back
        </Link>

        <section className="card form-card">
          <p className="eyebrow">Join the audience</p>
          <h1>Create an account</h1>
          <p className="card-lead">
            Friends, personal chats and invitations. Watching together stays open to guests
          </p>
          <RegisterForm />
          <p>
            Already have an account? <Link to={buildAuthPath('/login', redirect)}>Log in</Link>
          </p>
        </section>
      </main>
    </>
  );
}
