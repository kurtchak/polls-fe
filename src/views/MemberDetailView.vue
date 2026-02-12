<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchMember } from '../api'
import type { CouncilMember } from '../types'

const props = defineProps<{ ref: string }>()

const member = ref<CouncilMember | null>(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    member.value = await fetchMember(props.ref)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <q-page padding>
    <q-spinner-dots v-if="loading" size="40px" color="primary" class="absolute-center" />

    <template v-else-if="member">
      <div class="column items-center q-mb-md">
        <q-avatar size="120px" class="q-mb-sm">
          <img v-if="member.politician.picture" :src="member.politician.picture" />
          <q-icon v-else name="person" size="80px" color="grey-5" />
        </q-avatar>
        <div class="text-h5">{{ member.politician.name }}</div>
        <div v-if="member.politician.titles" class="text-caption text-grey">
          {{ member.politician.titles }}
        </div>
      </div>

      <q-list bordered separator>
        <q-item v-if="member.clubMember">
          <q-item-section avatar><q-icon name="groups" color="primary" /></q-item-section>
          <q-item-section>
            <q-item-label caption>Klub</q-item-label>
            <q-item-label>{{ member.clubMember.club.name }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-if="member.politician.email">
          <q-item-section avatar><q-icon name="email" color="primary" /></q-item-section>
          <q-item-section>
            <q-item-label caption>Email</q-item-label>
            <q-item-label>{{ member.politician.email }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-if="member.politician.phone">
          <q-item-section avatar><q-icon name="phone" color="primary" /></q-item-section>
          <q-item-section>
            <q-item-label caption>Telefón</q-item-label>
            <q-item-label>{{ member.politician.phone }}</q-item-label>
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

      <template v-if="member.politician.partyNominees?.length">
        <div class="text-subtitle1 q-mt-md q-mb-sm">Strana</div>
        <q-chip
          v-for="(nom, i) in member.politician.partyNominees"
          :key="i"
          color="primary"
          text-color="white"
          :label="nom.party.name"
        />
      </template>
    </template>
  </q-page>
</template>
