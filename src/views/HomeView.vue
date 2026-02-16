<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchTowns, addTown, triggerSync } from '../api'
import { useNavigationStore } from '../stores/navigation'
import { useSyncStore } from '../stores/sync'
import type { Town } from '../types'

const router = useRouter()
const nav = useNavigationStore()
const sync = useSyncStore()

const towns = ref<Town[]>([])
const loading = ref(false)

// Add town dialog
const showAddDialog = ref(false)
const selectedDmTown = ref<{ ref: string; name: string } | null>(null)
const newTownRef = ref('')
const newTownName = ref('')
const adding = ref(false)

const dmTowns = [
  { ref: 'bardejov', name: 'Bardejov' },
  { ref: 'galanta', name: 'Galanta' },
  { ref: 'handlova', name: 'Handlová' },
  { ref: 'kezmarok', name: 'Kežmarok' },
  { ref: 'michalovce', name: 'Michalovce' },
  { ref: 'myjava', name: 'Myjava' },
  { ref: 'namestovo', name: 'Námestovo' },
  { ref: 'nove-zamky', name: 'Nové Zámky' },
  { ref: 'piestany', name: 'Piešťany' },
  { ref: 'sabinov', name: 'Sabinov' },
  { ref: 'snina', name: 'Snina' },
  { ref: 'spisska-nova-ves', name: 'Spišská Nová Ves' },
  { ref: 'svidnik', name: 'Svidník' },
  { ref: 'topolcany', name: 'Topoľčany' },
  { ref: 'trnava', name: 'Trnava' },
  { ref: 'vranov-nad-toplou', name: 'Vranov nad Topľou' },
  { ref: 'zlate-moravce', name: 'Zlaté Moravce' },
  { ref: 'zilina', name: 'Žilina' },
]

const availableTowns = ref(dmTowns)

function updateAvailableTowns() {
  const existingRefs = new Set(towns.value.map(t => t.ref))
  availableTowns.value = dmTowns.filter(t => !existingRefs.has(t.ref))
}

onMounted(async () => {
  loading.value = true
  try {
    towns.value = (await fetchTowns()).sort((a, b) => a.name.localeCompare(b.name, 'sk'))
    updateAvailableTowns()
  } finally {
    loading.value = false
  }
})

function onTownClick(town: Town) {
  nav.selectTown(town)
  router.push({
    name: 'seasons',
    params: { city: town.ref, institution: nav.institution },
  })
}

function onSelectDmTown(opt: { ref: string; name: string } | null) {
  if (opt) {
    newTownRef.value = opt.ref
    newTownName.value = opt.name
  } else {
    newTownRef.value = ''
    newTownName.value = ''
  }
}

async function onAddTown() {
  if (!newTownRef.value || !newTownName.value) return
  adding.value = true
  try {
    await addTown(newTownRef.value, newTownName.value, 'DM')
    towns.value = (await fetchTowns()).sort((a, b) => a.name.localeCompare(b.name, 'sk'))
    updateAvailableTowns()
    showAddDialog.value = false
    selectedDmTown.value = null
    newTownRef.value = ''
    newTownName.value = ''
  } finally {
    adding.value = false
  }
}

async function onSyncTown(townRef: string, event: Event) {
  event.stopPropagation()
  try {
    await triggerSync(townRef)
    sync.startPolling()
  } catch {
    // already running
  }
}
</script>

<template>
  <q-page padding>
    <q-spinner-dots v-if="loading" size="40px" color="primary" class="absolute-center" />

    <template v-else>
      <div class="row items-center q-mb-md">
        <div class="text-h6">Vyberte mesto</div>
        <q-space />
        <q-btn flat round icon="add" color="primary" @click="showAddDialog = true">
          <q-tooltip>Pridať mesto</q-tooltip>
        </q-btn>
      </div>
      <q-list class="home-list">
        <q-item v-for="town in towns" :key="town.ref" clickable v-ripple @click="onTownClick(town)">
          <q-item-section avatar>
            <q-icon name="location_city" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ town.name }}</q-item-label>
            <q-item-label v-if="town.lastSyncDate" caption>
              Sync: {{ town.lastSyncDate }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat round dense icon="sync" size="sm" color="grey-6"
              @click="onSyncTown(town.ref, $event)"
              :loading="sync.status?.running && sync.status?.currentTown === town.ref"
            >
              <q-tooltip>Synchronizovať {{ town.name }}</q-tooltip>
            </q-btn>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
      </q-list>
    </template>

    <q-dialog v-model="showAddDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Pridať mesto</div>
        </q-card-section>

        <q-card-section>
          <q-select
            v-model="selectedDmTown"
            :options="availableTowns"
            option-label="name"
            label="Mesto z DM API"
            clearable
            @update:model-value="onSelectDmTown"
            outlined dense
          />
          <div class="q-mt-sm text-caption text-grey-6">
            Alebo zadajte vlastné:
          </div>
          <q-input v-model="newTownRef" label="Ref (napr. bardejov)" outlined dense class="q-mt-sm" />
          <q-input v-model="newTownName" label="Názov (napr. Bardejov)" outlined dense class="q-mt-sm" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Zrušiť" v-close-popup />
          <q-btn
            color="primary" label="Pridať"
            :loading="adding"
            :disable="!newTownRef || !newTownName"
            @click="onAddTown"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.home-list {
  border-radius: 12px;
  background: #f8f9fa;
}
.home-list :deep(.q-item) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.home-list :deep(.q-item:last-child) {
  border-bottom: none;
}
</style>