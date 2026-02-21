<script setup lang="ts">
import { computed, ref, nextTick, watch, onMounted } from 'vue'
import { useSyncStore } from '../stores/sync'
import type { SyncEvent } from '../types'

const props = defineProps<{
  townFilter?: string
}>()

const sync = useSyncStore()
const consoleRef = ref<HTMLDivElement | null>(null)
const expanded = ref(false)

onMounted(() => {
  sync.init()
})

// Auto-expand when sync starts
watch(() => sync.isRunning, (running) => {
  if (running) expanded.value = true
})

// Filtered events
const displayEvents = computed(() => {
  if (!props.townFilter) return sync.consoleEvents
  return sync.consoleEvents.filter(e => e.town === props.townFilter)
})

// Auto-scroll on new events
watch(() => sync.consoleEvents.length, () => {
  nextTick(() => {
    if (consoleRef.value) {
      consoleRef.value.scrollTop = consoleRef.value.scrollHeight
    }
  })
})

// Summary
interface SummaryLine {
  key: string
  town: string
  season: string
  icon: string
  color: string
  message: string
  running: boolean
  lastEventTs: string
}

const summaryLines = computed<SummaryLine[]>(() => {
  const events = displayEvents.value
  if (events.length === 0) return []

  // Group by town+season
  const groups = new Map<string, SyncEvent[]>()
  for (const e of events) {
    if (!e.town) continue
    const key = e.town + '/' + e.season
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(e)
  }

  const lines: SummaryLine[] = []
  for (const [key, evts] of groups) {
    if (evts.length === 0) continue
    const town = evts[0]!.town
    const season = evts[0]!.season
    const lastEventTs = evts[evts.length - 1]!.timestamp

    // Currently syncing this exact town/season → hourglass
    const currentlyRunning = sync.isRunning
      && sync.status?.currentTown === town
      && (sync.status?.currentSeason === season || !season)

    if (currentlyRunning) {
      const processed = sync.status?.processedMeetings ?? 0
      const total = sync.status?.totalMeetings ?? 0
      const msg = total > 0 ? `Prebieha... (${processed}/${total})` : 'Prebieha...'
      lines.push({ key, town, season, icon: 'sync', color: 'primary', message: msg, running: true, lastEventTs })
      continue
    }

    const hasError = evts.some(e => e.level === 'ERROR')
    const hasWarn = evts.some(e => e.level === 'WARN')
    const hasSuccess = evts.some(e => e.level === 'SUCCESS')

    // Detect "already synced" — all meeting-sync SUCCESS events have 0 new records
    const syncedEvts = evts.filter(e => e.level === 'SUCCESS' && /synced: \d+/.test(e.message))
    const newDataEvts = syncedEvts.filter(e => !/synced: 0/.test(e.message))
    const allAlreadySynced = syncedEvts.length > 0 && newDataEvts.length === 0

    let icon: string
    let color: string
    let message: string

    if (hasError) {
      icon = 'cancel'
      color = 'red'
      message = evts.filter(e => e.level === 'ERROR').pop()!.message
    } else if (hasWarn && !hasSuccess) {
      icon = 'warning'
      color = 'orange'
      message = evts.filter(e => e.level === 'WARN').pop()!.message
    } else if (hasSuccess) {
      if (allAlreadySynced) {
        icon = 'check_circle'
        color = 'blue-grey'
        message = `Uz synchronizovane (${syncedEvts.length} zasadnuti, ziadne nove data)`
      } else {
        icon = 'check_circle'
        color = 'green'
        message = newDataEvts.length > 0
          ? `${newDataEvts.length} zasadnuti s novymi datami`
          : evts.filter(e => e.level === 'SUCCESS').pop()!.message
      }
    } else {
      // Only INFO events — sync finished for this group without issues
      icon = 'check_circle'
      color = 'green'
      message = evts[evts.length - 1]!.message
    }

    lines.push({ key, town, season, icon, color, message, running: false, lastEventTs })
  }

  // Sort: newest completed first, running items at top
  lines.sort((a, b) => {
    if (a.running && !b.running) return 0
    if (!a.running && b.running) return 1
    // Both completed or both running — newest first
    return b.lastEventTs.localeCompare(a.lastEventTs)
  })

  return lines
})

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('sk')
}

function formatTs(ts: string | null): string {
  if (!ts) return '\u2014'
  const d = new Date(ts)
  return d.toLocaleDateString('sk') + ' ' + d.toLocaleTimeString('sk')
}

async function handleTriggerSync() {
  try {
    await sync.triggerSync(props.townFilter)
  } catch {
    // ignore
  }
}
</script>

