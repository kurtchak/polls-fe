<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSyncStore } from '../stores/sync'

const sync = useSyncStore()

const running = computed(() => sync.status?.running ?? false)
const triggering = ref(false)

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

async function onTrigger() {
  triggering.value = true
  try {
    await sync.triggerSync()
  } catch {
    // ignore – already running or backend unreachable
  } finally {
    triggering.value = false
  }
}
</script>

<template>
  <q-btn
    flat round
    :icon="running ? 'sync' : 'cloud_done'"
    :class="{ 'sync-spinning': running }"
    @click="onTrigger"
    :disable="running || triggering"
  >
    <q-tooltip>{{ tooltip }}<template v-if="!running"><br>Click to sync</template></q-tooltip>
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