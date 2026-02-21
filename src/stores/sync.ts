import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchSyncStatus, triggerSync as apiTriggerSync, subscribeSyncEvents, fetchLastRun } from '../api'
import type { SyncStatus, SyncEvent, LastRunSummary } from '../types'

export const useSyncStore = defineStore('sync', () => {
  const status = ref<SyncStatus | null>(null)
  const consoleEvents = ref<SyncEvent[]>([])
  const lastRun = ref<LastRunSummary | null>(null)
  let intervalId: ReturnType<typeof setInterval> | null = null
  let eventSource: EventSource | null = null
  let initialized = false

  const isRunning = computed(() => status.value?.running ?? false)

  async function poll() {
    try {
      status.value = await fetchSyncStatus()
    } catch {
      // silently ignore – backend may be unreachable
    }
  }

  function startPolling() {
    if (intervalId) return
    poll()
    intervalId = setInterval(poll, 3_000)
  }

  function stopPolling() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function startSSE() {
    if (eventSource) return
    eventSource = subscribeSyncEvents((event: SyncEvent) => {
      consoleEvents.value.push(event)
      if (consoleEvents.value.length > 500) {
        consoleEvents.value = consoleEvents.value.slice(-300)
      }
    })
  }

  function stopSSE() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  }

  async function loadLastRun() {
    try {
      lastRun.value = await fetchLastRun()
      if (lastRun.value.events.length > 0 && consoleEvents.value.length === 0) {
        consoleEvents.value = lastRun.value.events
      }
    } catch {
      // ignore
    }
  }

  function init() {
    if (initialized) return
    initialized = true
    startSSE()
    loadLastRun()
    startPolling()
  }

  async function triggerSync(town?: string) {
    const result = await apiTriggerSync(town)
    consoleEvents.value = []
    await poll()
    return result
  }

  return { status, consoleEvents, lastRun, isRunning, poll, startPolling, stopPolling, startSSE, stopSSE, loadLastRun, triggerSync, init }
})