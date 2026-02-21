<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { fetchDataSourceSummary, fetchSyncLogs, fetchSyncStatus, triggerSync, subscribeSyncEvents, fetchLastRun } from '../api'
import type { DataSourceSummary, DataSourceRow, SyncLog, SyncEvent, LastRunSummary, SyncStatus } from '../types'

const tab = ref<'sources' | 'log' | 'console'>('sources')
const loading = ref(false)

// Data sources
const summary = ref<DataSourceSummary | null>(null)
const townFilter = ref('')

// Sync log
const logs = ref<SyncLog[]>([])
const logTownFilter = ref('')
const logOpFilter = ref('')
const logResultFilter = ref('')

// Console
const consoleEvents = ref<SyncEvent[]>([])
const lastRun = ref<LastRunSummary | null>(null)
const syncStatus = ref<SyncStatus | null>(null)
const consoleRef = ref<HTMLDivElement | null>(null)
let eventSource: EventSource | null = null
let statusInterval: ReturnType<typeof setInterval> | null = null

const isRunning = computed(() => syncStatus.value?.running ?? false)

const sourceColors: Record<string, string> = {
  DM: 'blue-7',
  DM_PDF: 'blue-4',
  BA_ARCGIS: 'teal-7',
  BA_WEB: 'teal-4',
  PRESOV_WEB: 'purple-6',
  POPRAD_WEB: 'orange-7',
  MANUAL: 'grey-7',
  OTHER: 'grey-5',
}

function sourceColor(source: string | null): string {
  return source ? (sourceColors[source] || 'grey-6') : 'grey-4'
}

onMounted(async () => {
  loading.value = true
  try {
    const [s, l] = await Promise.allSettled([
      fetchDataSourceSummary(),
      fetchSyncLogs(),
    ])
    if (s.status === 'fulfilled') summary.value = s.value
    if (l.status === 'fulfilled') logs.value = l.value
  } finally {
    loading.value = false
  }
})

// --- Data Sources tab ---
const allTowns = computed(() => {
  if (!summary.value) return []
  const towns = new Set<string>()
  for (const list of [summary.value.seasons, summary.value.meetings, summary.value.members, summary.value.polls]) {
    for (const r of list) if (r.town) towns.add(r.town)
  }
  return [...towns].sort()
})

interface TownSeasonRow {
  season: string
  seasonSource: string | null
  meetings: DataSourceRow[]
  members: DataSourceRow[]
  polls: DataSourceRow[]
}

const townData = computed(() => {
  if (!summary.value) return []
  const towns = townFilter.value ? [townFilter.value] : allTowns.value
  return towns.map(town => {
    const tSeasons = summary.value!.seasons.filter(r => r.town === town)
    const tMeetings = summary.value!.meetings.filter(r => r.town === town)
    const tMembers = summary.value!.members.filter(r => r.town === town)
    const tPolls = summary.value!.polls.filter(r => r.town === town)

    const allSeasons = [...new Set([
      ...tSeasons.map(r => r.season), ...tMeetings.map(r => r.season),
      ...tMembers.map(r => r.season), ...tPolls.map(r => r.season),
    ])].filter(Boolean).sort()

    const rows: TownSeasonRow[] = allSeasons.map(season => ({
      season,
      seasonSource: tSeasons.find(r => r.season === season)?.source ?? null,
      meetings: tMeetings.filter(r => r.season === season),
      members: tMembers.filter(r => r.season === season),
      polls: tPolls.filter(r => r.season === season),
    }))

    return { town, rows }
  })
})

// --- Sync Log tab ---
const operations = ['SEASONS', 'MEETINGS', 'MEETING_DETAILS', 'POLL_DETAILS', 'MEMBERS']

const logTowns = computed(() => [...new Set(logs.value.map(l => l.townRef))].filter(Boolean).sort())

const filteredLogs = computed(() => {
  let result = logs.value
  if (logTownFilter.value) result = result.filter(l => l.townRef === logTownFilter.value)
  if (logOpFilter.value) result = result.filter(l => l.operation === logOpFilter.value)
  if (logResultFilter.value) result = result.filter(l => String(l.success) === logResultFilter.value)
  return result.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
})

