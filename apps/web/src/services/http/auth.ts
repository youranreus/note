import type { AuthCallbackResponse, AuthSessionResponse } from "@/types/auth";
import { alovaClient, axiosClient } from "./client";

export const authMethods = {
  callback: (code: string) =>
    alovaClient.Get<AuthCallbackResponse>(`/api/auth/callback?code=${encodeURIComponent(code)}`),
  session: () => alovaClient.Get<AuthSessionResponse>("/api/auth/session"),
  logout: () => alovaClient.Post<{ ok: true }>("/api/auth/logout")
};

export const authApi = {
  async callback(code: string) {
    const response = await axiosClient.get<AuthCallbackResponse>("/api/auth/callback", {
      params: { code }
    });
    return response.data;
  },
  async session() {
    const response = await axiosClient.get<AuthSessionResponse>("/api/auth/session");
    return response.data;
  },
  async logout() {
    const response = await axiosClient.post<{ ok: true }>("/api/auth/logout");
    return response.data;
  }
};
