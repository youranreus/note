import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import AuthCallbackView from "@/views/AuthCallbackView.vue";
import NoteDetailView from "@/views/NoteDetailView.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: HomeView
  },
  {
    path: "/auth/callback",
    name: "auth-callback",
    component: AuthCallbackView
  },
  {
    path: "/note/o/:sid",
    name: "note-online",
    component: NoteDetailView,
    props: route => ({ sid: route.params.sid, type: "online" })
  },
  {
    path: "/note/l/:sid",
    name: "note-local",
    component: NoteDetailView,
    props: route => ({ sid: route.params.sid, type: "local" })
  }
];

export default createRouter({
  history: createWebHistory(),
  routes
});
