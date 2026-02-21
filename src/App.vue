<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSyncStore } from './stores/sync'
import { useNavigationStore } from './stores/navigation'
import SyncIndicator from './components/SyncIndicator.vue'

const route = useRoute()
const router = useRouter()
const sync = useSyncStore()
const nav = useNavigationStore()

onMounted(() => sync.init())
onUnmounted(() => { sync.stopPolling(); sync.stopSSE() })

const showBack = computed(() => route.name !== 'home')

const title = computed(() => {
  if (route.name === 'home') return 'Komunálne hlasovania'
  const city = (route.params.city as string) || nav.selectedTown?.name
  const season = (route.params.season as string) || nav.selectedSeason?.ref
  if (!city) return 'Komunálne hlasovania'
  const cityName = city.charAt(0).toUpperCase() + city.slice(1)
  if (route.name === 'switchers') return `${cityName} › Prezliekači`
  if (season) return `${cityName} › ${season}`
  return cityName
})

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push({ name: 'home' })
  }
}
</script>

<template>
  <q-layout view="hHh lpr fFf">
    <q-header elevated class="bg-primary">
      <q-toolbar>
        <q-btn v-if="showBack" flat round icon="arrow_back" @click="goBack" />
        <q-toolbar-title>{{ title }}</q-toolbar-title>
        <q-btn v-if="showBack" flat round icon="home" @click="nav.clearSelection(); router.push({ name: 'home' })" />
        <q-btn flat round icon="storage" @click="router.push({ name: 'data-sources' })">
          <q-tooltip>Zdroje dat</q-tooltip>
        </q-btn>
        <SyncIndicator />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
