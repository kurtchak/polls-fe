<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchPolls } from '../api'
import type { Poll } from '../types'
import PollCard from '../components/PollCard.vue'

const props = defineProps<{ city: string; institution: string; season: string }>()
const route = useRoute()
const router = useRouter()

const polls = ref<Poll[]>([])
const loading = ref(false)

const dateFilter = computed(() => route.query.date as string | undefined)

const dateFilterLabel = computed(() => {
  if (!dateFilter.value) return ''
  const [y, m, d] = dateFilter.value.split('-')
  return `${d}.${m}.${y}`
})

function clearDateFilter() {
  router.replace({ query: {} })
}

async function loadPolls() {
  loading.value = true
  try {
    polls.value = await fetchPolls(
      props.city, props.institution, props.season,
      dateFilter.value, dateFilter.value
    )
  } finally {
    loading.value = false
  }
}

onMounted(loadPolls)

watch(dateFilter, loadPolls)

function goToDetail(poll: Poll) {
  router.push({ name: 'poll-detail', params: { ref: poll.ref } })
}

function goToMembers() {
  router.push({ name: 'members', params: { city: props.city, institution: props.institution, season: props.season } })
}

function goToSwitchers() {
  router.push({ name: 'switchers', params: { city: props.city } })
}
</script>

<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6">Hlasovania</div>
      <div>
        <q-btn flat dense icon="people" label="Poslanci" color="primary" @click="goToMembers" />
        <q-btn flat dense icon="swap_horiz" label="Prezliekači" color="primary" @click="goToSwitchers" />
      </div>
    </div>

    <q-banner v-if="dateFilter" inline-actions rounded class="bg-blue-1 q-mb-md">
      Filtrované na zasadnutie {{ dateFilterLabel }}
      <template #action>
        <q-btn flat dense label="Zobraziť všetky" color="primary" @click="clearDateFilter" />
      </template>
    </q-banner>

    <q-spinner-dots v-if="loading" size="40px" color="primary" class="absolute-center" />

    <div v-else-if="polls.length === 0" class="text-center text-grey q-mt-xl">
      Žiadne hlasovania
    </div>

    <template v-else>
      <PollCard
        v-for="poll in polls"
        :key="poll.ref"
        :poll="poll"
        @click="goToDetail(poll)"
      />
    </template>
  </q-page>
</template>
