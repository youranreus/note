import axios from "axios";
import { createAlova } from "alova";
import VueHook from "alova/vue";
import { axiosRequestAdapter } from "@alova/adapter-axios";
import type { AxiosResponse } from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

export const axiosClient = axios.create({
  baseURL,
  timeout: 10_000,
  withCredentials: true
});

axiosClient.interceptors.response.use(
  response => response,
  error => {
    const message = error?.response?.data?.message ?? error?.message ?? "Request failed";
    return Promise.reject(new Error(message));
  }
);

export const alovaClient = createAlova({
  baseURL,
  statesHook: VueHook,
  requestAdapter: axiosRequestAdapter({
    axios: axiosClient
  }),
  responded: {
    onSuccess(response) {
      return (response as AxiosResponse).data;
    },
    onError(error) {
      const message = error?.response?.data?.message ?? error?.message ?? "Request failed";
      return Promise.reject(new Error(message));
    }
  }
});
