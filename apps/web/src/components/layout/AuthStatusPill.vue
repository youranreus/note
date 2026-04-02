<script setup lang="ts">
import { storeToRefs } from 'pinia'

import StatusPill from '@/components/ui/StatusPill.vue'
import { useAuthStore } from '@/stores/auth-store'

const authStore = useAuthStore()
const { description, label, tone } = storeToRefs(authStore)
</script>

<template>
  <StatusPill :caption="description" :label="label" :tone="tone" state="default" />
</template>
