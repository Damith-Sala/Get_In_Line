import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AuthErrorPage from './page'

describe('Auth Error Page', () => {
  it('renders authentication error message', () => {
    render(<AuthErrorPage />)
    
    expect(screen.getByText('Authentication Error')).toBeInTheDocument()
  })

  it('displays error details', () => {
    render(<AuthErrorPage />)
    
    expect(screen.getByText(/There was an error during the authentication process/)).toBeInTheDocument()
    expect(screen.getByText(/Invalid or expired authentication code/)).toBeInTheDocument()
    expect(screen.getByText(/Network connectivity issues/)).toBeInTheDocument()
    expect(screen.getByText(/Server configuration problems/)).toBeInTheDocument()
  })

  it('has working navigation links', () => {
    render(<AuthErrorPage />)
    
    const loginLink = screen.getByRole('link', { name: /try logging in again/i })
    const homeLink = screen.getByRole('link', { name: /go to home page/i })
    
    expect(loginLink).toHaveAttribute('href', '/login')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('renders error icon', () => {
    render(<AuthErrorPage />)
    
    // Check for the error icon (red circle with exclamation)
    const errorIcon = document.querySelector('svg')
    expect(errorIcon).toBeInTheDocument()
  })
})
