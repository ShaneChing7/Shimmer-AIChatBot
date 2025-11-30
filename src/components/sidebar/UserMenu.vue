<template>
  <transition name="fade-up">
    <div
      v-if="visible"
      class="fixed bottom-20 left-4 w-50 flex flex-col justify-center items-center bg-popover border border-border rounded-lg shadow-lg z-50 py-1 user-menu"
      @click.stop
    >
      <!-- 系统设置 -->
      <div @click="$emit('update:visible',false);$emit('open-settings');" class="flex w-48 mb-1 h-10 items-center rounded-lg hover:bg-muted cursor-pointer px-2 space-x-2 dark:hover:bg-gray-500">
        <Settings class="size-5 text-sidebar-foreground" />
        <span class="w-full text-left px-1 py-2 text-md text-black dark:text-gray-50">{{t("menu.systemSetting")}}</span>
      </div>

      <!-- 联系我们 (已修改) -->
      <div @click="$emit('update:visible',false);$emit('open-contact');" class="flex w-48 mb-1 h-10 items-center rounded-lg hover:bg-muted cursor-pointer px-2 space-x-2 dark:hover:bg-gray-500">
        <MessageSquare class="size-5 text-sidebar-foreground" />
        <span class="w-full text-left px-1 py-2 text-md text-black dark:text-gray-50">{{t("menu.contactUs")}}</span>
      </div>

      <!-- 退出登录 -->
      <div @click="logOut" class="flex w-48 h-10 items-center rounded-lg hover:bg-muted cursor-pointer px-2 space-x-2 dark:hover:bg-gray-500">
        <LogOut class="size-5 text-red-500" />
        <span class="w-full text-left px-1 py-2 text-md text-red-500">{{t("menu.logOut")}}</span>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {  onMounted, onBeforeUnmount } from 'vue';
import { Settings, MessageSquare, LogOut } from 'lucide-vue-next';
import useUserStore from '@/store/modules/user';
import { useChatStore } from '@/store/modules/chat';

const { t } = useI18n()
const userstore = useUserStore()
const chatStore = useChatStore()
const props = defineProps<{
  visible: boolean
}>();

// 定义新增的 emit
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'open-settings'): void
  (e: 'open-contact'): void // 新增
}>();

// 点击外部关闭菜单
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.user-menu') && props.visible) {
    emit('update:visible', false);
  }
};

const logOut = () => {
  userstore.userLogout()
  userstore.$reset()
  chatStore.$reset()
  emit('update:visible',false);
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(5px);
}
</style>