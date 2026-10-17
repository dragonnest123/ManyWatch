import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate('/rooms');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to log in');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Email
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </label>

      <label>
        Password
        <input
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />
      </label>

      {error && <p className="error">{error}</p>}

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Logging in...' : 'Log in'}
      </button>
    </form>
  );
}
