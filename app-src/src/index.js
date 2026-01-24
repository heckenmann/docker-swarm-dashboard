import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { Provider, createStore } from 'jotai'
import { networkRequestsAtom } from './common/store/atoms'

// Wrap global fetch so we can track active network requests and show the loading bar
const originalFetch = window.fetch
window.fetch = async function (...args) {
  try {
    // increment
    const ev = new CustomEvent('network-request-start')
    // Increment the network request counter in the Jotai store asynchronously.
    Promise.resolve().then(() => {
      try {
        const prev = store.get(networkRequestsAtom)
        store.set(networkRequestsAtom, (prev || 0) + 1)
      } catch (e) {
        // nothing
      }
    })
  } catch (e) {
    // ignore
  }
  try {
    const res = await originalFetch.apply(this, args)
    return res
  } finally {
    try {
      const ev2 = new CustomEvent('network-request-end')
      // Decrement the network request counter in the Jotai store asynchronously.
      Promise.resolve().then(() => {
        try {
          const prev = store.get(networkRequestsAtom)
          store.set(networkRequestsAtom, Math.max(0, (prev || 0) - 1))
        } catch (e) {
          // nothing
        }
      })
    } catch (e) {
      // ignore
    }
  }
}

const container = document.getElementById('root')
const root = createRoot(container)

// Create a dedicated Jotai store instance so we can update atoms from outside React.
const store = createStore()

// don't expose the internal store in production

root.render(
  <Provider store={store}>
    <App />
  </Provider>,
)
