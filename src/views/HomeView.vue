<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchTowns } from '../api'
import { useNavigationStore } from '../stores/navigation'
import { useSyncStore } from '../stores/sync'
import type { Town } from '../types'

const router = useRouter()
const nav = useNavigationStore()
const sync = useSyncStore()

const towns = ref<Town[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    towns.value = await fetchTowns()
  } finally {
    loading.value = false
  }
})

function onTownClick(town: Town) {
  nav.selectTown(town)
  router.push({
    name: 'seasons',
    params: { city: town.ref, institution: nav.institution },
  })
}
</script>

<template>
  <q-page padding>
    <q-spinner-dots v-if="loading" size="40px" color="primary" class="absolute-center" />

    <template v-else>
      <div class="text-h6 q-mb-md">Vyberte mesto</div>
      <q-list class="home-list">
        <q-item v-for="town in towns" :key="town.ref" clickable v-ripple @click="onTownClick(town)">
          <q-item-section avatar>
            <q-icon name="location_city" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ town.name }}</q-item-label>
          </q-item-section>
          <q-item-section v-if="sync.status?.running && sync.status?.currentTown === town.ref" side>
            <q-spinner-dots size="20px" color="primary" />
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
      </q-list>
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
