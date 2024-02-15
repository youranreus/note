export const useMemo = (id?: string) => {
  const memo = ref({
    key: '',
    content: 'note',
    password: '',
  })

  const setContent = (value: string) => {
    memo.value.content = value;
  }

  const bindInput = computed(() => {
    return {
      value: memo.value.content,
      'on-update:value': setContent,
    }
  })

  if (id) {
    console.log(`获取memo#${id}`)
  }

  return { memo, bindInput }
}