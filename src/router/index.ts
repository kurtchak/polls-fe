import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/:city/:institution/:season/polls',
      name: 'polls',
      component: () => import('../views/PollsView.vue'),
      props: true,
    },
    {
      path: '/polls/:ref',
      name: 'poll-detail',
      component: () => import('../views/PollDetailView.vue'),
      props: true,
    },
    {
      path: '/:city/:institution/:season/members',
      name: 'members',
      component: () => import('../views/MembersView.vue'),
      props: true,
    },
    {
      path: '/members/:ref',
      name: 'member-detail',
      component: () => import('../views/MemberDetailView.vue'),
      props: true,
    },
    {
      path: '/:city/switchers',
      name: 'switchers',
      component: () => import('../views/SwitchersView.vue'),
      props: true,
    },
  ],
})

export default router