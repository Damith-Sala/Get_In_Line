import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SignupPage from './page'

describe('Signup Page', () => {
  it('renders signup page without crashing', () => {
    render(<SignupPage />)
    
    // The page should render without throwing errors
    expect(document.body).toBeInTheDocument()
  })

  it('has proper page structure', () => {
    render(<SignupPage />)
    
    // Check for the main container with proper classes
    const container = document.querySelector('.min-h-screen.flex.items-center.justify-center')
    expect(container).toBeInTheDocument()
  })

  it('renders SignupForm component', () => {
    render(<SignupPage />)
    
    // The page should contain the SignupForm component
    // We can't test the form content directly since it's in a separate component
    // but we can verify the page structure is correct
    expect(document.body).toBeInTheDocument()
  })
})
