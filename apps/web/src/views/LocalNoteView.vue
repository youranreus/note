<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import LocalNoteShell from '@/features/local-note/components/LocalNoteShell.vue'
import { resolveSidParam } from '@/router/sid'

const route = useRoute()
const sid = computed(() => resolveSidParam(route.params.sid))
</script>

<template>
  <LocalNoteShell :sid="sid" />
</template>
