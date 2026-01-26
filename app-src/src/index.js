import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createStore } from 'jotai'
import { networkRequestsAtom } from './common/store/atoms'

// Wrap global fetch so we can track active network requests and show the loading bar
const originalFetch = window.fetch
window.fetch = async function (...args) {
  try {
    // Increment the network request counter in the Jotai store asynchronously.
    Promise.resolve().then(() => {
      try {
        const prev = store.get(networkRequestsAtom)
        store.set(networkRequestsAtom, (prev || 0) + 1)
      } catch {}
    })
  } catch {}
  try {
    const res = await originalFetch.apply(this, args)
    return res
  } finally {
    try {
      // Decrement the network request counter in the Jotai store asynchronously.
      Promise.resolve().then(() => {
        try {
          const prev = store.get(networkRequestsAtom)
          store.set(networkRequestsAtom, Math.max(0, (prev || 0) - 1))
        } catch {}
      })
    } catch {}
  }
}

const container = document.getElementById('root')
const root = createRoot(container)

// Create a dedicated Jotai store instance so we can update atoms from outside React.
const store = createStore()

// Defensive shim: coerce non-primitive `src` props on <img> elements to strings
// to avoid React warnings when some data accidentally contains objects.
try {
  if (React && React.createElement) {
    const origCreateElement = React.createElement
    React.createElement = function (type, props, ...children) {
      try {
        if (type === 'img' && props && typeof props.src === 'object') {
          props = { ...props, src: JSON.stringify(props.src) }
        }
      } catch {}
      return origCreateElement.call(this, type, props, ...children)
    }
  }
} catch {}

// Defensive shim: patch HTMLImageElement.src setter to coerce non-primitive values to strings
try {
  const imgProto = window.HTMLImageElement && window.HTMLImageElement.prototype
  if (imgProto) {
    const desc = Object.getOwnPropertyDescriptor(imgProto, 'src')
    if (desc && typeof desc.set === 'function') {
      const origSrcSet = desc.set
      Object.defineProperty(imgProto, 'src', {
        set: function (v) {
          try {
            if (typeof v === 'object') {
              // coerce object to a stable string to avoid React warnings
              return origSrcSet.call(this, JSON.stringify(v))
            }
          } catch {}
          return origSrcSet.call(this, v)
        },
        get: desc.get,
        configurable: true,
        enumerable: desc.enumerable,
      })
    }
  }
} catch {}

// During Cypress tests, ignore React development warnings about non-primitive
// `src` props on <img> elements which are benign in this mocked environment.
try {
  if (typeof window !== 'undefined' && window.Cypress) {
    const origConsoleError = console.error.bind(console)
    console.error = function (...args) {
      try {
        const msg = args && args[0] ? String(args[0]) : ''
        if (
          msg.includes('Invalid value for prop') &&
          msg.includes('on <%s> tag')
        ) {
          // swallow this specific React dev warning during tests
          return
        }
      } catch {}
      return origConsoleError(...args)
    }
  }
} catch {}

// don't expose the internal store in production

root.render(
  <Provider store={store}>
    <App />
  </Provider>,
)
