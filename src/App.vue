<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSyncStore } from './stores/sync'
import SyncIndicator from './components/SyncIndicator.vue'

const route = useRoute()
const router = useRouter()
const sync = useSyncStore()

onMounted(() => sync.startPolling())
onUnmounted(() => sync.stopPolling())

const showBack = computed(() => route.name !== 'home')

const title = computed(() => {
  const city = route.params.city as string | undefined
  if (city) return city.charAt(0).toUpperCase() + city.slice(1)
  if (route.name === 'switchers') return 'Prezliekači'
  return 'Komunálne hlasovania'
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
        <q-btn v-if="showBack" flat round icon="home" @click="router.push({ name: 'home' })" />
        <SyncIndicator />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
