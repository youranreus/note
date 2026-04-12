<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import OnlineNoteShell from '@/features/note/components/OnlineNoteShell.vue'
import { resolveSidParam } from '@/router/sid'

const route = useRoute()
const sid = computed(() => resolveSidParam(route.params.sid))
</script>

<template>
  <OnlineNoteShell :sid="sid" />
</template>
