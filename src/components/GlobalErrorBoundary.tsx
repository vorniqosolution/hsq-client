// src/components/GlobalErrorBoundary.tsx
import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: any };

export default class GlobalErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // TODO: send to Sentry/LogRocket/etc.
    console.error("Render error:", { error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center p-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-4">
              Please refresh the page or go back. Our team has been notified.
            </p>
            <button
              className="px-4 py-2 rounded-lg border shadow"
              onClick={() => (window.location.href = "/")}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
