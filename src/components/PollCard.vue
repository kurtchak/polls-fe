<script setup lang="ts">
import type { Poll } from '../types'
import VoteBadge from './VoteBadge.vue'
import VoteBar from './VoteBar.vue'

defineProps<{ poll: Poll }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <q-card flat bordered class="poll-card q-mb-sm" @click="$emit('click')">
    <q-card-section>
      <div class="row items-center justify-between q-mb-xs">
        <div class="text-subtitle2 col">{{ poll.name }}</div>
        <VoteBadge :result="poll.result" />
      </div>
      <VoteBar :votes-count="poll.votesCount" :voters="poll.voters" />
    </q-card-section>
  </q-card>
</template>

<style scoped>
.poll-card {
  cursor: pointer;
}
</style>
