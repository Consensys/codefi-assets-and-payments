import React, { Component, ErrorInfo, ReactElement } from 'react';
import PageError from 'uiComponents/PageError';

type ErrorBoundaryProviderProps = {
  children: ReactElement;
};

type ErrorBoundaryProviderState = {
  hasError: boolean;
};

class ErrorBoundaryProvider extends Component<
  ErrorBoundaryProviderProps,
  ErrorBoundaryProviderState
> {
  public state: ErrorBoundaryProviderState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): ErrorBoundaryProviderState {
    // Update state so the next render will show the fallback UI.

    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render(): JSX.Element {
    if (this.state.hasError) {
      return <PageError />;
    }

    return this.props.children;
  }
}

export default ErrorBoundaryProvider;
