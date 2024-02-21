import { useMessage } from "naive-ui";
import type { MemoData, MemoRes } from "~/types";

export const useOnlineNote = (sid?: string) => {
  const memo = ref<MemoData>({
    sid: '',
    content: '加载中',
    key: '',
    id: 0,
    locked: false,
    editing: false,
    favoured: false,
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
    usePost<MemoRes>('/api/updateNote', {
      content: memo.value.content,
      key: memo.value.key,
    }, { query: { sid } }).then((res) => {
      Object.assign(memo.value, res)
      memo.value.editing = false
      msg.success('保存成功')
    }).catch((e) => {
      msg.error('保存失败')
    }).finally(() => {
      loading.value = false;
    })
  }

  const del = async () => {
    loading.value = true;
    useGet<MemoRes>('/api/delNote', { query: { sid, key: memo.value.key } }).then((res) => {
      msg.success('删除成功')
      loading.value = false;
      router.push('/')
    }).catch((e) => {
      msg.error('删除失败')
      loading.value = false;
    })
  }

  const setLocked = (value = true) => {
    memo.value.locked = value;
  }

  const toggleFavour = (status = true) => {
    loading.value = true
    useGet<{ msg: string }>('/api/addFavourNote', { query: { id: memo.value.id } })
      .then(() => {
        msg.success('操作成功')
        memo.value.favoured = status
      }).catch((e) => {
        console.log(e)
        msg.error('操作失败')
      }).finally(() => {
        loading.value = false
      })
  }

  if (sid) {
    loading.value = true;
    useGet<MemoRes>('/api/getNote', { query: { sid } })
      .then((res) => {
        Object.assign(memo.value, res)
      }).catch((e) => {
        memo.value.sid = sid;
        memo.value.content = '';
      }).finally(() => {
        loading.value = false;
      })
  }

  return { memo, loading, setContent, setKey, setLocked, bindInput, bindKeyInput, bindToolbar, save, del, toggleFavour }
}