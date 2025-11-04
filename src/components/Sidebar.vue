<template>

  <div class=" transition-all duration-200 h-screen border-r border-border bg-sidebar  flex flex-col overflow-y-hidden overflow-x-hidden"
    :class="{'w-60': isExpanded, 'w-16': !isExpanded}">

    <div class="border-b border-sidebar-border pl-3.5  flex  items-center justify-between gap-2 h-16 flex-none">

      <CollapseButton @toggle-sidebar="toggleSidebar" class=" mr-3" />
    </div>

    <!-- addSession -->
    <div class="p-2   flex  items-center justify-center h-16 flex-none ">
      <div @click="addSession" :class="[
        'hover:bg-muted border rounded-md py-2 w-full bg-white flex items-center dark:bg-gray-500',
        !isLoggedIn ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      ]">

        <div class="pl-[11px]">
          <SquarePen />
        </div>
        <div class="  pl-2 text-black dark:text-white whitespace-nowrap"><span v-show="isExpanded">开启新对话</span></div>
      </div>
    </div>


    <!-- Conversations List -->
    <div class="pl-2 space-y-1 flex-1 overflow-hidden relative">
      <!-- 顶部遮罩 -->
      <div v-show="showTopShadow && isExpanded" class="  pointer-events-none absolute top-0 left-0 right-0 h-8
             bg-gradient-to-b from-background/95 to-transparent transition-opacity duration-300"></div>

      <ScrollArea v-show="isExpanded" @scroll="handleScroll" class="h-full" ref="scrollbarRef">
        <Session v-for="s in sessions" :key="s.id" :session="s" @delete="deleteSession" @select-session="selectSession" :is-active="s.id === chatStore.currentSession?.id"/>
      </ScrollArea>
      
      <!-- 底部遮罩 -->
      <div v-show="showBottomShadow && isExpanded" class="  pointer-events-none absolute bottom-0 left-0 right-0 h-8
             bg-gradient-to-t from-background/95 to-transparent transition-opacity duration-300"></div>
    </div>


    <!-- UserSetting -->
    <div class=" p-2 mr-0.5 flex-none h-16" @click.stop="toggleMenu">
      <div class="flex items-center justify-between rounded-[20px] px-2 py-2 hover:bg-muted cursor-pointer">
        <!-- 左侧头像和用户名 -->
        <div class=" whitespace-nowrap flex items-center space-x-3">
          <Avatar class="w-8 h-8">
            <AvatarImage :src="userStore.avatar" alt="@unovue" />
            <AvatarFallback>{{ userStore.username[0] }}</AvatarFallback>
          </Avatar>
          <span v-show="isExpanded" class=" text-sm text-sidebar-foreground font-medium">{{isLoggedIn ? userStore.username : '请先登录/注册'}}</span>
        </div>
        <!-- 三点菜单按钮 -->
        <div v-show="isExpanded" class="  relative rounded-md">
          <button class="p-1 rounded-md cursor-pointer hover:bg-sidebar-accent transition-colors">
            <Ellipsis class="size-3.5 text-sidebar-foreground" />
          </button>
        </div>
      </div>
    </div>
    <!-- 底部用户菜单 -->
    <div class=" flex-none">
      <UserMenu v-model:visible="menuVisible" @open-settings="settingModalVisible = true"></UserMenu>
    </div>
    <!-- 系统设置模态框 -->
    <SettingsModal v-model:visible="settingModalVisible" />
    <!-- :visible="modalVisible" @update:visible="val => settingModalVisible = val" -->
    <!-- 登录注册模态框 -->
    <LoginModal v-model:visible="loginModalVisible"/>

    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>警告：确认删除？</AlertDialogTitle>
          <AlertDialogDescription>
            此操作将永久删除该会话及其所有消息，是否继续?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel class=" cursor-pointer" @click="handleCancelDelete">取消</AlertDialogCancel>
          <AlertDialogAction @click="handleConfirmDelete"
            class=" border !bg-black cursor-pointer">确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    
  </div>
</template>

<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ref, nextTick, computed, onMounted } from 'vue';
import Session from './Session.vue';
import CollapseButton from './CollapseButton.vue';
import UserMenu from './UserMenu.vue';
import SettingsModal from './SettingsModal.vue';
import LoginModal from './LoginModal.vue';
import { Ellipsis, SquarePen } from "lucide-vue-next";

// 引入 vue-sonner 的 toast 函数
import { toast } from 'vue-sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

//引入用户仓库
import useUserStore from '@/store/modules/user';
const userStore = useUserStore()
//用户是否登录的变量
const isLoggedIn = computed(() => userStore.isLoggedIn)

// ✅ 引入 Chat 仓库
import { useChatStore } from '@/store/modules/chat'; // 假设 Pinia store 路径为 '@/stores/chat'
const chatStore = useChatStore();


