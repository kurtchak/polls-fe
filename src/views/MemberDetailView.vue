<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchMember, fetchMemberVotes } from '../api'
import type { CouncilMember, MemberVote } from '../types'
import VoteBadge from '../components/VoteBadge.vue'

const route = useRoute()
const memberRef = route.params.ref as string

const member = ref<CouncilMember | null>(null)
const votes = ref<MemberVote[]>([])
const loading = ref(false)
const votesLoading = ref(false)

const voteChoiceLabel: Record<string, { label: string; color: string }> = {
  VOTED_FOR: { label: 'Za', color: 'positive' },
  VOTED_AGAINST: { label: 'Proti', color: 'negative' },
  ABSTAIN: { label: 'Zdržal sa', color: 'warning' },
  NOT_VOTED: { label: 'Nehlasoval', color: 'grey-6' },
  ABSENT: { label: 'Neprítomný', color: 'grey-4' },
}

const voteSummary = computed(() => {
  const counts = { VOTED_FOR: 0, VOTED_AGAINST: 0, ABSTAIN: 0, NOT_VOTED: 0, ABSENT: 0 }
  for (const v of votes.value) {
    counts[v.voted] = (counts[v.voted] || 0) + 1
  }
  return counts
})

onMounted(async () => {
  loading.value = true
  try {
    member.value = await fetchMember(memberRef)
  } finally {
    loading.value = false
  }

  votesLoading.value = true
  try {
    votes.value = await fetchMemberVotes(memberRef)
  } finally {
    votesLoading.value = false
  }
})
</script>

<template>
  <q-page padding>
    <q-spinner-dots v-if="loading" size="40px" color="primary" class="absolute-center" />

    <template v-else-if="member">
      <div class="column items-center q-mb-md">
        <q-avatar size="120px" class="q-mb-sm">
          <img v-if="member.picture" :src="member.picture" />
          <q-icon v-else name="person" size="80px" color="grey-5" />
        </q-avatar>
        <div class="text-h5">{{ member.name }}</div>
        <div v-if="member.title" class="text-caption text-grey">
          {{ member.title }}
        </div>
      </div>

      <q-list bordered separator>
        <q-item v-if="member.club">
          <q-item-section avatar><q-icon name="groups" color="primary" /></q-item-section>
          <q-item-section>
            <q-item-label caption>Klub</q-item-label>
            <q-item-label>{{ member.club.name }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-if="member.email">
          <q-item-section avatar><q-icon name="email" color="primary" /></q-item-section>
          <q-item-section>
            <q-item-label caption>Email</q-item-label>
            <q-item-label>{{ member.email }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-if="member.phone">
          <q-item-section avatar><q-icon name="phone" color="primary" /></q-item-section>
          <q-item-section>
            <q-item-label caption>Telefón</q-item-label>
            <q-item-label>{{ member.phone }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-if="member.otherFunctions">
          <q-item-section avatar><q-icon name="work" color="primary" /></q-item-section>
          <q-item-section>
            <q-item-label caption>Funkcie</q-item-label>
            <q-item-label>{{ member.otherFunctions }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <template v-if="member.nominee?.length">
        <div class="text-subtitle1 q-mt-md q-mb-sm">Nominácia</div>
        <q-chip
          v-for="(party, i) in [...new Set(member.nominee)]"
          :key="i"
          color="primary"
          text-color="white"
          :label="party"
        />
      </template>

      <!-- Voting history -->
      <div class="text-subtitle1 q-mt-lg q-mb-sm">
        Hlasovania
        <span v-if="votes.length" class="text-caption text-grey">({{ votes.length }})</span>
      </div>

      <q-spinner-dots v-if="votesLoading" size="30px" color="primary" />

      <template v-else-if="votes.length">
        <!-- Summary chips -->
        <div class="q-mb-md q-gutter-xs">
          <q-badge
            v-for="(info, key) in voteChoiceLabel"
            :key="key"
            :color="info.color"
            :label="`${info.label}: ${voteSummary[key as keyof typeof voteSummary]}`"
            class="q-pa-xs"
          />
        </div>

        <q-list bordered separator>
          <q-item
            v-for="(vote, i) in votes"
            :key="i"
            clickable
            :to="{ name: 'poll-detail', params: { ref: vote.poll.ref } }"
          >
            <q-item-section>
              <q-item-label>{{ vote.poll.agendaItem?.name ?? vote.poll.name }}</q-item-label>
              <q-item-label caption>
                {{ vote.poll.agendaItem?.meeting?.date }}
              </q-item-label>
            </q-item-section>
            <q-item-section side class="row items-center no-wrap q-gutter-xs">
              <q-badge
                :color="voteChoiceLabel[vote.voted]?.color ?? 'grey'"
                :label="voteChoiceLabel[vote.voted]?.label ?? vote.voted"
              />
              <VoteBadge :result="vote.poll.result" />
            </q-item-section>
          </q-item>
        </q-list>
      </template>

      <div v-else class="text-grey">
        Žiadne hlasovania
      </div>
    </template>
  </q-page>
</template>