function formatTs(ts: string | null): string {
  if (!ts) return '\u2014'
  const d = new Date(ts)
  return d.toLocaleDateString('sk') + ' ' + d.toLocaleTimeString('sk')
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// --- Console tab ---
function formatTime(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('sk')
}

function formatDuration(ms: number): string {
  if (ms < 1000) return ms + 'ms'
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return sec + 's'
  const min = Math.floor(sec / 60)
  const remainSec = sec % 60
  return min + 'min ' + remainSec + 's'
}

function scrollConsoleToBottom() {
  nextTick(() => {
    if (consoleRef.value) {
      consoleRef.value.scrollTop = consoleRef.value.scrollHeight
    }
  })
}

function startSSE() {
  if (eventSource) return
  eventSource = subscribeSyncEvents((event: SyncEvent) => {
    consoleEvents.value.push(event)
    // Keep max 500 events in UI
    if (consoleEvents.value.length > 500) {
      consoleEvents.value = consoleEvents.value.slice(-300)
    }
    scrollConsoleToBottom()
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

async function pollSyncStatus() {
  try {
    syncStatus.value = await fetchSyncStatus()
  } catch {
    // ignore
  }
}

async function handleTriggerSync() {
  try {
    await triggerSync()
    consoleEvents.value = []
    await pollSyncStatus()
  } catch {
    // ignore
  }
}

watch(tab, (newTab) => {
  if (newTab === 'console') {
    startSSE()
    pollSyncStatus()
    loadLastRun()
    statusInterval = setInterval(pollSyncStatus, 3000)
  } else {
    stopSSE()
    if (statusInterval) {
      clearInterval(statusInterval)
      statusInterval = null
    }
  }
})

onUnmounted(() => {
  stopSSE()
  if (statusInterval) {
    clearInterval(statusInterval)
    statusInterval = null
  }
})
</script>

<template>
  <q-page padding>
    <div class="text-h6 q-mb-md">Zdroje dat</div>

    <q-tabs v-model="tab" dense active-color="primary" class="q-mb-md">
      <q-tab name="sources" icon="storage" label="Prehlad zdrojov" />
      <q-tab name="log" icon="history" label="Sync Log" />
      <q-tab name="console" icon="terminal" label="Konzola" />
    </q-tabs>

    <q-spinner-dots v-if="loading" size="40px" color="primary" class="absolute-center" />

    <!-- Sources Tab -->
    <template v-else-if="tab === 'sources'">
      <div class="row q-mb-md">
        <q-select
          v-model="townFilter"
          :options="[{ label: 'Vsetky mesta', value: '' }, ...allTowns.map(t => ({ label: capitalize(t), value: t }))]"
          emit-value map-options
          outlined dense
          style="min-width: 200px"
          label="Mesto"
        />
      </div>

      <div v-if="townData.length === 0" class="text-center text-grey q-mt-xl">
        Ziadne data. Spustite synchronizaciu.
      </div>

      <q-card v-for="td in townData" :key="td.town" flat bordered class="q-mb-md">
        <q-card-section class="q-pb-none">
          <div class="text-subtitle1 text-weight-bold">{{ capitalize(td.town) }}</div>
        </q-card-section>
        <q-card-section class="q-pt-sm">
          <q-markup-table flat dense separator="horizontal" wrap-cells>
            <thead>
              <tr>
                <th class="text-left">Sezona</th>
                <th class="text-left">Sezony</th>
                <th class="text-left">Zasadnutia</th>
                <th class="text-left">Poslanci</th>
                <th class="text-left">Hlasovania</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in td.rows" :key="row.season">
                <td class="text-weight-medium">{{ row.season }}</td>
                <td>
                  <q-chip v-if="row.seasonSource" dense size="sm" :color="sourceColor(row.seasonSource)" text-color="white" :label="row.seasonSource" />
                  <span v-else class="text-grey">&mdash;</span>
                </td>
                <td>
                  <template v-if="row.meetings.length">
                    <div v-for="m in row.meetings" :key="m.source ?? 'null'" class="q-my-xs">
                      <q-chip dense size="sm" :color="sourceColor(m.source)" text-color="white" :label="m.source ?? '?'" />
                      <strong class="q-ml-xs">{{ m.count }}</strong>
                    </div>
                  </template>
                  <span v-else class="text-grey">&mdash;</span>
                </td>
                <td>
                  <template v-if="row.members.length">
                    <div v-for="m in row.members" :key="m.source ?? 'null'" class="q-my-xs">
                      <q-chip dense size="sm" :color="sourceColor(m.source)" text-color="white" :label="m.source ?? '?'" />
                      <strong class="q-ml-xs">{{ m.count }}</strong>
                    </div>
                  </template>
                  <span v-else class="text-grey">&mdash;</span>
                </td>
                <td>
                  <template v-if="row.polls.length">
                    <div v-for="p in row.polls" :key="p.source ?? 'null'" class="q-my-xs">
                      <q-chip dense size="sm" :color="sourceColor(p.source)" text-color="white" :label="p.source ?? '?'" />
                      <strong class="q-ml-xs">{{ p.count }}</strong>
                    </div>
                  </template>
                  <span v-else class="text-grey">&mdash;</span>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card-section>
      </q-card>
    </template>

    <!-- Sync Log Tab -->
    <template v-else-if="tab === 'log'">
      <div class="row q-gutter-sm q-mb-md">
        <q-select
          v-model="logTownFilter"
          :options="[{ label: 'Vsetky mesta', value: '' }, ...logTowns.map(t => ({ label: capitalize(t), value: t }))]"
          emit-value map-options outlined dense
          style="min-width: 180px" label="Mesto"
        />
        <q-select
          v-model="logOpFilter"
          :options="[{ label: 'Vsetky operacie', value: '' }, ...operations.map(o => ({ label: o, value: o }))]"
          emit-value map-options outlined dense
          style="min-width: 200px" label="Operacia"
        />
        <q-select
          v-model="logResultFilter"
          :options="[{ label: 'Vsetky', value: '' }, { label: 'Uspech', value: 'true' }, { label: 'Chyba', value: 'false' }]"
          emit-value map-options outlined dense
          style="min-width: 150px" label="Vysledok"
        />
      </div>

      <div v-if="filteredLogs.length === 0" class="text-center text-grey q-mt-xl">
        Ziadne zaznamy. Spustite synchronizaciu alebo zmente filtre.
      </div>

      <q-card v-else flat bordered>
        <q-card-section class="q-pb-none">
          <div class="text-caption text-grey">{{ filteredLogs.length }} zaznamov</div>
        </q-card-section>
        <q-card-section class="q-pt-sm">
          <q-markup-table flat dense separator="horizontal" wrap-cells>
            <thead>
              <tr>
                <th class="text-left">Cas</th>
                <th class="text-left">Mesto</th>
                <th class="text-left">Sezona</th>
                <th class="text-left">Operacia</th>
                <th class="text-left">Zdroj</th>
                <th class="text-left">Vysledok</th>
                <th class="text-right">Zaznamy</th>
                <th class="text-right">Trvanie</th>
                <th class="text-left">Chyba</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in filteredLogs" :key="log.id">
                <td class="text-caption text-grey">{{ formatTs(log.timestamp) }}</td>
                <td class="text-weight-medium">{{ log.townRef }}</td>
                <td>{{ log.seasonRef ?? '\u2014' }}</td>
                <td>
                  <q-chip dense size="sm" color="purple-2" text-color="purple-9" :label="log.operation" />
                </td>
                <td>
                  <q-chip dense size="sm" :color="sourceColor(log.source)" text-color="white" :label="log.source" />
                </td>
                <td>
                  <q-chip
                    dense size="sm"
                    :color="log.success ? 'green-2' : 'red-2'"
                    :text-color="log.success ? 'green-9' : 'red-9'"
                    :label="log.success ? 'OK' : 'CHYBA'"
                  />
                </td>
                <td class="text-right text-weight-medium">{{ log.success ? log.recordCount : '\u2014' }}</td>
                <td class="text-right text-caption text-grey">{{ log.durationMs }}ms</td>
                <td>
                  <span v-if="log.errorMessage" class="text-caption text-red-8 ellipsis-text" :title="log.errorMessage">
                    {{ log.errorMessage }}
                  </span>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card-section>
      </q-card>
    </template>

    <!-- Console Tab -->
    <template v-else-if="tab === 'console'">
      <!-- Summary cards -->
      <div v-if="lastRun" class="row q-gutter-sm q-mb-md">
        <q-card flat bordered class="col">
          <q-card-section class="text-center q-pa-sm">
            <div class="text-h6">{{ lastRun.townsSynced }}</div>
            <div class="text-caption text-grey">Miest</div>
          </q-card-section>
        </q-card>
        <q-card flat bordered class="col">
          <q-card-section class="text-center q-pa-sm">
            <div class="text-h6 text-green">{{ lastRun.meetingsSynced }}</div>
            <div class="text-caption text-grey">Zasadnuti OK</div>
          </q-card-section>
        </q-card>
        <q-card flat bordered class="col">
          <q-card-section class="text-center q-pa-sm">
            <div class="text-h6 text-red">{{ lastRun.meetingsFailed }}</div>
            <div class="text-caption text-grey">Zlyhanych</div>
          </q-card-section>
        </q-card>
        <q-card flat bordered class="col">
          <q-card-section class="text-center q-pa-sm">
            <div class="text-h6 text-orange">{{ lastRun.meetingsSkipped }}</div>
            <div class="text-caption text-grey">Preskocenych</div>
          </q-card-section>
        </q-card>
        <q-card flat bordered class="col">
          <q-card-section class="text-center q-pa-sm">
            <div class="text-h6">{{ formatDuration(lastRun.durationMs) }}</div>
            <div class="text-caption text-grey">Trvanie</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Progress bar when running -->
      <q-linear-progress
        v-if="isRunning && syncStatus && syncStatus.totalMeetings > 0"
        :value="syncStatus.processedMeetings / syncStatus.totalMeetings"
        size="20px"
        color="green"
        class="q-mb-md"
      >
        <div class="absolute-full flex flex-center">
          <q-badge color="white" text-color="green" :label="syncStatus.processedMeetings + ' / ' + syncStatus.totalMeetings" />
        </div>
      </q-linear-progress>

      <!-- Console output -->
      <q-card flat bordered class="console-card">
        <q-card-section class="console-header row items-center q-py-sm">
          <q-icon
            :name="isRunning ? 'fiber_manual_record' : 'circle'"
            :color="isRunning ? 'green' : 'grey'"
            size="12px"
            class="q-mr-sm"
          />
          <span v-if="isRunning" class="text-weight-medium">
            Synchronizacia bezi...
            <span v-if="syncStatus?.currentTown" class="text-caption text-grey q-ml-sm">
              {{ syncStatus.currentTown }}
              <template v-if="syncStatus?.currentSeason"> / {{ syncStatus.currentSeason }}</template>
            </span>
          </span>
          <span v-else class="text-weight-medium text-grey">
            Posledna synchronizacia
            <span v-if="lastRun?.completedAt" class="text-caption q-ml-sm">{{ formatTs(lastRun.completedAt) }}</span>
          </span>
          <q-space />
          <q-btn
            flat dense size="sm"
            icon="play_arrow"
            label="Sync"
            color="primary"
            :disable="isRunning"
            @click="handleTriggerSync"
          />
        </q-card-section>
        <q-card-section class="console-body">
          <div ref="consoleRef" class="console-output">
            <div v-if="consoleEvents.length === 0" class="text-grey-6" style="padding: 20px; text-align: center;">
              Ziadne eventy. Spustite synchronizaciu.
            </div>
            <div
              v-for="event in consoleEvents"
              :key="event.id"
              :class="['console-line', 'level-' + event.level.toLowerCase()]"
            >
              <span class="timestamp">[{{ formatTime(event.timestamp) }}]</span>
              <span class="level">[{{ event.level }}]</span>
              <span v-if="event.town" class="town">[{{ event.town }}<template v-if="event.season">/{{ event.season }}</template>]</span>
              <span class="message">{{ event.message }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </template>
  </q-page>
</template>

<style scoped>
.ellipsis-text {
  display: inline-block;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.console-card {
  max-height: 600px;
}

.console-body {
  padding: 0 !important;
}

.console-output {
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 12px;
  line-height: 1.6;
  padding: 12px;
  max-height: 500px;
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
</style>
