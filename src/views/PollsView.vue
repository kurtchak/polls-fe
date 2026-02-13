<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchPolls } from '../api'
import type { Poll } from '../types'
import PollCard from '../components/PollCard.vue'

const props = defineProps<{ city: string; institution: string; season: string }>()
const router = useRouter()

const polls = ref<Poll[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    polls.value = await fetchPolls(props.city, props.institution, props.season)
  } finally {
    loading.value = false
  }
})

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
