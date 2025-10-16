import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QueueManagement from './QueueManagement'

// Mock fetch globally
global.fetch = vi.fn()

describe('QueueManagement', () => {
  const mockProps = {
    businessId: 'test-business-id',
    queues: [
      {
        id: '1',
        name: 'Test Queue',
        description: 'Test Description',
        service_type: 'Test Service',
        max_size: 10,
        is_active: true,
        estimated_wait_time: 5,
        current_position: 1,
        total_waiting: 3,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
    ],
    onQueuesChange: vi.fn(),
    onQueueSelect: vi.fn(),
    userPermissions: {
      canCreateQueues: true,
      canEditQueues: true,
      canDeleteQueues: true
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    } as Response)
  })

  it('renders queue management interface', () => {
    render(<QueueManagement {...mockProps} />)
    
    expect(screen.getByText('Queue Management')).toBeInTheDocument()
    expect(screen.getByText('Create and manage your business queues')).toBeInTheDocument()
  })

  it('displays queue information when data is available', () => {
    render(<QueueManagement {...mockProps} />)
    
    expect(screen.getByText('Test Queue')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Service: Test Service')).toBeInTheDocument()
    expect(screen.getByText('Capacity: 10 people')).toBeInTheDocument()
  })

  it('shows create queue button when user has permissions', () => {
    render(<QueueManagement {...mockProps} />)
    
    expect(screen.getByText('Create Queue')).toBeInTheDocument()
  })

  it('hides create queue button when user lacks permissions', () => {
    const propsWithoutCreatePermission = {
      ...mockProps,
      userPermissions: {
        canCreateQueues: false,
        canEditQueues: true,
        canDeleteQueues: true
      }
    }
    
    render(<QueueManagement {...propsWithoutCreatePermission} />)
    
    expect(screen.queryByText('Create Queue')).not.toBeInTheDocument()
  })

  it('shows empty state when no queues exist', () => {
    const propsWithNoQueues = {
      ...mockProps,
      queues: []
    }
    
    render(<QueueManagement {...propsWithNoQueues} />)
    
    expect(screen.getByText('No Queues Yet')).toBeInTheDocument()
    expect(screen.getByText('Create your first queue to start managing customer flow.')).toBeInTheDocument()
  })

  it('handles create queue dialog opening', async () => {
    const user = userEvent.setup()
    render(<QueueManagement {...mockProps} />)
    
    const createButton = screen.getByText('Create Queue')
    await user.click(createButton)
    
    expect(screen.getByText('Create New Queue')).toBeInTheDocument()
    expect(screen.getByText('Set up a new queue for customers to join.')).toBeInTheDocument()
  })
})

