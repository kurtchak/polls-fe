<script setup lang="ts">
import type { Poll } from '../types'
import VoteBadge from './VoteBadge.vue'
import VoteBar from './VoteBar.vue'

defineProps<{ poll: Poll }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <q-card flat class="poll-card q-mb-sm" @click="$emit('click')">
    <q-card-section>
      <div class="q-mb-xs">
        <VoteBadge :result="poll.result" class="float-badge" />
        <div class="text-subtitle2">{{ poll.agendaItem?.name ?? poll.name }}</div>
      </div>
      <VoteBar :votes-count="poll.votesCount" :voters="poll.voters" />
    </q-card-section>
  </q-card>
</template>

<style scoped>
.poll-card {
  cursor: pointer;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s;
}
.poll-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.float-badge {
  float: right;
  margin: 2px 0 4px 8px;
}
</style>
