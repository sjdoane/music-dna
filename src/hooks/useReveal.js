import { useEffect, useRef } from 'react'

/**
 * Attaches an IntersectionObserver that adds the "visible" CSS class
 * when the element enters the viewport. Works with .reveal and .stagger-children.
 */
export function useReveal(options = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.12, ...options },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}
