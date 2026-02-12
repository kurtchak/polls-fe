<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchMembers } from '../api'
import type { CouncilMember } from '../types'
import MemberCard from '../components/MemberCard.vue'

const props = defineProps<{ city: string; institution: string; season: string }>()
const router = useRouter()

const members = ref<CouncilMember[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    members.value = await fetchMembers(props.city, props.institution, props.season)
  } finally {
    loading.value = false
  }
})

function goToMember(member: CouncilMember) {
  router.push({ name: 'member-detail', params: { ref: member.ref } })
}
</script>

<template>
  <q-page padding>
    <div class="text-h6 q-mb-md">Poslanci</div>

    <q-spinner-dots v-if="loading" size="40px" color="primary" class="absolute-center" />

    <div v-else class="row q-col-gutter-sm">
      <div v-for="member in members" :key="member.ref" class="col-6 col-sm-4 col-md-3">
        <MemberCard :member="member" @click="goToMember(member)" />
      </div>
    </div>
  </q-page>
</template>
