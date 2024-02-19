export const useUser = () => {
  const userStore = useUserStore();

  return {
    ...userStore,
    ...storeToRefs(userStore),
  }
}