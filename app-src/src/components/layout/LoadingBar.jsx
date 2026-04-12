import { useEffect, useRef, useState, useCallback } from 'react'
import React from 'react'
import PropTypes from 'prop-types'
import { useAtomValue } from 'jotai'
import { networkRequestsAtom } from '../../common/store/atoms/uiAtoms'
import './LoadingBar.css'

/**
 * LoadingBar: shows a thin progress bar while there are active network requests.
 * It is driven by the `networkRequestsAtom` in the central store.
 */
const LoadingBar = React.memo(function LoadingBar({ force = false }) {
  const [visible, setVisible] = useState(false)
  const [percent, setPercent] = useState(0)
  const timerRef = useRef(null)
  const finishTimeoutRef = useRef(null)
  const requestsRef = useRef(0)

  const stop = useCallback(() => {
    clearInterval(timerRef.current)
    clearTimeout(finishTimeoutRef.current)
    setPercent(100)
    setTimeout(() => {
      setVisible(false)
      setPercent(0)
    }, 120)
  }, [])

  const start = useCallback(() => {
    clearInterval(timerRef.current)
    clearTimeout(finishTimeoutRef.current)
    setVisible(true)
    setPercent(6)
    timerRef.current = setInterval(() => {
      setPercent((p) => Math.min(90, p + Math.random() * 6))
    }, 160)
    finishTimeoutRef.current = setTimeout(() => stop(), 15000)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // stop is intentionally omitted from deps as it's a stable function that
  // should not cause start to recreate when stop is recreated

  const atomCount = useAtomValue(networkRequestsAtom)

  useEffect(() => {
    if (atomCount !== null) {
      requestsRef.current = atomCount
      if (atomCount > 0) start()
      else stop()
    }
  }, [atomCount, start, stop])

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
  }, [start, stop])

  useEffect(() => {
    if (force) {
      start()
    } else {
      if (requestsRef.current === 0) stop()
    }
    return () => {
      if (force) {
        if (requestsRef.current === 0) stop()
      }
    }
  }, [force, start, stop])

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      clearTimeout(finishTimeoutRef.current)
    }
  }, [])

  return (
    <div
      className={`loading-bar ${visible ? 'visible' : ''}`}
      aria-hidden={!visible}
    >
      <div className="loading-bar-progress" style={{ width: `${percent}%` }} />
    </div>
  )
})

LoadingBar.propTypes = {
  force: PropTypes.bool,
}

export default LoadingBar
