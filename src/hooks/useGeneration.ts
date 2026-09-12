import { useEffect, useRef, useState } from 'react'
import { api, isAbort } from '@/api/client'
import type { Generation, GenerationStatus } from '@/types/interior'

const POLL_MS = 700
const RETRY_MS = 2500

export const isTerminal = (status: GenerationStatus) => status === 'succeeded' || status === 'failed' || status === 'stale'

/**
 * Polls a generation until it reaches a terminal state. Because the id comes
 * from the project (`latestGenerationId`), a refresh or navigation resumes
 * polling the same job instead of starting a new one.
 */
export function useGenerationPolling(projectId: string, generationId: string | null, onSettled: (generation: Generation, wasRunning: boolean) => void) {
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [error, setError] = useState<unknown>(null)
  const onSettledRef = useRef(onSettled)
  onSettledRef.current = onSettled

  useEffect(() => {
    if (!generationId) {
      setGeneration(null)
      return
    }
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let sawRunning = false

    const tick = async () => {
      try {
        const next = await api.getGeneration(projectId, generationId, controller.signal)
        setGeneration(next)
        setError(null)
        if (isTerminal(next.status)) onSettledRef.current(next, sawRunning)
        else {
          sawRunning = true
          timer = setTimeout(tick, POLL_MS)
        }
      } catch (err) {
        if (isAbort(err)) return
        setError(err)
        timer = setTimeout(tick, RETRY_MS)
      }
    }
    setGeneration((current) => (current?.id === generationId ? current : null))
    tick()
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [projectId, generationId])

  const active = generationId !== null && (generation === null || generation.id !== generationId || !isTerminal(generation.status))
  return { generation: generation?.id === generationId ? generation : null, error, active }
}
