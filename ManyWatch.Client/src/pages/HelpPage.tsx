import { Link } from 'react-router-dom';
import { AppHeader } from '../shared/AppHeader';

export function HelpPage() {
  return (
    <>
      <AppHeader />

      <main className="page help-page">
        <Link className="back-link" to="/">
          ← Back
        </Link>

        <section className="card">
          <p className="eyebrow">Guide</p>
          <h1>What can we watch together?</h1>
          <p>
            Paste a link into a room and the video plays for everyone at the same time: play, pause and
            seeking stay in sync for all viewers. Two kinds of links are supported today.
          </p>
        </section>

        <section className="card">
          <h2>YouTube</h2>
          <p>Any YouTube link works — the video plays through the official YouTube player:</p>
          <ul>
            <li>
              <code>youtube.com/watch?v=…</code>
            </li>
            <li>
              <code>youtu.be/…</code>
            </li>
            <li>
              <code>/shorts/…</code>, <code>/embed/…</code> and <code>/live/…</code> links are recognized too
            </li>
          </ul>
          <p className="muted">
            The video must allow embedding (a few videos hide this option), and it may show ads.
          </p>
        </section>

        <section className="card">
          <h2>Direct video links (mp4, webm)</h2>
          <p>
            A direct link points to the video file itself, not to a web page. The easiest check: open the
            link in a new browser tab — the video should start playing right away instead of showing a
            page with a download button.
          </p>
          <p>
            Direct links come from your own web server, cloud storage (S3, Cloudflare R2 and similar) or any
            file hosting that returns a direct link. The link must be publicly reachable — no sign-in
            required.
          </p>
          <p className="muted">
            Chrome and Firefox cannot play H.265/HEVC files. If a valid direct link does not play at all,
            the file is probably encoded with H.265 — re-encode it to H.264 (mp4) and upload again.
          </p>
        </section>

        <section className="card">
          <h2>I have a movie file on my computer</h2>
          <ol>
            <li>Upload the file to any hosting that gives a direct link (cloud storage or file hosting).</li>
            <li>Open the received link in a browser tab and make sure the video starts playing.</li>
            <li>Paste the link into the room — everyone will watch the movie together.</li>
          </ol>
          <p className="muted">
            A browser cannot open files straight from your computer by their path — that is why the file
            has to be reachable through a link first.
          </p>
        </section>

        <section className="card">
          <h2>What does not work</h2>
          <ul>
            <li>
              Page links from sites with their own player (VK Video, Rutube, Twitch, streaming sites) — the
              browser does not allow controlling a foreign video player.
            </li>
            <li>
              Share pages from Google Drive, Yandex.Disk and similar services — they open a web page instead
              of the video file.
            </li>
            <li>Files in codecs the browser cannot decode (for example H.265/HEVC).</li>
          </ul>
        </section>

        <section className="card">
          <h2>Players</h2>
          <ul>
            <li>
              <strong>YouTube player</strong> — used for YouTube links;
            </li>
            <li>
              <strong>Built-in browser player</strong> — used for direct video files.
            </li>
          </ul>
          <p className="muted">
            Both players are synchronized between all room members, and any member can control playback.
          </p>
        </section>
      </main>
    </>
  );
}
