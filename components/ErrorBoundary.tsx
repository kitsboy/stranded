'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import Link from 'next/link'

type Props = { children: ReactNode; label?: string }
type State = { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Stranded ErrorBoundary]', this.props.label ?? 'app', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[40vh] flex items-center justify-center px-6 py-16" role="alert">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
            <p className="text-sm text-gray-400">
              This section hit an unexpected error. The rest of Stranded should still work — try refreshing or go home.
            </p>
            <p className="text-xs text-gray-600 font-mono break-all">{this.state.error.message}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={() => this.setState({ error: null })}
                className="px-4 py-2 rounded-xl bg-[#FF8C00] text-black text-sm font-semibold"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl border border-white/20 text-sm hover:bg-white/5"
              >
                Reload page
              </button>
              <Link href="/" className="px-4 py-2 rounded-xl border border-[#5BC0BE]/40 text-[#5BC0BE] text-sm hover:bg-[#5BC0BE]/10">
                Home
              </Link>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}