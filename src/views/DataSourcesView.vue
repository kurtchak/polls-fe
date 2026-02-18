<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchDataSourceSummary, fetchSyncLogs } from '../api'
import type { DataSourceSummary, DataSourceRow, SyncLog } from '../types'

const tab = ref<'sources' | 'log'>('sources')
const loading = ref(false)

// Data sources
const summary = ref<DataSourceSummary | null>(null)
const townFilter = ref('')

// Sync log
const logs = ref<SyncLog[]>([])
const logTownFilter = ref('')
const logOpFilter = ref('')
const logResultFilter = ref('')

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
    const [s, l] = await Promise.all([
      fetchDataSourceSummary(),
      fetchSyncLogs(),
    ])
    summary.value = s
    logs.value = l
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
</script>

<template>
  <q-page padding>
    <div class="text-h6 q-mb-md">Zdroje dat</div>

    <q-tabs v-model="tab" dense active-color="primary" class="q-mb-md">
      <q-tab name="sources" icon="storage" label="Prehlad zdrojov" />
      <q-tab name="log" icon="history" label="Sync Log" />
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
</style>
