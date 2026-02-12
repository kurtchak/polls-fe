<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchPoll } from '../api'
import type { PollDetail, VoteChoice } from '../types'
import VoteBadge from '../components/VoteBadge.vue'
import VoteBar from '../components/VoteBar.vue'

const props = defineProps<{ ref: string }>()

const poll = ref<PollDetail | null>(null)
const loading = ref(false)

const voteGroups = computed(() => {
  if (!poll.value) return []
  const order: VoteChoice[] = ['VOTED_FOR', 'VOTED_AGAINST', 'ABSTAIN', 'NOT_VOTED', 'ABSENT']
  const labels: Record<VoteChoice, string> = {
    VOTED_FOR: 'Za',
    VOTED_AGAINST: 'Proti',
    ABSTAIN: 'Zdržal sa',
    NOT_VOTED: 'Nehlasoval',
    ABSENT: 'Neprítomný',
  }
  const colors: Record<VoteChoice, string> = {
    VOTED_FOR: 'positive',
    VOTED_AGAINST: 'negative',
    ABSTAIN: 'warning',
    NOT_VOTED: 'grey-6',
    ABSENT: 'grey-4',
  }
  return order
    .map(choice => ({
      choice,
      label: labels[choice],
      color: colors[choice],
      votes: poll.value!.votes.filter(v => v.voted === choice),
    }))
    .filter(g => g.votes.length > 0)
})

onMounted(async () => {
  loading.value = true
  try {
    poll.value = await fetchPoll(props.ref)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <q-page padding>
    <q-spinner-dots v-if="loading" size="40px" color="primary" class="absolute-center" />

    <template v-else-if="poll">
      <div class="row items-start justify-between q-mb-sm">
        <div class="text-h6 col">{{ poll.name }}</div>
        <VoteBadge :result="poll.result" />
      </div>

      <VoteBar :votes-count="poll.votesCount" :voters="poll.voters" class="q-mb-md" />

      <div v-for="group in voteGroups" :key="group.choice" class="q-mb-md">
        <div class="text-subtitle1 q-mb-xs">
          <q-badge :color="group.color" :label="group.label" />
          <span class="text-caption text-grey q-ml-sm">({{ group.votes.length }})</span>
        </div>
        <q-list dense bordered separator>
          <q-item v-for="vote in group.votes" :key="vote.councilMember.ref">
            <q-item-section avatar>
              <q-avatar size="32px">
                <img
                  v-if="vote.councilMember.politician?.picture"
                  :src="vote.councilMember.politician.picture"
                />
                <q-icon v-else name="person" size="20px" color="grey-5" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ vote.councilMember.politician?.name || vote.councilMember.name }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </template>
  </q-page>
</template>
