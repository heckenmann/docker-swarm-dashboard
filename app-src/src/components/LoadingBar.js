import React, { useEffect, useRef, useState } from 'react'
import { useAtomValue } from 'jotai'
import { networkRequestsAtom } from '../common/store/atoms'

/**
 * LoadingBar: shows a thin progress bar while there are active network requests.
 * It is driven by the `networkRequestsAtom` in the central store.
 */
function LoadingBar({ force = false }) {
  const [visible, setVisible] = useState(false)
  const [percent, setPercent] = useState(0)
  const timerRef = useRef(null)
  const finishTimeoutRef = useRef(null)
  const requestsRef = useRef(0)

  // Read the current outstanding network requests from the Jotai atom.
  // This requires the component to be rendered inside a Jotai Provider (store).
  // We call the hook at top-level to follow the rules of hooks. If Jotai is
  // not available in the render environment the hook will still work in tests
  // because Jotai is part of the app dependencies.
  const atomCount = useAtomValue(networkRequestsAtom)

  useEffect(() => {
    // If atomCount is available, drive visibility from it.
    if (atomCount != null) {
      requestsRef.current = atomCount
      if (atomCount > 0) start()
      else stop()
    }
  }, [atomCount])

  // Backwards-compat: support older tests and code paths that dispatch
  // window events ('network-request-start' / 'network-request-end'). This
  // keeps tests that use window.dispatchEvent working.
  useEffect(() => {
    const onStart = () => {
      requestsRef.current = Math.max(0, requestsRef.current + 1)
      start()
    }
    const onEnd = () => {
      requestsRef.current = Math.max(0, requestsRef.current - 1)
      if (requestsRef.current <= 0) stop()
    }

    window.addEventListener('network-request-start', onStart)
    window.addEventListener('network-request-end', onEnd)

    return () => {
      window.removeEventListener('network-request-start', onStart)
      window.removeEventListener('network-request-end', onEnd)
    }
  }, [])

  // If `force` is true, ensure the bar is shown while mounted/force is true.
  useEffect(() => {
    if (force) {
      // show immediately
      start()
    } else {
      // if no active requests, hide
      if (requestsRef.current === 0) stop()
    }
    // cleanup when force toggles off
    return () => {
      if (force) {
        // if force was true and unmounted, hide
        if (requestsRef.current === 0) stop()
      }
    }
  }, [force])

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      clearTimeout(finishTimeoutRef.current)
    }
  }, [])

  function start() {
    clearInterval(timerRef.current)
    clearTimeout(finishTimeoutRef.current)
    setVisible(true)
    setPercent(6)
    timerRef.current = setInterval(() => {
      setPercent((p) => Math.min(90, p + Math.random() * 6))
    }, 160)
    // safety ceiling
    finishTimeoutRef.current = setTimeout(() => stop(), 15000)
  }

  function stop() {
    clearInterval(timerRef.current)
    clearTimeout(finishTimeoutRef.current)
    setPercent(100)
    setTimeout(() => {
      setVisible(false)
      setPercent(0)
    }, 120)
  }

  return (
    <div
      className={`loading-bar ${visible ? 'visible' : ''}`}
      aria-hidden={!visible}
    >
      <div className="loading-bar-progress" style={{ width: `${percent}%` }} />
    </div>
  )
}

export default LoadingBar
