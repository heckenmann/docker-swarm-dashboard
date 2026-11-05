import React from 'react'

// Parent tests exercise resource navigation through the real ResourceName wrapper.
export default function MockEntityName({ name, id, onOpen, showOpen }) {
  return (
    <button disabled={!showOpen} onClick={() => onOpen(id)}>
      {name}
    </button>
  )
}
