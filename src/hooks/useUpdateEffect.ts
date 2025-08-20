import { useEffect, useRef } from 'react'

/**
 * A hook that runs an effect only after the component has mounted.
 * @param effect - The effect to run.
 * @param deps - The dependencies to watch.
 * @returns void
 */
export function useUpdateEffect(effect: () => void, deps: React.DependencyList) {
  const didMount = useRef(false)

  useEffect(() => {
    if (didMount.current) {
      return effect()
    } else {
      didMount.current = true
    }
  }, deps)
}
