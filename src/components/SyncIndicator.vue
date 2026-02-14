<script setup lang="ts">
import { computed } from 'vue'
import { useSyncStore } from '../stores/sync'

const sync = useSyncStore()

const running = computed(() => sync.status?.running ?? false)

const tooltip = computed(() => {
  const s = sync.status
  if (!s) return 'Sync status unknown'
  if (!s.running) {
    if (!s.lastCompletedAt) return 'Synchronization not yet run'
    const d = new Date(s.lastCompletedAt)
    return `Last sync: ${d.toLocaleString('sk-SK')}`
  }
  const parts = [`Syncing: ${s.currentTown ?? '...'}`]
  if (s.currentSeason) parts.push(s.currentSeason)
  if (s.currentPhase === 'meetings' && s.totalMeetings > 0) {
    parts.push(`${s.processedMeetings}/${s.totalMeetings} meetings`)
  }
  return parts.join(' - ')
})
</script>

<template>
  <q-btn flat round :icon="running ? 'sync' : 'cloud_done'" :class="{ 'sync-spinning': running }">
    <q-tooltip>{{ tooltip }}</q-tooltip>
  </q-btn>
</template>

<style scoped>
.sync-spinning :deep(.q-icon) {
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
