<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPoll } from '../api'
import type { PollDetail } from '../types'
import VoteBadge from '../components/VoteBadge.vue'
import VoteBar from '../components/VoteBar.vue'

const route = useRoute()
const pollRef = route.params.ref as string

const poll = ref<PollDetail | null>(null)
const loading = ref(false)

type VoteKey = 'for' | 'against' | 'abstain' | 'not' | 'absent'

const voteGroups = computed(() => {
  if (!poll.value?.votes) return []
  const v = poll.value.votes
  const groups: { key: VoteKey; label: string; color: string }[] = [
    { key: 'for', label: 'Za', color: 'positive' },
    { key: 'against', label: 'Proti', color: 'negative' },
    { key: 'abstain', label: 'Zdržal sa', color: 'warning' },
    { key: 'not', label: 'Nehlasoval', color: 'grey-6' },
    { key: 'absent', label: 'Neprítomný', color: 'grey-4' },
  ]
  return groups
    .map(g => ({
      ...g,
      voters: v[g.key]?.voters ?? [],
      count: v[g.key]?.count ?? 0,
    }))
    .filter(g => g.count > 0)
})

const hasVoters = computed(() => voteGroups.value.some(g => g.voters.length > 0))

function shortMeeting(name: string): string {
  return name
    .replace(/Mestského zastupiteľstva mesta \S+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

onMounted(async () => {
  loading.value = true
  try {
    poll.value = await fetchPoll(pollRef)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <q-page padding>
    <q-spinner-dots v-if="loading" size="40px" color="primary" class="absolute-center" />

    <template v-else-if="poll">
      <div class="q-mb-sm">
        <VoteBadge :result="poll.result" class="float-badge" />
        <div class="text-h6">{{ poll.agendaItem?.name ?? poll.name }}</div>
      </div>

      <div v-if="poll.agendaItem?.meeting" class="text-caption text-grey q-mb-sm">
        {{ shortMeeting(poll.agendaItem.meeting.name) }} | {{ poll.agendaItem.meeting.date }}
      </div>

      <VoteBar :votes-count="poll.votesCount" :voters="poll.voters" class="q-mb-md" />

      <template v-if="hasVoters">
        <div v-for="group in voteGroups" :key="group.key" class="q-mb-md">
          <div class="text-subtitle1 q-mb-xs">
            <q-badge :color="group.color" :label="group.label" />
            <span class="text-caption text-grey q-ml-sm">({{ group.count }})</span>
          </div>
          <q-list dense class="voter-list">
            <q-item
              v-for="voter in group.voters"
              :key="voter.ref"
              clickable
              :to="{ name: 'member-detail', params: { ref: voter.ref } }"
              class="voter-item"
            >
              <q-item-section avatar>
                <q-avatar size="32px">
                  <img v-if="voter.picture" :src="voter.picture" class="avatar-img" />
                  <q-icon v-else name="person" size="20px" color="grey-5" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ voter.name }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-5" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </template>
      <div v-else class="text-center text-grey q-mt-md">
        Individuálne hlasy nie sú k dispozícii
      </div>
    </template>
  </q-page>
</template>

<style scoped>
.float-badge {
  float: right;
  margin: 4px 0 4px 12px;
}
.voter-list {
  border-radius: 12px;
  background: #f8f9fa;
}
.voter-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.voter-item:last-child {
  border-bottom: none;
}
.avatar-img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}
</style>
