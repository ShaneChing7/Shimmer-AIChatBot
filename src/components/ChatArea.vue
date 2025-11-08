<template>
  <div class="flex flex-col flex-1 min-w-0 h-full z-0">
    <!-- 顶部标题栏 -->
    <div class="flex border-b border-border h-16 items-center pl-5 flex-none">
      <div class="flex items-center gap-3">
        <div class="size-10 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Sparkles class="size-5 text-primary-foreground" />
        </div>
        <div class="min-w-0">
          <h1 class="truncate">{{ activeConversation?.title || "Shimmer" }}</h1>
          <p class="text-sm text-muted-foreground">你的AI小助手</p>
        </div>
      </div>
    </div>

    <!-- 聊天内容区域 -->
    <div class="flex-1 min-h-0 relative px-2 space-y-1 overflow-hidden">
      <transition name="fade-slide" mode="out-in">
        <!-- 有历史消息 -->
        <div v-if="currentMessages.length > 0" key="chat" class="flex flex-col h-full items-center">
          <!-- 消息列表 -->
          <div class="h-full  pb-32 p-3 pt-0 w-full max-w-[850px] mx-auto">
            <MessageList :messages="currentMessages" />
          </div>
        </div>

        <!-- 没有历史消息时 -->
        <div v-else key="welcome" class="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div class="pb-30 flex flex-col items-center gap-4">
            <div class="size-20 rounded-full bg-primary flex items-center justify-center shimmer-effect glow-effect">
              <Sparkles class="size-10 text-primary-foreground" />
            </div>
            <h2 class="text-xl font-semibold">欢迎使用 Shimmer</h2>
            <p class="text-muted-foreground">
              开始新的对话吧，让我来帮你解决问题！
            </p>
          </div>
        </div>
      </transition>

      <!-- 统一的输入框 - 带动画效果 -->
      <div 
        class="absolute left-0 right-0 flex justify-center px-4 transition-all duration-500 ease-in-out"
        :style="{
          bottom: currentMessages.length > 0 ? '27px' : '31%'
        }"
      >
        <div
          class="shadow-2xl flex flex-col justify-center border rounded-2xl bg-background transition-all duration-500 ease-in-out"
          :style="{
            width: currentMessages.length > 0 ? '800px' : '400px',
            height: '100px',
          }"
        >
          <!-- 输入区域 -->
          <div class="h-1/2 flex items-center px-4">
            <input 
              v-model="input" 
              @keydown.enter="sendMessage" 
              :disabled="loading" 
              placeholder="输入你的问题..."
              class="w-full rounded-lg px-4 py-2 outline-none text-foreground" 
            />
          </div>

          <!-- 控制栏 -->
          <div class="flex flex-1 w-full items-center px-4">
            
            <div
              class="mr-1 size-10 rounded-full hover:bg-muted transition-colors duration-75 flex items-center justify-center shrink-0">
              <Plus class="size-6 text-stone-600" />
            </div>

            <div class="relative">
              <!-- 选择框 -->
              <div 
                class="cursor-pointer rounded-2xl  px-2 py-2 h-3/5 bg-gray-50 dark:bg-gray-700 
                dark:border-gray-600 border-gray-300 hover:bg-muted flex items-center justify-between
                transition-all duration-200 text-sm" 
                :class="{ 'text-gray-400': isDropdownOpen }"
                @click="isDropdownOpen = !isDropdownOpen" 
                @mousedown.stop
              >
                <span class="ml-1">{{ selectedModelLabel }}</span>
                <ChevronDown class="size-4 transition-transform ml-1" :class="{ 'rotate-180': isDropdownOpen }" />
              </div>

              <!-- 下拉菜单 -->
              <transition name="dropdown-fade-slide">
                <div 
                  v-if="isDropdownOpen" 
                  ref="dropdownRef" 
                  class="absolute bottom-full mb-2 left-[-6px] z-10 w-35  rounded-lg shadow-lg 
                  bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                >
                  <div 
                    v-for="model in modelOptions" 
                    :key="model.value"
                    class="flex justify-between whitespace-nowrap items-center px-3 py-2 cursor-pointer transition-colors duration-150 rounded-lg mx-1 my-1"
                    :class="{
                      'bg-muted dark:text-blue-100 font-semibold': selectedModel === model.value,
                      'hover:bg-gray-100 dark:hover:bg-gray-600': selectedModel !== model.value
                    }" 
                    @click="selectModel(model.value)"
                  >
                    {{ model.label }}
                    <div v-if="selectedModel == model.value">
                      <Check :size="20"></Check>
                    </div>
                  </div>
                </div>
              </transition>
            </div>

            <div class="flex-1" style="min-width: 0"></div>
            <div
              class="flex items-center justify-center rounded-full hover:bg-muted transition-colors duration-75 cursor-pointer "
              style="width: 40px; height: 40px;"
              @click="!loading && sendMessage()"
              :class="loading ? 'opacity-50 pointer-events-none' : ''"
            >
              <Send class="size-6 text-gray-500"  />
            </div>

          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { Sparkles, Send, Plus, ChevronDown, Check } from 'lucide-vue-next'
