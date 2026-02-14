<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchTowns, fetchSeasons } from '../api'
import { useNavigationStore } from '../stores/navigation'
import { useSyncStore } from '../stores/sync'
import type { Season } from '../types'

const route = useRoute()
const router = useRouter()
const nav = useNavigationStore()
const sync = useSyncStore()

const city = route.params.city as string
const institution = route.params.institution as string

const seasons = ref<Season[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    // Ensure nav store has the town if not already set
    if (!nav.selectedTown || nav.selectedTown.ref !== city) {
      const towns = await fetchTowns()
      const town = towns.find(t => t.ref === city)
      if (town) nav.selectTown(town)
    }
    seasons.value = await fetchSeasons(city, institution)
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
</script>

<template>
  <q-page padding>
    <q-spinner-dots v-if="loading" size="40px" color="primary" class="absolute-center" />

    <template v-else>
      <div class="text-h6 q-mb-md">Volebné obdobie</div>
      <q-list class="home-list">
        <q-item v-for="season in seasons" :key="season.ref" clickable v-ripple @click="onSeasonClick(season)">
          <q-item-section avatar>
            <q-icon name="event" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ season.name }}</q-item-label>
            <q-item-label v-if="season.meetingCount || season.pollCount" caption>
              {{ season.meetingCount }} zasadnutí, {{ season.pollCount }} hlasovaní
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
      <q-btn flat color="primary" icon="arrow_back" label="Späť" class="q-mt-md" @click="router.push({ name: 'home' })" />
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
</style>
