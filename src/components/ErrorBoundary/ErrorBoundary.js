import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
            Component Error
          </h3>
          <p className="text-red-600 dark:text-red-300 text-sm mb-2">
            {this.state.error && this.state.error.toString()}
          </p>
          {this.props.showDetails && (
            <details className="text-xs text-red-500 dark:text-red-400">
              <summary>Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
