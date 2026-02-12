<script setup lang="ts">
import { computed } from 'vue'
import type { VotesCount } from '../types'

const props = defineProps<{ votesCount: VotesCount; voters: number }>()

const segments = computed(() => {
  const total = props.voters
  if (!total) return []
  const v = props.votesCount
  return [
    { color: '#4caf50', value: v.votedFor, label: `Za: ${v.votedFor}` },
    { color: '#f44336', value: v.votedAgainst, label: `Proti: ${v.votedAgainst}` },
    { color: '#ff9800', value: v.abstain, label: `Zdržal sa: ${v.abstain}` },
    { color: '#9e9e9e', value: v.notVoted, label: `Nehlasoval: ${v.notVoted}` },
    { color: '#e0e0e0', value: v.absent, label: `Neprítomný: ${v.absent}` },
  ].filter(s => s.value > 0)
})
</script>

<template>
  <div class="vote-bar">
    <div class="bar">
      <div
        v-for="(seg, i) in segments"
        :key="i"
        class="segment"
        :style="{ width: (seg.value / voters * 100) + '%', backgroundColor: seg.color }"
        :title="seg.label"
      />
    </div>
    <div class="legend">
      <span v-for="(seg, i) in segments" :key="i" class="legend-item">
        <span class="dot" :style="{ backgroundColor: seg.color }" />
        {{ seg.label }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}
.segment {
  height: 100%;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
  font-size: 11px;
  color: #666;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 3px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
</style>
