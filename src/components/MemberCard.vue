<script setup lang="ts">
import type { CouncilMember } from '../types'

defineProps<{ member: CouncilMember }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <q-card flat class="member-card" @click="$emit('click')">
    <q-card-section class="column items-center text-center q-pa-sm">
      <q-avatar size="64px" class="q-mb-xs">
        <img v-if="member.picture" :src="member.picture" :alt="member.name" class="avatar-img" />
        <q-icon v-else name="person" size="40px" color="grey-5" />
      </q-avatar>
      <div class="text-subtitle2 ellipsis-2-lines">{{ member.name }}</div>
      <div v-if="member.club" class="text-caption text-grey">
        {{ member.club.name }}
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.member-card {
  cursor: pointer;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s;
}
.member-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.avatar-img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}
</style>
