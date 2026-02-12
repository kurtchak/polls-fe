<script setup lang="ts">
import { useNavigationStore } from './stores/navigation'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const nav = useNavigationStore()
const route = useRoute()
const router = useRouter()

const showBack = computed(() => route.name !== 'home')
const title = computed(() => {
  if (nav.selectedTown) return nav.selectedTown.name
  return 'Komunálne hlasovania'
})
</script>

<template>
  <q-layout view="hHh lpr fFf">
    <q-header elevated class="bg-primary">
      <q-toolbar>
        <q-btn v-if="showBack" flat round icon="arrow_back" @click="router.back()" />
        <q-toolbar-title>{{ title }}</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