// ----------------------------------------------------
// store 中的 sessions
// ----------------------------------------------------
const sessions = computed(() => chatStore.sessions || []);
//点击底部出现的上拉菜单
const menuVisible = ref(false);
//点击上拉菜单里系统设置出现的模态框
const settingModalVisible = ref(false);
//滚动条实例
const scrollbarRef = ref()
//显示顶部的白色渐变遮罩
const showTopShadow = ref(false)
//显示底部的白色渐变遮罩
const showBottomShadow = ref(true)
//登录注册模态框
const loginModalVisible = ref(false)

// ✅ 3. 新增 AlertDialog 相关的状态
const sessionToDelete = ref<number | null>(null); // 存储待删除的 session ID
const showDeleteDialog = ref(false);          // 控制删除确认框的显示

// 1. 新增一个状态：侧边栏是否展开
const isExpanded = ref(true); // 默认展开

// 2. 移除父组件监听事件，改为组件内部方法
const toggleSidebar = (value: boolean) => {
  isExpanded.value = value;
  // 切换后，重新检查阴影（因为尺寸变化可能影响滚动条）
  nextTick(() => handleScroll());
};

const handleScroll = () => {
  const wrap = scrollbarRef.value?.wrapRef
  if (!wrap) return

  const { scrollTop, scrollHeight, clientHeight } = wrap

  showTopShadow.value = scrollTop > 10
  showBottomShadow.value = scrollTop + clientHeight < scrollHeight - 10
}

// 初始化时检查一次
nextTick(() => handleScroll())
// ----------------------------------------------------
// ✅ 新增功能：选择会话，调用 Store 加载详情
// ----------------------------------------------------
const selectSession = async (sessionId: number) => {
  // 1. 如果当前会话已经激活，则不重复加载
  if (chatStore.currentSession?.id === sessionId) {
    return;
  }

  // 2. 加载会话详情（这将更新 store.currentSession 和 store.currentSessionId）
  const success = await chatStore.fetchSessionDetail(sessionId);

  if (!success) {
    // ✅ 4. ElMessage 替换为 toast
    toast.error('加载失败', {
      description: chatStore.error || '加载会话详情失败',
    })
  }

  // 成功后，ChatPanel 组件会自动响应 currentSession 的变化。
}
// ----------------------------------------------------
// addSession 调用 store 中的 createSession
const addSession = async () => {
  if (!isLoggedIn.value) {
    loginModalVisible.value = true; // 弹出登录框提示用户登录
    return
  }

  // 临时标题，后端会使用这个，但最终会被第一条用户消息的内容覆盖
  chatStore.selectedSessionId = null
  chatStore.currentSession = null

  // createSession 成功后，Pinia Store 会自动更新 sessions 列表和 currentSession
  // 组件会自动响应这些变化，无需手动 sessions.value.push(...)
}

// ----------------------------------------------------
// ✅ 5. 重构 deleteSession
// ----------------------------------------------------
// (原 deleteSession)
// 当用户点击子组件的删除按钮时，只打开确认框
const deleteSession = (id: number) => {
  if (!isLoggedIn.value) return;

  // 1. 设置待删除的 ID
  sessionToDelete.value = id;
  // 2. 打开 shadcn/vue 的 AlertDialog
  showDeleteDialog.value = true;
}

// 当用户在 AlertDialog 中点击 "取消"
const handleCancelDelete = () => {
  sessionToDelete.value = null; // 清空ID
  // showDeleteDialog 会由 <AlertDialogCancel> 自动更新为 false
  toast.info('已取消删除');
}

// 当用户在 AlertDialog 中点击 "确定"
const handleConfirmDelete = async () => {
  if (sessionToDelete.value === null) return;

  const id = sessionToDelete.value;
  sessionToDelete.value = null; // 清空ID
  // showDeleteDialog 会由 <AlertDialogAction> 自动更新为 false

  try {
    // 2. 调用 Pinia Store 的 action 进行删除
    const success = await chatStore.deleteSession(id);

    // 3. 根据结果进行反馈 (使用 toast)
    if (success) {
      // ✅ Sonner API (toast.success)
      toast.success('删除成功!');
    } else {
      toast.error('删除失败', {
        description: chatStore.error || '请稍后重试',
      });
    }
  } catch (error) {
    // 捕获请求失败的错误
    toast.error('删除操作失败', {
      description: '网络错误或服务器异常',
    });
  }
}

const toggleMenu = () => {
  if (isLoggedIn.value) {
    menuVisible.value = !menuVisible.value
  } else {
    loginModalVisible.value = !loginModalVisible.value
  }

}

// 组件挂载后，获取会话列表
// ----------------------------------------------------
onMounted(() => {
  // 只有在用户登录后才尝试获取会话
  if (userStore.isLoggedIn) {
    chatStore.fetchSessions();
  }
});
</script>

<style scoped>

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}


</style>