export const useConfig = async <T>(key: string) => {
  const baseUrl = useRuntimeConfig().public.configHost;
  return await useGet<T>(`${baseUrl}/config/get?slug=${key}`);
}