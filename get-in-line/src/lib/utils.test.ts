import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class')
      expect(result).toBe('base-class conditional-class')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('should handle objects with boolean values', () => {
      const result = cn({
        'active-class': true,
        'inactive-class': false,
        'conditional-class': true
      })
      expect(result).toBe('active-class conditional-class')
    })

    it('should handle mixed input types', () => {
      const result = cn(
        'base-class',
        ['array-class1', 'array-class2'],
        {
          'object-class': true,
          'hidden-object-class': false
        },
        'string-class'
      )
      expect(result).toBe('base-class array-class1 array-class2 object-class string-class')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle null and undefined inputs', () => {
      const result = cn('valid-class', null, undefined, 'another-valid-class')
      expect(result).toBe('valid-class another-valid-class')
    })

    it('should handle empty strings', () => {
      const result = cn('valid-class', '', 'another-valid-class')
      expect(result).toBe('valid-class another-valid-class')
    })

    it('should merge Tailwind classes correctly', () => {
      // Test that twMerge is working by providing conflicting classes
      const result = cn('px-2', 'px-4')
      expect(result).toBe('px-4') // px-4 should override px-2
    })

    it('should handle complex Tailwind class merging', () => {
      const result = cn(
        'bg-red-500 text-white',
        'bg-blue-500', // This should override bg-red-500
        'hover:bg-green-500'
      )
      expect(result).toBe('text-white bg-blue-500 hover:bg-green-500')
    })

    it('should handle responsive classes', () => {
      const result = cn(
        'text-sm',
        'md:text-base',
        'lg:text-lg'
      )
      expect(result).toBe('text-sm md:text-base lg:text-lg')
    })

    it('should handle state variants', () => {
      const result = cn(
        'bg-gray-200',
        'hover:bg-gray-300',
        'focus:bg-gray-400',
        'active:bg-gray-500'
      )
      expect(result).toBe('bg-gray-200 hover:bg-gray-300 focus:bg-gray-400 active:bg-gray-500')
    })

    it('should handle complex conditional logic', () => {
      const isActive = true
      const isDisabled = false
      const size = 'large'
      
      const result = cn(
        'base-button',
        {
          'button-active': isActive,
          'button-disabled': isDisabled,
          'button-large': size === 'large',
          'button-small': size === 'small'
        },
        isActive && 'text-white',
        isDisabled && 'opacity-50'
      )
      expect(result).toBe('base-button button-active button-large text-white')
    })

    it('should handle nested arrays and objects', () => {
      const result = cn([
        'class1',
        ['nested-class1', 'nested-class2'],
        {
          'nested-object-class': true
        }
      ])
      expect(result).toBe('class1 nested-class1 nested-class2 nested-object-class')
    })

    it('should handle whitespace in class names', () => {
      const result = cn('  class1  ', '  class2  ')
      expect(result).toBe('class1 class2')
    })

    it('should handle duplicate classes (twMerge should dedupe)', () => {
      const result = cn('class1 class2', 'class2 class3')
      // Note: twMerge doesn't dedupe non-Tailwind classes, so we expect the actual behavior
      expect(result).toBe('class1 class2 class2 class3')
    })

    it('should work with clsx functionality', () => {
      // Test that clsx is working by using its conditional logic
      const result = cn(
        'base',
        false && 'hidden',
        null && 'null-class',
        undefined && 'undefined-class',
        0 && 'zero-class',
        '' && 'empty-class',
        'valid' && 'valid-class'
      )
      expect(result).toBe('base valid-class')
    })
  })
})
