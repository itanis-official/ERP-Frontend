// hooks/usePersistedTimer.ts
// Ce hook persiste le timer dans localStorage pour survivre aux changements de page.

import { useState, useEffect, useRef, useCallback } from 'react'

const STORAGE_KEY = 'kanban_active_timer'

interface PersistedTimer {
  subTaskId: string
  taskId: string
  /** Timestamp (ms) du dernier démarrage de session */
  sessionStart: number
  /** Secondes accumulées dans les sessions précédentes */
  accumulatedSeconds: number
  isRunning: boolean
}

interface ActiveTimer {
  subTaskId: string
  taskId: string
  sessionStart: number
  totalSeconds: number
  isRunning: boolean
}

// ─── Helpers localStorage ─────────────────────────────────────────────────────

function saveTimer(timer: PersistedTimer | null) {
  if (timer === null) {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timer))
  }
}

function loadTimer(): PersistedTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedTimer) : null
  } catch {
    return null
  }
}

/**
 * Calcule le nombre de secondes affichées pour un timer persisté.
 * Si le timer tourne, on ajoute le temps écoulé depuis sessionStart.
 */
function computeElapsedSeconds(persisted: PersistedTimer): number {
  let elapsed = persisted.accumulatedSeconds
  if (persisted.isRunning) {
    elapsed += Math.floor((Date.now() - persisted.sessionStart) / 1000)
  }
  return elapsed
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function usePersistedTimer(
  onStop: (subTaskId: string, seconds: number) => Promise<void>
) {
  // Reconstruit l'état depuis localStorage au montage
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(() => {
    const p = loadTimer()
    if (!p) return null
    return {
      subTaskId: p.subTaskId,
      taskId: p.taskId,
      sessionStart: p.sessionStart,
      totalSeconds: computeElapsedSeconds(p),
      isRunning: p.isRunning,
    }
  })

  // Secondes affichées dans l'UI (incrémentées par l'intervalle)
  const [timerSeconds, setTimerSeconds] = useState<number>(() => {
    const p = loadTimer()
    return p ? computeElapsedSeconds(p) : 0
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Synchronise localStorage à chaque changement de activeTimer
  useEffect(() => {
    if (!activeTimer) {
      saveTimer(null)
      return
    }
    const persisted: PersistedTimer = {
      subTaskId: activeTimer.subTaskId,
      taskId: activeTimer.taskId,
      sessionStart: activeTimer.sessionStart,
      accumulatedSeconds: activeTimer.totalSeconds,
      isRunning: activeTimer.isRunning,
    }
    saveTimer(persisted)
  }, [activeTimer])

  // Gère l'intervalle d'affichage
  useEffect(() => {
    if (activeTimer?.isRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [activeTimer?.isRunning])

  // ── Secondes totales affichées ──────────────────────────────────────────────
  // On recompute depuis localStorage si possible pour être précis après retour
  const totalElapsedSeconds = (() => {
    const p = loadTimer()
    if (!p) return timerSeconds
    return computeElapsedSeconds(p)
  })()

  // ── Démarrer ────────────────────────────────────────────────────────────────
  const startTimer = useCallback(
    async (subTaskId: string, taskId: string) => {
      // Si un autre timer tourne → on le stoppe d'abord
      if (activeTimer && activeTimer.subTaskId !== subTaskId) {
        const elapsed = computeElapsedSeconds(loadTimer()!)
        await onStop(activeTimer.subTaskId, elapsed)
      }

      const now = Date.now()
      setTimerSeconds(0)
      setActiveTimer({
        subTaskId,
        taskId,
        sessionStart: now,
        totalSeconds: 0,
        isRunning: true,
      })
    },
    [activeTimer, onStop]
  )

  // ── Pause ───────────────────────────────────────────────────────────────────
  const pauseTimer = useCallback(async () => {
    if (!activeTimer?.isRunning) return

    const p = loadTimer()
    const elapsed = p ? computeElapsedSeconds(p) : timerSeconds

    // Enregistre le temps avant la pause
    await onStop(activeTimer.subTaskId, elapsed)

    setTimerSeconds(elapsed)
    setActiveTimer(prev =>
      prev
        ? { ...prev, isRunning: false, totalSeconds: elapsed }
        : null
    )
  }, [activeTimer, timerSeconds, onStop])

  // ── Reprendre ───────────────────────────────────────────────────────────────
  const resumeTimer = useCallback(() => {
    if (!activeTimer || activeTimer.isRunning) return

    setActiveTimer(prev =>
      prev
        ? { ...prev, sessionStart: Date.now(), isRunning: true }
        : null
    )
  }, [activeTimer])

  // ── Arrêter ─────────────────────────────────────────────────────────────────
  const stopTimer = useCallback(async () => {
    if (!activeTimer) return

    const p = loadTimer()
    const elapsed = p ? computeElapsedSeconds(p) : timerSeconds

    if (elapsed > 0) {
      await onStop(activeTimer.subTaskId, elapsed)
    }

    setActiveTimer(null)
    setTimerSeconds(0)
    saveTimer(null)
  }, [activeTimer, timerSeconds, onStop])

 

  return {
    activeTimer,
    timerSeconds: totalElapsedSeconds,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
  }
}