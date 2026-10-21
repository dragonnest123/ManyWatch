import { Link } from 'react-router-dom';
import { AppHeader } from '../shared/AppHeader';

const STEPS = [
  {
    number: '01',
    title: 'Open a room',
    description: 'Give it a name and decide who can drop in',
  },
  {
    number: '02',
    title: 'Share the link',
    description: 'Friends join in one click — no account required',
  },
  {
    number: '03',
    title: 'Press play together',
    description: 'YouTube or a direct video file, always on the same frame',
  },
];

export function HomePage() {
  return (
    <>
      <AppHeader />

      <main className="page home-page">
        <section className="home-hero">
          <div className="hero-copy">
            <h1>
              Good films.
              <br />
              <em>Better company.</em>
            </h1>

            <p className="hero-lead">
              Create a room, drop in a video link and press play. Everyone sees the same frame,
              hears the same sound and can take the controls
            </p>

            <div className="actions hero-actions">
              <Link className="button" to="/rooms/create">
                Start a room
              </Link>

              <Link className="button secondary" to="/rooms/join">
                Join with an ID
              </Link>
            </div>

            <Link className="text-link" to="/rooms">
              or browse open rooms <span aria-hidden="true">→</span>
            </Link>

            <p className="hero-note">
              <span className="live-dot" aria-hidden="true" />
              Free, no account needed · YouTube &amp; direct video files
            </p>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="hero-screen">
              <div className="hero-screen-top">
                <span className="hero-screen-live">
                  <span className="live-dot" />
                  Live in sync
                </span>
                <span className="hero-screen-ratio">16:9</span>
              </div>

              <div className="hero-screen-center">
                <span className="hero-screen-kicker">Feature presentation</span>
                <span className="hero-screen-play">▶</span>
                <span className="hero-screen-note">Any film · any distance</span>
              </div>

              <div className="hero-screen-timeline">
                <span />
              </div>
            </div>

            <div className="hero-ticket">
              <span className="hero-ticket-label">Admit one</span>
              <span className="hero-ticket-title">Movie night</span>
              <span className="hero-ticket-meta">Your place · tonight</span>
            </div>
          </div>
        </section>

        <section className="home-steps" aria-labelledby="how-it-works">
          <div className="steps-heading">
            <p className="eyebrow">How it works</p>
            <h2 id="how-it-works">Three steps to a shared screen</h2>
          </div>

          <ol className="steps-list">
            {STEPS.map((step) => (
              <li key={step.number}>
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
