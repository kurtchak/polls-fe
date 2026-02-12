<script setup lang="ts">
import type { CouncilMember } from '../types'

defineProps<{ member: CouncilMember }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <q-card flat bordered class="member-card" @click="$emit('click')">
    <q-card-section class="column items-center text-center q-pa-sm">
      <q-avatar size="64px" class="q-mb-xs">
        <img v-if="member.politician.picture" :src="member.politician.picture" :alt="member.politician.name" />
        <q-icon v-else name="person" size="40px" color="grey-5" />
      </q-avatar>
      <div class="text-subtitle2 ellipsis-2-lines">{{ member.politician.name }}</div>
      <div v-if="member.clubMember" class="text-caption text-grey">
        {{ member.clubMember.club.name }}
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.member-card {
  cursor: pointer;
}
</style>
