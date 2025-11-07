<template>
  <div class="transition-all duration-200 h-screen border-r border-border bg-sidebar flex flex-col overflow-y-hidden overflow-x-hidden"
    :class="{'w-60': isExpanded, 'w-16': !isExpanded}">

    <div class="border-b border-sidebar-border pl-3.5 flex items-center justify-between gap-2 h-16 flex-none">
      <CollapseButton @toggle-sidebar="toggleSidebar" class="mr-3" />
    </div>

    <!-- addSession -->
    <div class="p-2 flex items-center justify-center h-16 flex-none">
      <div @click="addSession" :class="[
        'hover:bg-muted border rounded-md py-2 w-full bg-white flex items-center dark:bg-gray-500',
        !isLoggedIn ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      ]">
        <div class="pl-[11px]">
          <SquarePen />
        </div>
        <div class="pl-2 text-black dark:text-white whitespace-nowrap select-none ">
          <span v-show="isExpanded">开启新对话</span>
        </div>
      </div>
    </div>

    <!-- ✅ 自定义虚拟滚动列表 -->
    <div class="pl-2 flex-1 overflow-hidden relative">
      <!-- 顶部遮罩 -->
      <div v-show="showTopShadow && isExpanded" 
        class="pointer-events-none absolute top-0 left-0 right-0 h-8 z-10
        bg-gradient-to-b from-background/95 to-transparent transition-opacity duration-300">
      </div>

      <!-- 虚拟滚动容器 -->
      <div
        v-if="isExpanded && sessions.length > 0"
        ref="scrollContainer"
        class="h-full overflow-y-auto overflow-x-hidden"
        @scroll="handleScroll"
      >
        <!-- 顶部占位 -->
        <div :style="{ height: `${offsetTop}px` }"></div>
        
        <!-- 可见项目 -->
        <Session
          v-for="session in visibleSessions"
          :key="session.id"
          :session="session"
          @delete="deleteSession"
          @select-session="selectSession"
          :is-active="session.id === chatStore.currentSession?.id"
        />
        
        <!-- 底部占位 -->
        <div :style="{ height: `${offsetBottom}px` }"></div>
      </div>

      <!-- 空状态提示 -->
      <div v-else-if="isExpanded && sessions.length === 0" 
        class="h-full flex items-center justify-center text-sm text-muted-foreground">
        暂无会话
      </div>

      <!-- 底部遮罩 -->
      <div v-show="showBottomShadow && isExpanded" 
        class="pointer-events-none absolute bottom-0 left-0 right-0 h-8 z-10
        bg-gradient-to-t from-background/95 to-transparent transition-opacity duration-300">
      </div>
    </div>

    <!-- UserSetting -->
    <div class="p-2 mr-0.5 flex-none h-16 select-none " @click.stop="toggleMenu">
      <div class="flex items-center justify-between rounded-[20px] px-2 py-2 hover:bg-muted cursor-pointer">
        <div class="whitespace-nowrap flex items-center space-x-3">
          <Avatar class="w-8 h-8">
            <AvatarImage :src="userStore.avatar" alt="@unovue" />
            <AvatarFallback>{{ userStore.username[0] }}</AvatarFallback>
          </Avatar>
          <span v-show="isExpanded" class="text-sm text-sidebar-foreground font-medium">
            {{isLoggedIn ? userStore.username : '请先登录/注册'}}
          </span>
        </div>
        <div v-show="isExpanded" class="relative rounded-md">
          <div class="p-1 rounded-md ">
            <Ellipsis class="size-3.5 text-sidebar-foreground" />
          </div>
        </div>
      </div>
    </div>

    <!-- 底部用户菜单 -->
    <div class="flex-none">
      <UserMenu v-model:visible="menuVisible" @open-settings="settingModalVisible = true"></UserMenu>
    </div>

    <!-- 系统设置模态框 -->
    <SettingsModal v-model:visible="settingModalVisible" />

    <!-- 登录注册模态框 -->
    <LoginModal v-model:visible="loginModalVisible"/>

    <!-- 删除确认对话框 -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>警告:确认删除?</AlertDialogTitle>
          <AlertDialogDescription>
            此操作将永久删除该会话及其所有消息,是否继续?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel class="cursor-pointer" @click="handleCancelDelete">取消</AlertDialogCancel>
          <AlertDialogAction @click="handleConfirmDelete"
            class="border !bg-black cursor-pointer">确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ref, computed, onMounted, watch, nextTick } from 'vue';

import Session from './Session.vue';
import CollapseButton from './CollapseButton.vue';
import UserMenu from './UserMenu.vue';
import SettingsModal from './SettingsModal.vue';
import LoginModal from './LoginModal.vue';
import { Ellipsis, SquarePen } from "lucide-vue-next";
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

import useUserStore from '@/store/modules/user';
const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)

import { useChatStore } from '@/store/modules/chat';
const chatStore = useChatStore();

const sessions = computed(() => chatStore.sessions || []);
const menuVisible = ref(false);
const settingModalVisible = ref(false);
const showTopShadow = ref(false)
const showBottomShadow = ref(false)
const loginModalVisible = ref(false)
const sessionToDelete = ref<number | null>(null);
const showDeleteDialog = ref(false);
const isExpanded = ref(true);

// ✅ 虚拟滚动相关状态
const scrollContainer = ref<HTMLElement | null>(null);
const ITEM_HEIGHT = 54; // 每个 Session 的高度
const BUFFER_SIZE = 3;  // 上下缓冲项数

const scrollTop = ref(0);
const containerHeight = ref(0);
// ✅ 新增: 保存折叠前的滚动位置
const savedScrollTop = ref(0);

