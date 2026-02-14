import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchSyncStatus } from '../api'
import type { SyncStatus } from '../types'

export const useSyncStore = defineStore('sync', () => {
  const status = ref<SyncStatus | null>(null)
  let intervalId: ReturnType<typeof setInterval> | null = null

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
    intervalId = setInterval(poll, 15_000)
  }

  function stopPolling() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  return { status, startPolling, stopPolling }
})