<template>
  <div class="q-mt-md">
    <!-- Foldable header -->
    <div
      class="row items-center cursor-pointer q-pa-sm rounded-borders fold-header"
      @click="expanded = !expanded"
    >
      <q-icon
        :name="expanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right'"
        size="sm"
        class="q-mr-sm"
      />
      <span class="text-subtitle2 text-weight-bold">Sync konzola</span>
      <q-icon
        v-if="sync.isRunning"
        name="fiber_manual_record"
        color="green"
        size="10px"
        class="q-ml-sm"
      />
      <span v-if="sync.isRunning" class="text-caption text-green q-ml-xs">
        {{ sync.status?.currentTown }}
        <template v-if="sync.status?.currentSeason"> / {{ sync.status.currentSeason }}</template>
      </span>
      <q-space />
      <q-btn
        flat dense size="sm"
        icon="play_arrow"
        label="Sync"
        color="primary"
        :disable="sync.isRunning"
        @click.stop="handleTriggerSync"
      />
    </div>

    <!-- Foldable content -->
    <div v-show="expanded" class="row q-gutter-md q-mt-sm">
      <!-- Left: Console (col-7) -->
      <div class="col-7">
        <q-card flat bordered class="console-card">
          <q-card-section class="console-header row items-center q-py-sm">
            <q-icon
              :name="sync.isRunning ? 'fiber_manual_record' : 'circle'"
              :color="sync.isRunning ? 'green' : 'grey'"
              size="12px"
              class="q-mr-sm"
            />
            <span v-if="sync.isRunning" class="text-weight-medium">
              Sync bezi...
              <span v-if="sync.status?.currentTown" class="text-caption text-grey q-ml-sm">
                {{ sync.status.currentTown }}
                <template v-if="sync.status?.currentSeason"> / {{ sync.status.currentSeason }}</template>
              </span>
            </span>
            <span v-else class="text-weight-medium text-grey">
              Posledny sync
              <span v-if="sync.lastRun?.completedAt" class="text-caption q-ml-sm">
                {{ formatTs(sync.lastRun.completedAt) }}
              </span>
            </span>
          </q-card-section>

          <q-linear-progress
            v-if="sync.isRunning && sync.status && sync.status.totalMeetings > 0"
            :value="sync.status.processedMeetings / sync.status.totalMeetings"
            size="16px"
            color="green"
          >
            <div class="absolute-full flex flex-center">
              <q-badge
                color="white"
                text-color="green"
                :label="sync.status.processedMeetings + ' / ' + sync.status.totalMeetings"
              />
            </div>
          </q-linear-progress>

          <q-card-section class="console-body">
            <div ref="consoleRef" class="console-output">
              <div
                v-if="displayEvents.length === 0"
                class="text-grey-6"
                style="padding: 20px; text-align: center;"
              >
                Ziadne eventy. Spustite synchronizaciu.
              </div>
              <div
                v-for="event in displayEvents"
                :key="event.id"
                :class="['console-line', 'level-' + event.level.toLowerCase()]"
              >
                <span class="timestamp">[{{ formatTime(event.timestamp) }}]</span>
                <span class="level">[{{ event.level }}]</span>
                <span v-if="event.town && !townFilter" class="town">
                  [{{ event.town }}<template v-if="event.season">/{{ event.season }}</template>]
                </span>
                <span v-else-if="event.season" class="town">[{{ event.season }}]</span>
                <span class="message">{{ event.message }}</span>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right: Summary (col) -->
      <div class="col">
        <q-card flat bordered style="max-height: 50vh; overflow-y: auto;">
          <q-card-section class="q-py-sm">
            <div class="text-subtitle2 text-weight-bold">Vysledky syncu</div>
          </q-card-section>
          <q-separator />
          <q-list v-if="summaryLines.length > 0" dense separator>
            <q-item v-for="line in summaryLines" :key="line.key" dense :class="{ 'summary-running': line.running }">
              <q-item-section avatar>
                <q-icon :name="line.icon" :color="line.color" :class="{ 'icon-pulse': line.running }" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">
                  <template v-if="!townFilter">{{ line.town }} / </template>{{ line.season || '(seasons)' }}
                </q-item-label>
                <q-item-label caption :class="'text-' + line.color">{{ line.message }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <q-card-section v-else class="text-center text-grey">
            Ziadne data
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fold-header {
  background: #f8f9fa;
  transition: background 0.2s;
}
.fold-header:hover {
  background: #eef0f2;
}

/* Console styles */
.console-card {
  max-height: 50vh;
  display: flex;
  flex-direction: column;
}

.console-header {
  flex-shrink: 0;
}

.console-body {
  padding: 0 !important;
  flex: 1;
  min-height: 0;
}

.console-output {
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 12px;
  line-height: 1.6;
  padding: 12px;
  max-height: 50vh;
  overflow-y: auto;
}

.console-line {
  white-space: pre-wrap;
}

.timestamp {
  color: #858585;
  margin-right: 6px;
}

.level {
  margin-right: 6px;
}

.town {
  color: #569cd6;
  margin-right: 6px;
}

.level-info .level { color: #858585; }
.level-info .message { color: #d4d4d4; }

.level-success .level { color: #4ec9b0; }
.level-success .message { color: #4ec9b0; }

.level-warn .level { color: #dcdcaa; }
.level-warn .message { color: #dcdcaa; }

.level-error .level { color: #f44747; }
.level-error .message { color: #f44747; }

/* Running summary row */
.summary-running {
  background: rgba(25, 118, 210, 0.04);
}

.icon-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}
</style>