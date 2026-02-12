<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchTowns, fetchSeasons } from '../api'
import { useNavigationStore } from '../stores/navigation'
import type { Town, Season } from '../types'

const router = useRouter()
const nav = useNavigationStore()

const towns = ref<Town[]>([])
const seasons = ref<Season[]>([])
const loading = ref(false)
const step = ref<'town' | 'season'>('town')

onMounted(async () => {
  loading.value = true
  try {
    towns.value = await fetchTowns()
  } finally {
    loading.value = false
  }
})

async function onTownClick(town: Town) {
  nav.selectTown(town)
  loading.value = true
  try {
    seasons.value = await fetchSeasons(town.ref, nav.institution)
    step.value = 'season'
  } finally {
    loading.value = false
  }
}

function onSeasonClick(season: Season) {
  nav.selectSeason(season)
  router.push({
    name: 'polls',
    params: {
      city: nav.selectedTown!.ref,
      institution: nav.institution,
      season: season.ref,
    },
  })
}
</script>

<template>
  <q-page padding>
    <q-spinner-dots v-if="loading" size="40px" color="primary" class="absolute-center" />

    <template v-else-if="step === 'town'">
      <div class="text-h6 q-mb-md">Vyberte mesto</div>
      <q-list bordered separator>
        <q-item v-for="town in towns" :key="town.ref" clickable v-ripple @click="onTownClick(town)">
          <q-item-section avatar>
            <q-icon name="location_city" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ town.name }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
      </q-list>
    </template>

    <template v-else>
      <div class="text-h6 q-mb-md">Volebné obdobie</div>
      <q-list bordered separator>
        <q-item v-for="season in seasons" :key="season.ref" clickable v-ripple @click="onSeasonClick(season)">
          <q-item-section avatar>
            <q-icon name="event" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ season.name }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
      </q-list>
      <q-btn flat color="primary" icon="arrow_back" label="Späť" class="q-mt-md" @click="step = 'town'" />
    </template>
  </q-page>
</template>
