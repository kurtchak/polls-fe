<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchMember, fetchMemberVotes } from '../api'
import type { CouncilMember, MemberVote } from '../types'
import VoteBadge from '../components/VoteBadge.vue'

const route = useRoute()
const router = useRouter()
const memberRef = route.params.ref as string

const member = ref<CouncilMember | null>(null)
const votes = ref<MemberVote[]>([])
const loading = ref(false)
const votesLoading = ref(false)

const voteChoiceLabel: Record<string, { label: string; color: string }> = {
  VOTED_FOR: { label: 'Za', color: 'positive' },
  VOTED_AGAINST: { label: 'Proti', color: 'negative' },
  ABSTAIN: { label: 'Zdrž.', color: 'warning' },
  NOT_VOTED: { label: 'Nehl.', color: 'grey-6' },
  ABSENT: { label: 'Nepr.', color: 'grey-4' },
}

const voteChoiceFull: Record<string, string> = {
  VOTED_FOR: 'Za',
  VOTED_AGAINST: 'Proti',
  ABSTAIN: 'Zdržal sa',
  NOT_VOTED: 'Nehlasoval',
  ABSENT: 'Neprítomný',
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

function shortMeeting(name: string): string {
  return name
    .replace(/Mestského zastupiteľstva mesta \S+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

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
      <!-- Header row: photo left, name+season+club+contact right -->
      <div class="row q-mb-sm q-gutter-md items-start">
        <div class="col-auto">
          <q-avatar size="100px">
            <img v-if="member.picture" :src="member.picture" style="object-fit: cover; width: 100%; height: 100%" />
            <q-icon v-else name="person" size="60px" color="grey-5" />
          </q-avatar>
        </div>

        <div class="col">
          <div class="text-h5 q-mb-none">{{ member.name }}</div>
          <div v-if="member.title" class="text-caption text-grey">
            {{ member.title }}
          </div>

          <div class="q-mt-xs q-gutter-xs row items-center">
            <q-badge
              v-if="member.club?.season"
              color="blue-grey"
              :label="member.club.season"
            />
            <q-chip
              v-if="member.club"
              dense
              color="primary"
              text-color="white"
              icon="groups"
              :label="member.club.name"
            />
          </div>

          <div class="q-mt-xs q-gutter-xs row items-center">
            <q-btn
              v-if="member.email"
              flat dense round size="sm"
              icon="email"
              color="primary"
              :href="`mailto:${member.email}`"
            >
              <q-tooltip>{{ member.email }}</q-tooltip>
            </q-btn>
            <q-btn
              v-if="member.phone"
              flat dense round size="sm"
              icon="phone"
              color="primary"
              :href="`tel:${member.phone}`"
            >
              <q-tooltip>{{ member.phone }}</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>

      <!-- Full-width: nominations, functions -->
      <template v-if="uniqueNominees.length">
        <div class="text-caption text-grey q-mb-xs">Nominácie</div>
        <div class="q-gutter-xs q-mb-sm">
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

      <template v-if="functions.length">
        <div class="text-caption text-grey q-mb-xs">Funkcie</div>
        <div class="q-gutter-xs q-mb-sm">
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

      <!-- Voting history header with summary badges top-right -->
      <div class="row items-center q-mt-md q-mb-xs">
        <div class="text-subtitle1">
          Hlasovania
          <span v-if="votes.length" class="text-caption text-grey">({{ votes.length }})</span>
        </div>
        <q-space />
        <div v-if="votes.length && !votesLoading" class="q-gutter-xs row no-wrap items-center">
          <q-badge
            v-for="(info, key) in voteChoiceLabel"
            :key="key"
            :color="info.color"
            :label="`${info.label}: ${voteSummary[key as keyof typeof voteSummary]}`"
            style="font-size: 10px; padding: 2px 4px"
          />
        </div>
      </div>

      <q-spinner-dots v-if="votesLoading" size="30px" color="primary" />

      <template v-else-if="votes.length">
        <div class="vote-cards">
          <q-card
            v-for="(vote, i) in votes"
            :key="i"
            flat
            clickable
            class="vote-card"
            @click="router.push({ name: 'poll-detail', params: { ref: vote.poll.ref } })"
          >
            <q-card-section class="q-py-sm q-px-md">
              <div class="row items-start no-wrap">
                <div class="col">
                  <div class="text-body2 vote-title">
                    {{ vote.poll.agendaItem?.name ?? vote.poll.name }}
                  </div>
                  <div v-if="vote.poll.agendaItem?.meeting" class="text-caption text-grey">
                    {{ shortMeeting(vote.poll.agendaItem.meeting.name) }} | {{ vote.poll.agendaItem.meeting.date }}
                  </div>
                </div>
                <div class="column items-end q-gutter-xs q-ml-sm" style="flex-shrink: 0">
                  <q-badge
                    :color="voteChoiceLabel[vote.voted]?.color ?? 'grey'"
                    :label="voteChoiceFull[vote.voted] ?? vote.voted"
                    style="font-size: 10px"
                  />
                  <VoteBadge :result="vote.poll.result" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </template>

      <div v-else class="text-grey">
        Žiadne hlasovania
      </div>
    </template>
  </q-page>
</template>

<style scoped>
.vote-cards {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.vote-card {
  border-radius: 10px;
  background: #f8f9fa;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.vote-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.vote-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
