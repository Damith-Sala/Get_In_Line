import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './page'

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    
    expect(screen.getByText('Get In Line')).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<Home />)
    
    expect(screen.getByText('Skip the wait, join the digital queue')).toBeInTheDocument()
  })

  it('renders all three main cards', () => {
    render(<Home />)
    
    expect(screen.getByText('Browse Queues')).toBeInTheDocument()
    expect(screen.getByText('Join as Customer')).toBeInTheDocument()
    expect(screen.getByText('Create as Business')).toBeInTheDocument()
  })

  it('has working navigation links', () => {
    render(<Home />)
    
    expect(screen.getByRole('link', { name: /view all queues/i })).toHaveAttribute('href', '/guest-queues')
    expect(screen.getByRole('link', { name: /sign up as customer/i })).toHaveAttribute('href', '/signup')
    expect(screen.getByRole('link', { name: /sign up as business/i })).toHaveAttribute('href', '/signup/business')
  })

  it('renders login section', () => {
    render(<Home />)
    
    expect(screen.getByText('Already have an account?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login')
  })
})

