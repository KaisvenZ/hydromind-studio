import { useEffect, useRef, useState } from 'react'

export function useFlashAnimation<T extends number | string>(value: T): boolean {
  const prevRef = useRef(value)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(true)
      const timer = setTimeout(() => setFlash(false), 600)
      prevRef.current = value
      return () => clearTimeout(timer)
    }
  }, [value])

  return flash
}
