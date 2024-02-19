<template>
  <div class="tw-w-[768px]">
    <n-h2 class="tw-mb-2">
      #{{ sid }}
      <n-button quaternary size="tiny" @click="returnHome">
        <template #icon>
          <n-icon :component="ReturnDownBackOutline"/>
        </template>
      </n-button>
    </n-h2>
    <detail-bar class="tw-mb-3" :memo="memo" :type="type"/>
    <n-card :bordered="false" embedded size="small">
      <n-input
        v-bind="bindInput"
        type="textarea"
        :autosize="{
          minRows: 20,
          maxRows: 20
        }"
        placeholder="Begin your story."
      />

      <template #action>
        <n-space justify="end">
          <n-input v-if="memo.locked" v-bind="bindKeyInput" placeholder="秘钥">
            <template #prefix>
              <n-icon :component="Key"/>
            </template>
          </n-input>
          <n-button-group>
            <n-button v-if="!memo.locked && type === NoteType.ONLINE" type="default" secondary v-bind="bindToolbar" @click="setLocked()">
              <template #icon>
                <n-icon :component="LockClosedOutline"/>
              </template>
              加密
            </n-button>
            <n-button type="default" secondary v-bind="bindToolbar" @click="save">
              <template #icon>
                <n-icon :component="SaveOutline"/>
              </template>
              保存
            </n-button>
            <n-button type="error" secondary  @click="del">
              <template #icon>
                <n-icon :component="TrashOutline"/>
              </template>
              删除
            </n-button>
          </n-button-group>
        </n-space>
      </template>
    </n-card>
  </div>
</template>
<script setup lang="ts">
import { TrashOutline, SaveOutline, Key, LockClosedOutline, ReturnDownBackOutline } from '@vicons/ionicons5'
import { NoteType } from '~/types'

definePageMeta({
  name: 'NoteDetail',
})
const route = useRoute()
const router = useRouter()
const type = computed(() => route.params.type as NoteType)
const sid = computed(() => route.params.id as string)
const { memo, bindInput, save, del, bindKeyInput, bindToolbar, setLocked } = useMemo(sid.value, type.value)

const returnHome = () => {
  router.push('/')
}
</script>