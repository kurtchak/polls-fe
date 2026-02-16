import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Town, Season } from '../types'

export const useNavigationStore = defineStore('navigation', () => {
  const selectedTown = ref<Town | null>(null)
  const selectedSeason = ref<Season | null>(null)
  const institution = ref('mz') // mestské zastupiteľstvo

  function selectTown(town: Town) {
    selectedTown.value = town
    selectedSeason.value = null
  }

  function selectSeason(season: Season) {
    selectedSeason.value = season
  }

  function clearSelection() {
    selectedTown.value = null
    selectedSeason.value = null
  }

  return { selectedTown, selectedSeason, institution, selectTown, selectSeason, clearSelection }
})