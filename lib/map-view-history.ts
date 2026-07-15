export type MapViewState = {
  lat: number
  lng: number
  zoom: number
  bearing?: number
  pitch?: number
}

const MAX_HISTORY = 40
const SAME_EPS = 0.0008
const ZOOM_EPS = 0.15

function viewsEqual(a: MapViewState, b: MapViewState): boolean {
  return (
    Math.abs(a.lat - b.lat) < SAME_EPS
    && Math.abs(a.lng - b.lng) < SAME_EPS
    && Math.abs(a.zoom - b.zoom) < ZOOM_EPS
  )
}

export type MapViewHistory = {
  push: (state: MapViewState) => void
  back: () => MapViewState | null
  forward: () => MapViewState | null
  canGoBack: () => boolean
  canGoForward: () => boolean
  clear: () => void
  current: () => MapViewState | null
}

/** In-memory back/forward stack for map pan/zoom (upgrade 317). */
export function createMapViewHistory(): MapViewHistory {
  const stack: MapViewState[] = []
  let index = -1

  const push = (state: MapViewState) => {
    if (index >= 0 && viewsEqual(stack[index], state)) return
    stack.splice(index + 1)
    stack.push({ ...state })
    if (stack.length > MAX_HISTORY) stack.shift()
    else index += 1
  }

  const back = (): MapViewState | null => {
    if (index <= 0) return null
    index -= 1
    return { ...stack[index] }
  }

  const forward = (): MapViewState | null => {
    if (index >= stack.length - 1) return null
    index += 1
    return { ...stack[index] }
  }

  return {
    push,
    back,
    forward,
    canGoBack: () => index > 0,
    canGoForward: () => index < stack.length - 1,
    clear: () => {
      stack.length = 0
      index = -1
    },
    current: () => (index >= 0 ? { ...stack[index] } : null),
  }
}