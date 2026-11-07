import { type FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getAuthRedirect } from '../model/redirects';
import {
  isValidUsername,
  normalizeUsername,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '../model/username';

export function RegisterForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedUsername = normalizeUsername(username);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');

    if (!isValidUsername(normalizedUsername)) {
      setError(
        'Username must be 3–32 characters: lowercase letters, numbers and underscores, starting with a letter',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await register(email.trim(), password, displayName.trim(), normalizedUsername);
      navigate(getAuthRedirect(searchParams) ?? '/rooms');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign up');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Display name
        <input
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Jane Doe"
        />
      </label>

      <label>
        Username
        <input
          required
          minLength={USERNAME_MIN_LENGTH}
          maxLength={USERNAME_MAX_LENGTH}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          onBlur={() => setUsername((current) => normalizeUsername(current))}
          placeholder="alice"
          autoComplete="username"
        />
        <span className="form-hint">
          People can find you by @{normalizedUsername || 'username'}
        </span>
      </label>

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
          minLength={8}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
        />
      </label>

      {error && <p className="error">{error}</p>}

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Signing up...' : 'Sign up'}
      </button>
    </form>
  );
}
