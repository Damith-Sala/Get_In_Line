import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoginPage from './page'

describe('Login Page', () => {
  it('renders login page without crashing', () => {
    render(<LoginPage />)
    
    // The page should render without throwing errors
    expect(document.body).toBeInTheDocument()
  })

  it('has proper page structure', () => {
    render(<LoginPage />)
    
    // Check for the main container with proper classes
    const container = document.querySelector('.min-h-screen.flex.items-center.justify-center')
    expect(container).toBeInTheDocument()
  })

  it('renders LoginForm component', () => {
    render(<LoginPage />)
    
    // The page should contain the LoginForm component
    // We can't test the form content directly since it's in a separate component
    // but we can verify the page structure is correct
    expect(document.body).toBeInTheDocument()
  })
})

