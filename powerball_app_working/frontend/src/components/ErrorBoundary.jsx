import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Keep component stack for debugging
    this.setState({ info });

    // Log in dev so Safari shows the real crash cause
    if (import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.error("[UI ErrorBoundary] Caught error:", error);
      // eslint-disable-next-line no-console
      console.error("[UI ErrorBoundary] Component stack:", info?.componentStack);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const errorMessage = this.state.error
      ? String(this.state.error?.message || this.state.error)
      : "Unknown error";

    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Something went wrong</h2>
              <p className="mt-2 text-slate-600">
                The app hit an unexpected error. You can go back home or try again.
              </p>
            </div>

            <button
              type="button"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => {
                // Reset boundary state
                this.setState({ hasError: false, error: null, info: null });
              }}
            >
              Try again
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-700">Error</div>
            <pre className="mt-1 text-xs whitespace-pre-wrap text-slate-700">{errorMessage}</pre>

            {import.meta?.env?.DEV && this.state.info?.componentStack ? (
              <>
                <div className="mt-3 text-xs font-semibold text-slate-700">
                  Component stack (dev)
                </div>
                <pre className="mt-1 text-[11px] leading-relaxed whitespace-pre-wrap text-slate-700">
                  {this.state.info.componentStack}
                </pre>
              </>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {/* ✅ NO depende del Router (evita crash si ErrorBoundary está fuera de BrowserRouter) */}
            <a
              href="/"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Back to Dashboard
            </a>

            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
