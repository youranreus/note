export interface UserSummary {
  ssoId: number;
  name?: string;
  avatar?: string;
}

export interface AuthSessionResponse {
  logged: boolean;
  user?: UserSummary;
}

export interface AuthCallbackResponse {
  ok: true;
  user: UserSummary;
}
