import { Component } from "react";

const RELOAD_KEY = "mrpace_reloaded_at";

// Catches a page that fails to load so the site never goes blank.
// If a page's code couldn't be downloaded (e.g. after the site was updated),
// it reloads once automatically; otherwise it shows a "Try again" message.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    const chunkFailed = /dynamically imported module|Importing a module script failed|Failed to fetch|Loading chunk/i.test(
      String(error && error.message)
    );
    if (!chunkFailed) return;
    let last = 0;
    try { last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0; } catch { /* storage blocked */ }
    if (Date.now() - last > 10000) {
      try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())); } catch { /* storage blocked */ }
      window.location.reload();
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="page">
        <div className="container section notfound">
          <h1>Something went wrong</h1>
          <p className="muted">This page didn't load properly. Please try again.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>
        </div>
      </main>
    );
  }
}
