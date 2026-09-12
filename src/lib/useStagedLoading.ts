import { useRef, useState } from 'react'

/** Drives a sequence of staged loading messages, then calls back when done. Purely cosmetic — no real work happens between stages. */
export function useStagedLoading(stages: string[], stepMs = 500) {
  const [isRunning, setIsRunning] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  function start(onDone: () => void) {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setIsRunning(true)
    setStageIndex(0)
    stages.forEach((_, i) => {
      if (i > 0) timers.current.push(setTimeout(() => setStageIndex(i), stepMs * i))
    })
    timers.current.push(setTimeout(onDone, stepMs * stages.length))
  }

  return { isRunning, stageIndex, start }
}
