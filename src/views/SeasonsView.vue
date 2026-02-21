<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchTowns, fetchSeasons, discoverOlderSeason } from '../api'
import type { DiscoveryResult } from '../api'
import { useNavigationStore } from '../stores/navigation'
import { useSyncStore } from '../stores/sync'
import SyncConsole from '../components/SyncConsole.vue'
import type { Season } from '../types'

const route = useRoute()
const router = useRouter()
const nav = useNavigationStore()
const sync = useSyncStore()

const city = route.params.city as string
const institution = route.params.institution as string

const seasons = ref<Season[]>([])
const loading = ref(false)
const discovering = ref(false)
const discoveryMessage = ref('')
const discoveryColor = ref('grey')

onMounted(async () => {
  loading.value = true
  try {
    // Ensure nav store has the town if not already set
    if (!nav.selectedTown || nav.selectedTown.ref !== city) {
      const towns = await fetchTowns()
      const town = towns.find(t => t.ref === city)
      if (town) nav.selectTown(town)
    }
    seasons.value = (await fetchSeasons(city, institution))
      .sort((a, b) => b.ref.localeCompare(a.ref))
  } finally {
    loading.value = false
  }
})

function onSeasonClick(season: Season) {
  nav.selectSeason(season)
  router.push({
    name: 'polls',
    params: { city, institution, season: season.ref },
  })
}

async function onDiscoverOlder() {
  discovering.value = true
  discoveryMessage.value = ''
  try {
    const result: DiscoveryResult = await discoverOlderSeason(city, institution)
    discoveryMessage.value = result.message
    discoveryColor.value = result.status === 'found' ? 'green' : result.status === 'not_found' ? 'orange' : 'grey'
    // Refresh seasons list
    seasons.value = (await fetchSeasons(city, institution))
      .sort((a, b) => b.ref.localeCompare(a.ref))
    // Trigger full sync to load members and complete data
    await sync.triggerSync(city)
  } catch {
    discoveryMessage.value = 'Chyba pri hľadaní staršej sezóny'
    discoveryColor.value = 'red'
  } finally {
    discovering.value = false
  }
}
</script>

<template>
  <q-page padding>
    <q-spinner-dots v-if="loading" size="40px" color="primary" class="absolute-center" />

    <template v-else>
      <div class="text-h6 q-mb-md">Volebné obdobie</div>
      <q-list class="home-list">
        <q-item
          v-for="(season, index) in seasons" :key="season.ref"
          clickable v-ripple @click="onSeasonClick(season)"
          :class="{ 'current-season': index === 0 }"
        >
          <q-item-section avatar>
            <q-icon
              :name="season.meetingCount && !season.incompleteMeetings ? 'check_circle' : 'event'"
              :color="season.meetingCount && !season.incompleteMeetings ? 'green' : 'primary'"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ season.name }}</q-item-label>
            <q-item-label v-if="season.meetingCount || season.pollCount" caption>
              {{ season.meetingCount }} zasadnutí, {{ season.pollCount }} hlasovaní
              <span v-if="season.incompleteMeetings" class="text-orange">
                ({{ season.incompleteMeetings }} nekompletných)
              </span>
            </q-item-label>
            <q-item-label v-if="!season.meetingCount" caption class="text-grey">
              zatiaľ bez dát
            </q-item-label>
            <q-item-label v-if="sync.status?.running && sync.status?.currentTown === city && sync.status?.currentSeason === season.ref && sync.status?.currentPhase === 'meetings'" caption class="text-primary">
              synchronizujem {{ sync.status.processedMeetings }} / {{ sync.status.totalMeetings }}
            </q-item-label>
          </q-item-section>
          <q-item-section v-if="sync.status?.running && sync.status?.currentTown === city && sync.status?.currentSeason === season.ref" side>
            <q-spinner-dots size="20px" color="primary" />
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
      </q-list>

      <div class="q-mt-md text-center">
        <q-btn
          outline color="primary" icon="history"
          label="Nájsť staršiu sezónu"
          :loading="discovering"
          @click="onDiscoverOlder"
        />
        <div v-if="discoveryMessage" class="q-mt-sm text-caption" :class="`text-${discoveryColor}`">
          {{ discoveryMessage }}
        </div>
      </div>

      <SyncConsole :town-filter="city" />
    </template>
  </q-page>
</template>

<style scoped>
.home-list {
  border-radius: 12px;
  background: #f8f9fa;
}
.home-list :deep(.q-item) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.home-list :deep(.q-item:last-child) {
  border-bottom: none;
}
.current-season {
  background: rgba(25, 118, 210, 0.06);
}
</style>
