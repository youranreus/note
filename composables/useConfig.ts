export const useConfig = async <T>(key: string) => {
  const baseUrl = useRuntimeConfig().public.configHost;
  const res = await useLazyFetch<T>(`${baseUrl}/config/get?slug=${key}`)

  return res;
}