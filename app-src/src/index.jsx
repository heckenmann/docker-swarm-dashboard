import React from 'react'
import { createRoot } from 'react-dom/client'
import { createStore, Provider } from 'jotai'
import './index.css'
import App from './App.jsx'
import { networkRequestsAtom } from './common/store/atoms/uiAtoms'

// Create a dedicated Jotai store instance so we can update atoms from outside React.
const store = createStore()

/**
 * Wraps global fetch to track active network requests and show the loading bar.
 * @param {...*} args - Arguments passed to fetch.
 * @returns {Promise<Response>} The fetch response.
 */

const originalFetch = window.fetch
/**
 *
 * @param {...any} args
 */
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
    if (!res.ok) {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url
      if (url && String(url).includes('/ui/')) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`)
      }
    }
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

root.render(
  <Provider store={store}>
    <App />
  </Provider>,
)