// 计算可见范围
const visibleRange = computed(() => {
  const start = Math.max(0, Math.floor(scrollTop.value / ITEM_HEIGHT) - BUFFER_SIZE);
  const visibleCount = Math.ceil(containerHeight.value / ITEM_HEIGHT) + BUFFER_SIZE * 2;
  const end = Math.min(sessions.value.length, start + visibleCount);
  
  return { start, end };
});

// 可见的 sessions
const visibleSessions = computed(() => {
  const { start, end } = visibleRange.value;
  return sessions.value.slice(start, end);
});

// 顶部偏移量
const offsetTop = computed(() => {
  return visibleRange.value.start * ITEM_HEIGHT;
});

// 底部偏移量
const offsetBottom = computed(() => {
  return (sessions.value.length - visibleRange.value.end) * ITEM_HEIGHT;
});

// ✅ 新增: 滚动到指定 Session
const scrollToSession = (sessionId: number) => {
  const index = sessions.value.findIndex(s => s.id === sessionId);
  if (index === -1 || !scrollContainer.value) return;
  
  // 计算目标位置 (让选中项居中显示)
  const targetScrollTop = Math.max(0, index * ITEM_HEIGHT - containerHeight.value / 2 + ITEM_HEIGHT / 2);
  
  scrollContainer.value.scrollTop = targetScrollTop;
  scrollTop.value = targetScrollTop;
}

// ✅ 新增: 恢复滚动位置
const restoreScrollPosition = () => {
  if (!scrollContainer.value) return;
  
  // 优先滚动到选中的 Session
  if (chatStore.currentSession?.id) {
    scrollToSession(chatStore.currentSession.id);
  } else if (savedScrollTop.value > 0) {
    // 否则恢复折叠前的位置
    scrollContainer.value.scrollTop = savedScrollTop.value;
    scrollTop.value = savedScrollTop.value;
  } else {
    // 都没有则回到顶部
    scrollContainer.value.scrollTop = 0;
    scrollTop.value = 0;
  }
}

const toggleSidebar = (value: boolean) => {
  // ✅ 折叠前保存滚动位置
  if (!value && scrollContainer.value) {
    savedScrollTop.value = scrollContainer.value.scrollTop;
  }
  
  isExpanded.value = value;
};

// ✅ 处理滚动事件
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target) return;

  scrollTop.value = target.scrollTop;
  const { scrollHeight, clientHeight } = target;
  
  // 更新容器高度
  if (containerHeight.value !== clientHeight) {
    containerHeight.value = clientHeight;
  }

  // 更新阴影显示
  showTopShadow.value = scrollTop.value > 10;
  showBottomShadow.value = scrollTop.value + clientHeight < scrollHeight - 10;
}

// ✅ 监听展开状态,恢复滚动位置
watch([isExpanded, scrollContainer], async ([expanded, container]) => {
  if (expanded && container) {
    await nextTick();
    
    // 初始化容器高度
    containerHeight.value = container.clientHeight;
    
    // 🎯 关键: 恢复滚动位置
    await nextTick(); // 再等一次,确保 DOM 完全渲染
    restoreScrollPosition();
    
    // 手动触发一次阴影计算
    const { scrollHeight, clientHeight } = container;
    showTopShadow.value = scrollTop.value > 10;
    showBottomShadow.value = scrollTop.value + clientHeight < scrollHeight - 10;
  }
}, { immediate: true });

// ✅ 监听当前选中的 Session 变化,自动滚动
watch(() => chatStore.currentSession?.id, async (newSessionId, oldSessionId) => {
  // 只在选中不同 Session 且 sidebar 展开时才滚动
  if (newSessionId && newSessionId !== oldSessionId && isExpanded.value && scrollContainer.value) {
    await nextTick();
    scrollToSession(newSessionId);
  }
});

// ✅ 监听 sessions 数据加载
watch(() => sessions.value.length, async (newLength) => {
  if (newLength > 0 && isExpanded.value && scrollContainer.value) {
    await nextTick();
    containerHeight.value = scrollContainer.value.clientHeight;
    
    // 数据加载后,恢复位置
    if (scrollTop.value === 0 && (savedScrollTop.value > 0 || chatStore.currentSession?.id)) {
      restoreScrollPosition();
    }
  }
});

const selectSession = async (sessionId: number) => {
  if (chatStore.currentSession?.id === sessionId) {
    return;
  }

  const success = await chatStore.fetchSessionDetail(sessionId);

  if (!success) {
    toast.error('加载失败', {
      description: chatStore.error || '加载会话详情失败',
    })
  }
  // 注意: 滚动由 watch(currentSession) 自动处理
}

const addSession = async () => {
  if (!isLoggedIn.value) {
    loginModalVisible.value = true;
    return
  }

  chatStore.selectedSessionId = null
  chatStore.currentSession = null
}

const deleteSession = (id: number) => {
  if (!isLoggedIn.value) return;
  sessionToDelete.value = id;
  showDeleteDialog.value = true;
}

const handleCancelDelete = () => {
  sessionToDelete.value = null;
  toast.info('已取消删除');
}

const handleConfirmDelete = async () => {
  if (sessionToDelete.value === null) return;

  const id = sessionToDelete.value;
  sessionToDelete.value = null;

  try {
    const success = await chatStore.deleteSession(id);

    if (success) {
      toast.success('删除成功!');
    } else {
      toast.error('删除失败', {
        description: chatStore.error || '请稍后重试',
      });
    }
  } catch (error) {
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

onMounted(() => {
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

/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 深色模式滚动条 */
.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* ✅ 平滑滚动 */
.overflow-y-auto {
  scroll-behavior: smooth;
}

.select-none {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>