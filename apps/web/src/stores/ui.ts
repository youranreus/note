import { defineStore } from "pinia";
import { ref } from "vue";

export const useUiStore = defineStore("ui", () => {
  const userPanelVisible = ref(false);

  function openUserPanel() {
    userPanelVisible.value = true;
  }

  function closeUserPanel() {
    userPanelVisible.value = false;
  }

  return {
    userPanelVisible,
    openUserPanel,
    closeUserPanel
  };
});
