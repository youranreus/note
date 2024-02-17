<template>
  <div class="tw-w-[500px]">
    <n-card :bordered="false" embedded size="small" :title="`#${sid}`">
      <n-input
        v-bind="bindInput"
        type="textarea"
        :autosize="{
          minRows: 20,
          maxRows: 20
        }"
        placeholder="..."
      />
    </n-card>
  </div>
</template>
<script setup lang="ts">
definePageMeta({
  name: 'OnlineNote'
})
const route = useRoute();
const sid = computed(() => route.params.id as string);
const { memo, bindInput } = useMemo(sid.value);

</script>