import { ref, watch, computed, onUnmounted } from 'vue'
import MessageList from './MessageList.vue'
import { toast } from 'vue-sonner';
import { useChatStore } from '@/store/modules/chat';
import useUserStore from '@/store/modules/user';
import { storeToRefs } from 'pinia';


const chatStore = useChatStore();
const userStore = useUserStore();
const isLoggedIn = computed(() => userStore.isLoggedIn);

// 绑定状态和 Getter
const activeConversation = computed(() => chatStore.currentSession); 
const currentMessages = computed(() => chatStore.currentMessages);
const {loading} = storeToRefs(chatStore)


// 消息输入和发送逻辑
const input = ref('')


// 语言选项数据
const modelOptions = [
  { value: 'deepseek-chat', label: 'Chat' },
  { value: 'deepseek-reasoner', label: 'Reasoner' },
];
// 下拉框状态
const selectedModel = ref('deepseek-chat');
const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
// 选择框中的文字
const selectedModelLabel = computed(() =>
  modelOptions.find(opt => opt.value === selectedModel.value)?.label
);

const sendMessage = async () => {
  if (loading.value) {
    toast.warning('会话数据正在加载中，请稍候再发送。');
    return;
  }

  const messageContent = input.value.trim();
  
  if (!isLoggedIn.value) {
    toast.warning('请先登录或注册才能发送消息！');
    return;
  }
  
  if (!messageContent) return

  if (!chatStore.currentSession?.id) {
    const created = await chatStore.createSession('新会话标题');
    if (!created) {
      toast.error(chatStore.error || '创建会话失败，请稍候重试。');
      return;
    }
  }
  
  input.value = ''

  try {
    await chatStore.sendMessage(messageContent,selectedModel.value);
  } catch (error) {
    toast.error(chatStore.error || '消息发送失败，请检查网络。');
  }
}


// 选择语言触发的函数
const selectModel = (value: string) => {
  selectedModel.value = value;
  isDropdownOpen.value = false;
  console.log('选择的语言:', value);
};

// 处理外部点击关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
};

watch(isDropdownOpen, (isOpen) => {
  if (isOpen) {
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
  } else {
    document.removeEventListener('mousedown', handleClickOutside);
  }
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 下拉菜单动画 */
.dropdown-fade-slide-enter-active,
.dropdown-fade-slide-leave-active {
  transition: all 0.2s ease;
}

.dropdown-fade-slide-enter-from,
.dropdown-fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 新增：Shimmer 闪光效果 */
.shimmer-effect {
  position: relative;
  overflow: hidden;
}

.shimmer-effect::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

/* 或者使用脉冲效果 */
.pulse-effect {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* 或者使用光晕效果 */
.glow-effect {
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(59, 130, 246, 0.5),
                0 0 10px rgba(59, 130, 246, 0.3),
                0 0 15px rgba(59, 130, 246, 0.2);
  }
  50% {
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.8),
                0 0 20px rgba(59, 130, 246, 0.6),
                0 0 30px rgba(59, 130, 246, 0.4);
  }
}
</style>