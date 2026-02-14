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

const uniqueNominees = computed(() =>
  member.value?.nominee ? [...new Set(member.value.nominee)] : []
)

const functions = computed(() => {
  if (!member.value?.otherFunctions) return []
  return member.value.otherFunctions
    .split(',')
    .map(f => f.trim())
    .filter((f, i, arr) => f.length > 0 && arr.indexOf(f) === i)
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
      <!-- Header: photo+meta left, name+nominations right -->
      <div class="row q-mb-md q-gutter-md items-start">
        <!-- Left column: photo, season, club, contact -->
        <div class="col-auto column items-center" style="min-width: 110px">
          <q-avatar size="100px" class="q-mb-xs">
            <img v-if="member.picture" :src="member.picture" />
            <q-icon v-else name="person" size="60px" color="grey-5" />
          </q-avatar>
          <q-badge
            v-if="member.club?.season"
            color="blue-grey"
            :label="`${member.club.season}`"
            class="q-mb-xs"
          />
          <q-chip
            v-if="member.club"
            dense
            color="primary"
            text-color="white"
            icon="groups"
            :label="member.club.name"
            class="q-mb-xs"
          />
          <div class="q-gutter-xs row justify-center">
            <q-btn
              v-if="member.email"
              flat dense round size="sm"
              icon="email"
              color="primary"
              :href="`mailto:${member.email}`"
              tag="a"
            >
              <q-tooltip>{{ member.email }}</q-tooltip>
            </q-btn>
            <q-btn
              v-if="member.phone"
              flat dense round size="sm"
              icon="phone"
              color="primary"
              :href="`tel:${member.phone}`"
              tag="a"
            >
              <q-tooltip>{{ member.phone }}</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Right column: name, title, nominations -->
        <div class="col">
          <div class="text-h5 q-mb-none">{{ member.name }}</div>
          <div v-if="member.title" class="text-caption text-grey">
            {{ member.title }}
          </div>

          <template v-if="uniqueNominees.length">
            <div class="text-caption text-grey q-mt-sm q-mb-xs">Nominácie</div>
            <div class="q-gutter-xs">
              <q-chip
                v-for="(party, i) in uniqueNominees"
                :key="i"
                dense
                color="teal"
                text-color="white"
                icon="how_to_vote"
                :label="party"
              />
            </div>
          </template>

          <!-- Functions as chips -->
          <template v-if="functions.length">
            <div class="text-caption text-grey q-mt-sm q-mb-xs">Funkcie</div>
            <div class="q-gutter-xs">
              <q-chip
                v-for="(fn, i) in functions"
                :key="i"
                dense
                outline
                color="grey-8"
                :label="fn"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- Voting history header with summary badges top-right -->
      <div class="row items-center q-mt-md q-mb-xs">
        <div class="text-subtitle1">
          Hlasovania
          <span v-if="votes.length" class="text-caption text-grey">({{ votes.length }})</span>
        </div>
        <q-space />
        <div v-if="votes.length && !votesLoading" class="q-gutter-xs">
          <q-badge
            v-for="(info, key) in voteChoiceLabel"
            :key="key"
            :color="info.color"
            :label="`${info.label}: ${voteSummary[key as keyof typeof voteSummary]}`"
            class="q-pa-xs"
          />
        </div>
      </div>

      <q-spinner-dots v-if="votesLoading" size="30px" color="primary" />

      <template v-else-if="votes.length">
        <q-list bordered separator dense>
          <q-item
            v-for="(vote, i) in votes"
            :key="i"
            clickable
            :to="{ name: 'poll-detail', params: { ref: vote.poll.ref } }"
          >
            <q-item-section>
              <q-item-label>{{ vote.poll.agendaItem?.name ?? vote.poll.name }}</q-item-label>
              <q-item-label v-if="vote.poll.agendaItem?.meeting" caption>
                {{ vote.poll.agendaItem.meeting.name }} | {{ vote.poll.agendaItem.meeting.date }}
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
