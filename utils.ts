import { createDefine } from "fresh";

export type AppRole = "admin" | "teacher" | "student";

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface State {
  shared: string;
  auth: {
    userId: string;
    role: AppRole;
    isAuthenticated: boolean;
    mustChangePassword: boolean;
  };
}

export const define = createDefine<State>();
