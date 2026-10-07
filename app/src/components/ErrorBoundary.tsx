import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportCrash } from '../services/telemetry';

/**
 * Shows a calm recovery screen instead of a blank page when a screen fails to render, and sends
 * a crash report if the person opted in. Entries are saved separately, so nothing is lost.
 */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    reportCrash(error, 'render');
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    // Moving to another screen gives it a fresh try.
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="card" role="alert" aria-labelledby="err-h">
        <h1 id="err-h">Something went wrong on this screen</h1>
        <p>Your entries are safe on this device. You can go back, or reload the app.</p>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => location.reload()}>
            Reload
          </button>
          <a className="btn quiet" href="#/today" onClick={() => this.setState({ failed: false })}>
            Go to Today
          </a>
        </div>
        <p className="small muted">
          If you need support right now, Settings → Safety and support lists who you can contact. Within is not an emergency service.
        </p>
      </section>
    );
  }
}
