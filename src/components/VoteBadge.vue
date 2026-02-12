<script setup lang="ts">
import type { VoteResult } from '../types'

const props = defineProps<{ result: VoteResult | null }>()
</script>

<template>
  <q-badge
    v-if="props.result"
    :color="props.result === 'PASSED' ? 'positive' : 'negative'"
    :label="props.result === 'PASSED' ? 'SCHVÁLENÉ' : 'ZAMIETNUTÉ'"
  />
</template>
