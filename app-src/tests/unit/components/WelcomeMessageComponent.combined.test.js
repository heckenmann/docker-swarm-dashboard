import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

describe('WelcomeMessageComponent (combined)', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })
  test('shows welcome message when enabled', () => {
    jest.isolateModules(() => {
      jest.doMock('../../../src/common/store/atoms', () => ({
        showWelcomeMessageAtom: true,
        dashboardSettingsAtom: { welcomeMessage: 'hello' },
        currentVariantClassesAtom: 'bg-light',
      }))
      jest.doMock('jotai', () => ({
        useAtom: (a) => [a, () => {}],
        useAtomValue: (a) => a,
      }))
      jest.doMock('react-bootstrap', () => {
        const Modal = ({ show, children, contentClassName }) =>
          show
            ? React.createElement(
                'div',
                { className: contentClassName || '' },
                children,
              )
            : null
        const Header = ({ children }) =>
          React.createElement('div', null, children)
        const Title = ({ children }) =>
          React.createElement('div', null, children)
        const Body = ({ children }) =>
          React.createElement('div', null, children)
        const Footer = ({ children }) =>
          React.createElement('div', null, children)
        Modal.Header = Header
        Modal.Title = Title
        Modal.Body = Body
        Modal.Footer = Footer
        const Button = ({ onClick, children }) =>
          React.createElement('button', { onClick }, children)
        return { Modal, Button }
      })
      jest.doMock('@fortawesome/react-fontawesome', () => ({
        FontAwesomeIcon: () => React.createElement('span', null, 'ICON'),
      }))

      const mod = require('../../../src/components/WelcomeMessageComponent')
      const Comp = mod.WelcomeMessageComponent || mod.default || mod
      render(React.createElement(Comp))
      expect(screen.getByText('hello')).toBeInTheDocument()
    })
  })

  test('modal Close does not throw and respects show flag', () => {
    jest.isolateModules(() => {
      // happy path modal with close
      jest.doMock('../../../src/common/store/atoms', () => ({
        showWelcomeMessageAtom: true,
        dashboardSettingsAtom: { welcomeMessage: 'hi' },
        currentVariantClassesAtom: 'cls',
      }))
      jest.doMock('jotai', () => ({
        useAtom: (a) => [a, jest.fn()],
        useAtomValue: (a) => a,
      }))
      jest.doMock('react-bootstrap', () => {
        const Modal = ({ show, children, contentClassName }) =>
          show
            ? React.createElement(
                'div',
                { className: contentClassName || '' },
                children,
              )
            : null
        const Header = ({ children }) =>
          React.createElement('div', null, children)
        const Title = ({ children }) =>
          React.createElement('div', null, children)
        const Body = ({ children }) =>
          React.createElement('div', null, children)
        const Footer = ({ children }) =>
          React.createElement('div', null, children)
        Modal.Header = Header
        Modal.Title = Title
        Modal.Body = Body
        Modal.Footer = Footer
        const Button = ({ onClick, children }) =>
          React.createElement('button', { onClick }, children)
        return { Modal, Button }
      })
      jest.doMock('@fortawesome/react-fontawesome', () => ({
        FontAwesomeIcon: () => React.createElement('span', null, 'ICON'),
      }))

      const mod = require('../../../src/components/WelcomeMessageComponent')
      const Comp = mod.WelcomeMessageComponent || mod.default || mod
      render(React.createElement(Comp))
      const msg = screen.getByText('hi')
      expect(msg).toBeInTheDocument()
      const btn = screen.getByText(/Close/i)
      fireEvent.click(btn)
    })
  })

  test('onHide prop calls setShowWelcomeMessage(false)', () => {
    jest.isolateModules(() => {
      const mockSet = jest.fn()
      jest.doMock('../../../src/common/store/atoms', () => ({
        showWelcomeMessageAtom: true,
        dashboardSettingsAtom: { welcomeMessage: 'hide-me' },
        currentVariantClassesAtom: 'cls',
      }))
      jest.doMock('jotai', () => ({
        useAtom: () => [true, mockSet],
        useAtomValue: (a) => a,
      }))
      jest.doMock('react-bootstrap', () => {
        const Modal = ({ show, onHide, children }) =>
          show
            ? React.createElement('div', { onClick: onHide }, children)
            : null
        const Header = ({ children }) =>
          React.createElement('div', null, children)
        const Title = ({ children }) =>
          React.createElement('div', null, children)
        const Body = ({ children }) =>
          React.createElement('div', null, children)
        const Footer = ({ children }) =>
          React.createElement('div', null, children)
        Modal.Header = Header
        Modal.Title = Title
        Modal.Body = Body
        Modal.Footer = Footer
        const Button = ({ children }) =>
          React.createElement('button', null, children)
        return { Modal, Button }
      })
      jest.doMock('@fortawesome/react-fontawesome', () => ({
        FontAwesomeIcon: () => React.createElement('span', null, 'ICON'),
      }))

      const mod = require('../../../src/components/WelcomeMessageComponent')
      const Comp = mod.WelcomeMessageComponent || mod.default || mod
      const { container } = render(React.createElement(Comp))
      // simulate onHide by clicking the container which calls onHide
      fireEvent.click(container.firstChild)
      expect(mockSet).toHaveBeenCalledWith(false)
    })
  })

  test('does not render when show is false or welcomeMessage missing', () => {
    jest.isolateModules(() => {
      jest.doMock('react-bootstrap', () => {
        const Modal = ({ show, children }) =>
          show ? React.createElement('div', null, children) : null
        const Header = ({ children }) =>
          React.createElement('div', null, children)
        const Title = ({ children }) =>
          React.createElement('div', null, children)
        const Body = ({ children }) =>
          React.createElement('div', null, children)
        const Footer = ({ children }) =>
          React.createElement('div', null, children)
        Modal.Header = Header
        Modal.Title = Title
        Modal.Body = Body
        Modal.Footer = Footer
        const Button = ({ children }) =>
          React.createElement('button', null, children)
        return { Modal, Button }
      })

      const mockSet = jest.fn()
      jest.doMock('jotai', () => ({
        atom: (v) => v,
        useAtom: () => [false, mockSet],
        useAtomValue: () => ({ welcomeMessage: 'x' }),
      }))
      jest.doMock('jotai/utils', () => ({
        atomWithReducer: (v) => v,
        atomWithReset: (v) => v,
        selectAtom: (a) => a,
        atomWithHash: (k, def) => def,
      }))
      jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

      const mod = require('../../../src/components/WelcomeMessageComponent')
      const Comp = mod.WelcomeMessageComponent || mod.default || mod
      const { queryByText } = render(React.createElement(Comp))
      expect(queryByText('x')).toBeNull()
    })

    jest.isolateModules(() => {
      jest.doMock('react-bootstrap', () => {
        const Modal = ({ show, children }) =>
          show ? React.createElement('div', null, children) : null
        const Header = ({ children }) =>
          React.createElement('div', null, children)
        const Title = ({ children }) =>
          React.createElement('div', null, children)
        const Body = ({ children }) =>
          React.createElement('div', null, children)
        const Footer = ({ children }) =>
          React.createElement('div', null, children)
        Modal.Header = Header
        Modal.Title = Title
        Modal.Body = Body
        Modal.Footer = Footer
        const Button = ({ children }) =>
          React.createElement('button', null, children)
        return { Modal, Button }
      })

      const mockSet = jest.fn()
      jest.doMock('jotai', () => ({
        atom: (v) => v,
        useAtom: () => [true, mockSet],
        useAtomValue: () => ({}),
      }))
      jest.doMock('jotai/utils', () => ({
        atomWithReducer: (v) => v,
        atomWithReset: (v) => v,
        selectAtom: (a) => a,
        atomWithHash: (k, def) => def,
      }))
      jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

      const mod = require('../../../src/components/WelcomeMessageComponent')
      const Comp = mod.WelcomeMessageComponent || mod.default || mod
      const { queryByText } = render(React.createElement(Comp))
      expect(queryByText(/Close/i)).toBeNull()
    })
  })

  test('applies contentClassName from currentVariantClassesAtom', () => {
    jest.isolateModules(() => {
      jest.doMock('react-bootstrap', () => {
        const Modal = ({ show, contentClassName, children }) =>
          show
            ? React.createElement(
                'div',
                { className: contentClassName || '' },
                children,
              )
            : null
        const Header = ({ children }) =>
          React.createElement('div', null, children)
        const Title = ({ children }) =>
          React.createElement('div', null, children)
        const Body = ({ children }) =>
          React.createElement('div', null, children)
        const Footer = ({ children }) =>
          React.createElement('div', null, children)
        Modal.Header = Header
        Modal.Title = Title
        Modal.Body = Body
        Modal.Footer = Footer
        const Button = ({ children }) =>
          React.createElement('button', null, children)
        return { Modal, Button }
      })

      jest.doMock('../../../src/common/store/atoms', () => ({
        showWelcomeMessageAtom: true,
        dashboardSettingsAtom: { welcomeMessage: 'hello' },
        currentVariantClassesAtom: 'my-variant',
      }))
      jest.doMock('jotai', () => ({
        useAtom: (a) => [a, jest.fn()],
        useAtomValue: (a) => a,
      }))
      jest.doMock('jotai/utils', () => ({
        atomWithReducer: (v) => v,
        atomWithReset: (v) => v,
        selectAtom: (a) => a,
        atomWithHash: (k, def) => def,
      }))
      jest.doMock('jotai-location', () => ({ atomWithHash: (k, def) => def }))

      const mod = require('../../../src/components/WelcomeMessageComponent')
      const Comp = mod.WelcomeMessageComponent || mod.default || mod
      const { container } = render(React.createElement(Comp))
      expect(container.querySelector('.my-variant')).toBeTruthy()
    })
  })

  test('Close button calls setShowWelcomeMessage(false)', () => {
    jest.isolateModules(() => {
      const mockSet = jest.fn()
      jest.doMock('../../../src/common/store/atoms', () => ({
        showWelcomeMessageAtom: true,
        dashboardSettingsAtom: { welcomeMessage: 'bye' },
        currentVariantClassesAtom: 'cls',
      }))
      jest.doMock('jotai', () => ({
        useAtom: () => [true, mockSet],
        useAtomValue: (a) => a,
      }))
      jest.doMock('react-bootstrap', () => {
        const Modal = ({ show, children, contentClassName }) =>
          show
            ? React.createElement(
                'div',
                { className: contentClassName || '' },
                children,
              )
            : null
        const Header = ({ children }) =>
          React.createElement('div', null, children)
        const Title = ({ children }) =>
          React.createElement('div', null, children)
        const Body = ({ children }) =>
          React.createElement('div', null, children)
        const Footer = ({ children }) =>
          React.createElement('div', null, children)
        Modal.Header = Header
        Modal.Title = Title
        Modal.Body = Body
        Modal.Footer = Footer
        const Button = ({ onClick, children }) =>
          React.createElement('button', { onClick }, children)
        return { Modal, Button }
      })
      jest.doMock('@fortawesome/react-fontawesome', () => ({
        FontAwesomeIcon: () => React.createElement('span', null, 'ICON'),
      }))

      const mod = require('../../../src/components/WelcomeMessageComponent')
      const Comp = mod.WelcomeMessageComponent || mod.default || mod
      render(React.createElement(Comp))
      const btn = screen.getByText(/Close/i)
      fireEvent.click(btn)
      expect(mockSet).toHaveBeenCalledWith(false)
    })
  })
})
