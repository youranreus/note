<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
import TextInput from '@/components/ui/TextInput.vue'

const model = defineModel<string>({ default: '' })

defineEmits<{
  submitOnline: [event: SubmitEvent]
  startLocal: [event: MouseEvent]
}>()
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-[28.75rem] flex-col justify-center pb-16">
    <form class="grid gap-2.5" @submit.prevent="$emit('submitOnline', $event)">
      <TextInput
        v-model="model"
        auto-capitalize="off"
        auto-complete="off"
        enter-key-hint="go"
        hint="输入 ID 后即可进入便签。"
        input-mode="text"
        label="ID"
        placeholder="输入 ID"
        :spellcheck="false"
      />

      <div class="grid gap-2.5 pt-1">
        <Button class="w-full" type="submit" variant="primary">
          在线便签
        </Button>
        <Button class="w-full" type="button" variant="secondary" @click="$emit('startLocal', $event)">
          本地便签
        </Button>
      </div>
    </form>
  </div>
</template>
