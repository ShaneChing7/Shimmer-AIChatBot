<template>
  <div
    class=" mt-0.5 w-55 group relative flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors select-none"
    
    :class="props.isActive // ✅ 核心状态逻辑
      ? [ 
          // 状态 1: 选中 (Active) 时的样式
          'bg-stone-200 text-sidebar-accent-foreground',
          // 选中状态下，鼠标悬停时保持相同背景，或略微加深
          
        ]
      : [ 
          // 状态 2: 未选中 (Inactive) 时的样式
          'text-sidebar-foreground',
          // 未选中状态下，鼠标悬停时的样式
          'hover:bg-stone-100 dark:hover:bg-sidebar-accent/20' // 使用更柔和的主题色悬停效果
        ]"
    
    @click="selectSession" 
  >
    <MessageSquareText class="size-4 shrink-0" />

    <div class="flex-1 min-w-0">
      <p class="truncate text-sm">{{ props.session.title }}</p>
      <p class="text-xs text-muted-foreground">
        {{ formatSessionTime(props.session.created_at) }}
      </p>
    </div>

    <div 
      class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 ml-auto"
      @click.stop
    >
      <div
        class="size-6 shrink-0 flex items-center justify-center rounded-md hover:bg-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
        @click="handleUpdate"
      >
        <Pencil class="size-3" />
      </div>

      <div
        class="size-6 shrink-0 flex items-center justify-center rounded-md hover:bg-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
        @click="handleDelete"
      >
        <Trash2 class="size-3" />
      </div>
    </div>
  </div>
  
  <EditTitleModal
    :session="props.session"
    v-model:open="titleModalVisible"
  />
</template>


<script setup lang="ts">
import { defineProps, defineEmits,ref } from 'vue';
import { MessageSquareText , Trash2, Pencil  } from 'lucide-vue-next'
import { formatSessionTime } from '@/utils/time';
import type { ChatSession } from '@/api/chat/type';
import EditTitleModal from './EditTitleModal.vue';

let titleModalVisible = ref<boolean>(false)
const props = defineProps<{
   session: ChatSession;
   isActive: boolean; // 用于高亮当前选中的会话
}>();

// ✅ 核心修改：添加 'select-session' 事件
const emit = defineEmits<{
    (e: 'delete', id: number): void;
    (e: 'select-session', id: number): void; // 新增事件
}>();


/**
 *   处理点击整个会话 item
 */
const selectSession = () => {
    // 触发父组件的 select-session 事件，并传递当前会话 ID
    emit('select-session', props.session.id);
}


/**
 *   处理点击删除按钮 (需要阻止事件冒泡，防止触发 selectSession)
 */
const handleDelete = () => {
    emit('delete', props.session.id);
}
const handleUpdate = () => {
    titleModalVisible.value = true
}


</script>

<style scoped>
/* 确保 Session 组件也禁用文本选择 */
.select-none {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>