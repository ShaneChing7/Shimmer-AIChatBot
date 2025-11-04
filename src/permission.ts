import { website } from "./settings";
//路由鉴权
import router from "@/router";

import pinia from "./store";
import useUserStore from "./store/modules/user";
const userStore = useUserStore(pinia);
// 1. 定义白名单 (根据你的 constantRoute)
const whiteList = ['/', '/404'];
//全局守卫
//前置守卫
//@ts-ignore
router.beforeEach(async (to: any, from: any, next: any) => {
  //to：将要访问的路由

  //from：从哪个路由来

  //next：路由的放行函数
  document.title = `${website.title} - ${to.meta.title}`;
  const token = userStore.token;
  const username = userStore.username;
  if (token) {
    if (username) {
      next();
    } else {
      try {
        await userStore.userInfo();
        next({ ...to, replace: true });
      } catch (error) {
        // token 过期等
        console.error('获取用户信息失败:', error);
        await userStore.userLogout();
        // 即使token失效，访问 / 也是允许的
        // 但如果访问的是其他受保护页，这里就需要 next('/')
        // 所以我们依赖 else 分支中的白名单判断
        next();
      }
    }
  } else {
    // --- 2. 用户没有 token (未登录) ---

    if (whiteList.includes(to.path)) {
      // 访问的路径在白名单中 (如 / 或 /404)
      next();
    } else {
      // 访问受保护的页面，重定向到登录页 (/)
      next('/');
    }
  }
});
//后置守卫
router.afterEach(() => {});
