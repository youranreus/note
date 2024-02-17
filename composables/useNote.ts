import type { Note } from "@prisma/client";
import { useMessage } from "naive-ui";

export const useMemo = (sid?: string) => {
  const memo = ref<Note>({
    sid: '',
    content: '加载中',
    key: '',
    id: 0,
  })

  const loading = ref(false)
  const router = useRouter()
  const msg = useMessage()

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

  const save = async () => {
    loading.value = true;
    usePost<Omit<Note, 'key'>>('/api/updateNote', {
      content: memo.value.content,
      key: memo.value.key,
    }, { query: { sid } }).then((res) => {
      Object.assign(memo.value, res)
      msg.success('保存成功')
    }).catch((e) => {
      msg.error('保存失败')
    }).finally(() => {
      loading.value = false;
    })
  }

  const del = async () => {
    console.log('删除')
    msg.success('删除成功')
    router.push('/')
  }

  if (sid) {
    loading.value = true;
    useGet<Omit<Note, 'key'>>('/api/getNote', { query: { sid } }).then((res) => {
      Object.assign(memo.value, res)
    }).catch((e) => {
      memo.value.sid = sid;
      memo.value.content = '';
    }).finally(() => {
      loading.value = false;
    })
  }

  return { memo, loading, setContent, setKey, bindInput, bindKeyInput, save, del }
}