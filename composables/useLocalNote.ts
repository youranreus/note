import { useMessage } from "naive-ui";
import localforage from 'localforage';
import type { MemoData } from "~/types";

export const useLocalNote = (sid?: string) => {
  const memo = ref<MemoData>({
    sid: '',
    content: '',
    key: '',
    id: 0,
    locked: false,
    editing: false,
    authorId: null,
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
      'on-update:value': (val: string) => {
        setContent(val)
        memo.value.editing = true
      },
    }
  })

  const bindKeyInput = computed(() => {
    return {
      value: memo.value.key,
      disabled: loading.value,
      'on-update:value': setKey,
    }
  })

  const bindToolbar = computed(() => ({
    disabled: loading.value || !memo.value.content,
  }))

  const save = async () => {
    loading.value = true;
    localforage.setItem(`memo-${sid}`, {...memo.value, editing: false}).then(() => {
      memo.value.editing = false
      msg.success('保存成功')
    }).finally(() => {
      loading.value = false;
    })
  }

  const del = async () => {
    loading.value = true;
    localforage.removeItem(`memo-${sid}`).then(() => {
      msg.success('删除成功')
      loading.value = false;
      router.push('/')
    }).catch((e) => {
      msg.error('删除失败')
      loading.value = false;
    })
  }

  const setLocked = (value = true) => {
    memo.value.locked = true;
  }

  if (sid) {
    loading.value = true;
    localforage.getItem(`memo-${sid}`).then((data) => {
      Object.assign(memo.value, data);
    }).finally(() => {
      loading.value = false;
      memo.value.sid = memo.value.sid || sid;
    })
  }

  return { memo, loading, setContent, setKey, setLocked, bindInput, bindKeyInput, bindToolbar, save, del }
}