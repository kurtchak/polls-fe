<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchPartySwitchers, fetchClubSwitchers } from '../api'
import type { Politician } from '../types'

const props = defineProps<{ city: string }>()

const tab = ref<'party' | 'club'>('party')
const partySwitchers = ref<Politician[]>([])
const clubSwitchers = ref<Politician[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const [ps, cs] = await Promise.all([
      fetchPartySwitchers(props.city),
      fetchClubSwitchers(props.city),
    ])
    partySwitchers.value = ps
    clubSwitchers.value = cs
  } finally {
    loading.value = false
  }
})

function uniqueParties(p: Politician): string[] {
  return [...new Set(p.partyNominees ?? [])]
}
</script>

<template>
  <q-page padding>
    <div class="text-h6 q-mb-md">Prezliekači</div>

    <q-tabs v-model="tab" dense active-color="primary" class="q-mb-md">
      <q-tab name="party" label="Menili stranu" />
      <q-tab name="club" label="Menili klub" />
    </q-tabs>

    <q-spinner-dots v-if="loading" size="40px" color="primary" class="absolute-center" />

    <q-list v-else bordered separator>
      <template v-if="tab === 'party'">
        <q-item v-for="(p, idx) in partySwitchers" :key="idx">
          <q-item-section avatar>
            <q-avatar size="40px">
              <img v-if="p.picture" :src="p.picture" />
              <q-icon v-else name="person" size="24px" color="grey-5" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ p.name }}</q-item-label>
            <q-item-label caption>
              <q-chip
                v-for="(party, i) in uniqueParties(p)"
                :key="i"
                dense
                size="sm"
                color="primary"
                text-color="white"
                :label="party"
              />
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="partySwitchers.length === 0">
          <q-item-section class="text-grey text-center">Žiadni prezliekači strán</q-item-section>
        </q-item>
      </template>

      <template v-else>
        <q-item v-for="(p, idx) in clubSwitchers" :key="idx">
          <q-item-section avatar>
            <q-avatar size="40px">
              <img v-if="p.picture" :src="p.picture" />
              <q-icon v-else name="person" size="24px" color="grey-5" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ p.name }}</q-item-label>
            <q-item-label v-if="p.club" caption class="text-grey">
              Klub: {{ p.club }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="clubSwitchers.length === 0">
          <q-item-section class="text-grey text-center">Žiadni prezliekači klubov</q-item-section>
        </q-item>
      </template>
    </q-list>
  </q-page>
</template>
