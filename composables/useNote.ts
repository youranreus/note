import type { Note } from "@prisma/client";

export const useMemo = (sid?: string) => {
  const memo = ref<Note>({
    sid: '',
    content: '加载中',
    key: '',
    id: 0,
  })

  const loading = ref(false)

  const setContent = (value: string) => {
    memo.value.content = value;
  }

  const setKey = (value: string) => {
    memo.value.key = value;
  }

  const bindInput = computed(() => {
    return {
      value: memo.value.content,
      disabled: loading.value,
      'on-update:value': setContent,
    }
  })

  const bindKeyInput = computed(() => {
    return {
      value: memo.value.key,
      disabled: loading.value,
      'on-update:value': setKey,
    }
  })

  if (sid) {
    loading.value = true;
    useGet<Note>('/api/getNote', { query: { sid } }).then((res) => {
      memo.value = res;
    }).finally(() => {
      loading.value = false;
    })
  }

  return { memo, loading, setContent, setKey, bindInput, bindKeyInput }
}