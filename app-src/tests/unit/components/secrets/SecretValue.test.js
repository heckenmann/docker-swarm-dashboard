/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { SecretValue } from '../../../../src/components/secrets/SecretValue'

describe('SecretValue', () => {
  describe('isValueVisible is true', () => {
    it('renders the secret value', () => {
      render(<SecretValue value="my-secret" isValueVisible={true} />)
      expect(screen.getByText('my-secret')).toBeInTheDocument()
    })
  })

  describe('isValueVisible is false', () => {
    it('renders masked value', () => {
      render(<SecretValue value="my-secret" isValueVisible={false} />)
      expect(screen.getByText('***')).toBeInTheDocument()
    })
  })
})
