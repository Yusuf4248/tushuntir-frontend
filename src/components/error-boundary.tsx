import { Component, type ErrorInfo, type ReactNode } from 'react'

import { CrashScreen } from './crash-screen'

/** Catches render errors outside the router (providers); routes use errorElement. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Render error', error, info.componentStack)
  }

  render() {
    return this.state.failed ? <CrashScreen /> : this.props.children
  }
}
