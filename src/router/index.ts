import { createRouter, createWebHistory } from 'vue-router';

// Three-step flow, all under the /sheet/ prefix:
//   /sheet                  pick a platform            (HomeView)
//   /sheet/:slug            enter an edition code      (PlatformView)
//   /sheet/:slug/:edition   the match's game center    (GameCenterView)
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: { name: 'home' } },
    {
      path: '/sheet',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/sheet/:slug',
      name: 'platform',
      component: () => import('../views/PlatformView.vue'),
      props: true,
    },
    {
      path: '/sheet/:slug/:edition',
      name: 'game-center',
      component: () => import('../views/GameCenterView.vue'),
      props: true,
    },
  ],
});

export default router;
