<template>
  <div class="flex flex-col flex-1 min-w-0 h-full z-0">
    <div class="flex border-b border-border h-16 items-center pl-5 flex-none">
      <div class="flex items-center gap-3">
        <div class="size-10 rounded-full bg-primary flex items-center justify-center shimmer-effect glow-effect">
              <Sparkles class="size-5 text-primary-foreground" />
            </div>
        <div class="min-w-0">
          <h1 class="truncate">{{ activeConversation?.title || "Shimmer" }}</h1>
          <p class="text-sm text-muted-foreground">你的AI小助手</p>
        </div>
      </div>
    </div>

    <div class="flex-1 min-h-0 relative px-2 space-y-1 overflow-hidden">
      <transition name="fade-slide" mode="out-in">
        <div v-if="currentMessages.length > 0" key="chat" class="flex flex-col h-full items-center">
          <div class="h-full  pb-32 p-3 pt-0 w-full max-w-[1000px] mx-auto"
            :class="{
              'pb-103': isExpanded,
              'pb-37': !isExpanded && lineCount === 2,
              'pb-43': !isExpanded && lineCount === 3,
              'pb-49': !isExpanded && lineCount === 4,
              'pb-51': !isExpanded && lineCount > 4
            }"
          >
            <MessageList :messages="currentMessages" />
          </div>
        </div>

        <div v-else key="welcome" >
          
        </div>
      </transition>

      <div 
        class="  absolute left-0 right-0 flex justify-center px-4 transition-all duration-500 ease-in-out"
        :style="{
          bottom: (currentMessages.length > 0 || isExpanded) ? '27px' : '31%'
        }">
        <Transition
          enter-active-class="transition-opacity duration-300"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-200"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <h2 v-show="!currentMessages.length" class="absolute top-[-50px] text-3xl font-semibold">
            你好！ {{ userStore.username }}
          </h2>
        </Transition>
        <div
          ref="inputBoxRef"
          class="shadow-2xl flex flex-col justify-center border rounded-3xl bg-background transition-all duration-500 ease-in-out"
          :class="{ 'is-expanded': isExpanded }"
          :style="{
            width: currentMessages.length > 0 ? '920px' : '400px',
            minHeight: '110px',
            height: 'auto'
          }"
        >
          <div class="flex-1 min-h-0 flex items-start px-4 pt-4 relative">
            <textarea
              ref="textareaRef"
              v-model="input"
              @keydown="handleKeydown"
              @input="autoGrow"
              :disabled="loading"
              placeholder="输入你的问题... (Shift+Enter 换行)"
              class="textarea-content w-full rounded-lg px-4 py-2 outline-none text-foreground bg-transparent resize-none transition-all duration-300"
              rows="1"
              style="max-height: 120px; overflow-y: auto; padding-right: 40px;"
            ></textarea>
            
            <!-- 展开按钮：当行数 >= 4 时显示 -->
            <transition name="fade-scale">
              <div
                v-if="lineCount >= 4 || isExpanded"
                @click="toggleExpand"
                class="flex items-center justify-center absolute top-3 right-4 p-1 w-[40px] h-[40px] rounded-full hover:bg-muted text-gray-500 cursor-pointer transition-colors duration-200"
              >
                <component :is="isExpanded ? ChevronsRightLeft : ChevronsLeftRight" class="size-5 rotate-135" />
              </div>
            </transition>
          </div>

          <div class="flex h-[55px] w-full items-center px-4 shrink-0">
            
            <div
              class="mr-1 size-10 rounded-full hover:bg-muted transition-colors duration-75 flex items-center justify-center shrink-0">
              <Plus class="size-6 text-stone-600" />
            </div>

            <div class="relative">
              <div 
                class="cursor-pointer rounded-2xl px-2 py-2 h-3/5 bg-gray-50 dark:bg-gray-700 
                dark:border-gray-600 border-gray-300 hover:bg-muted flex items-center justify-between
                transition-all duration-200 text-sm" 
                :class="{ 'text-gray-400': isDropdownOpen }"
                @click="isDropdownOpen = !isDropdownOpen" 
                @mousedown.stop
              >
                <span class="ml-1">{{ selectedModelLabel }}</span>
                <ChevronDown class="size-4 transition-transform ml-1" :class="{ 'rotate-180': isDropdownOpen }" />
              </div>

              <transition name="dropdown-fade-slide">
                <div 
                  v-if="isDropdownOpen" 
                  ref="dropdownRef" 
                  class="absolute bottom-full mb-2 left-[-6px] z-10 w-35 rounded-lg shadow-lg 
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
              class="flex items-center justify-center rounded-full hover:bg-muted transition-colors duration-75 cursor-pointer"
              style="width: 40px; height: 40px;"
              @click="!loading && sendMessage()"
              :class="loading ? 'opacity-50 pointer-events-none' : ''"
            >
              <Send class="size-6 text-gray-500" />
            </div>

          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { Sparkles, Send, Plus, ChevronDown, Check, ChevronsLeftRight, ChevronsRightLeft } from 'lucide-vue-next'
import { ref, watch, computed, onUnmounted, nextTick } from 'vue'
import MessageList from '@/components/MessageList.vue'
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
const { loading } = storeToRefs(chatStore)


// 消息输入和发送逻辑
const input = ref('')

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const inputBoxRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false);

// 计算行数
const lineCount = computed(() => {
  if (!input.value) return 1;
  return input.value.split('\n').length;
});

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

// Textarea 自动增高（添加过渡动画）
const autoGrow = () => {
  // 如果是展开状态，CSS 会处理高度，JS 不需要介入
  if (isExpanded.value) return;

  const el = textareaRef.value;
  if (el) {
    el.style.height = 'auto'; // 重置高度以获取正确的 scrollHeight
    el.style.height = `${el.scrollHeight}px`;
  }
};

// 处理按键事件 (Enter 发送, Shift+Enter 换行)
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

// sendMessage 函数
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
  
  // 发送后重置 textarea 高度
  nextTick(() => {
    autoGrow();
  });

  try {
    await chatStore.sendMessage(messageContent, selectedModel.value);
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

// 展开/收起逻辑（添加过渡动画时间）
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
  
  nextTick(() => {
    const el = textareaRef.value;
    if (!el) return;

    if (isExpanded.value) {
      // 展开时：清除 JS 设置的内联 height，让 CSS 的 height: 100% 生效
      el.style.height = ''; 
    } else {
      // 收起时：立即运行 autoGrow，根据内容设置高度
      autoGrow();
    }
  });
};

// 在组件卸载时移除监听器
onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 展开按钮的淡入淡出和缩放动画 */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.8);
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

/* Shimmer 闪光效果 */
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

/* 光晕效果 */
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

.textarea-content::-webkit-scrollbar {
  width: 5px;
}

.textarea-content::-webkit-scrollbar-thumb {
  background: #e5e5e5;
  border-radius: 3px;
  transition: background 0.2s;
}

.textarea-content::-webkit-scrollbar-thumb:hover {
  background: #dcdcdc;
  pointer-events: none;
}

/* 展开状态样式 */
.is-expanded {
  height: 400px !important; 
  z-index: 50; 
}

.is-expanded textarea {
  max-height: none !important; 
  height: 100% !important;
  flex-grow: 1;
}
</style>