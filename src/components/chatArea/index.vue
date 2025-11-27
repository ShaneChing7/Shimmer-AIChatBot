<template>
  <div class="flex flex-col flex-1 min-w-0 h-full z-0">
    <!-- Header  -->
    <div class="flex border-b border-border h-16 items-center pl-5 flex-none">
      <div class="flex items-center gap-3">
        <div class="size-10 rounded-full bg-primary flex items-center justify-center shimmer-effect glow-effect">
              <ShimmerAvatar class="size-9 text-primary-foreground" />
            </div>
        <div class="min-w-0">
          <h1 class="truncate " >{{ activeConversation?.title || "Shimmer" }}</h1>
          <p class="text-sm text-muted-foreground">{{t('chat.aiDescription')}}</p>
        </div>
      </div>
    </div>

    <div class="flex-1 min-h-0 relative px-2 space-y-1 overflow-hidden">
      <!-- 消息列表 -->
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

      <!-- 输入框区域 -->
      <div 
        class="  absolute left-0 right-0 flex justify-center px-4 transition-all duration-500 ease-in-out"
        :style="{
          bottom: (currentMessages.length > 0 || isExpanded) ? '27px' : '40%'
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
            {{welcomeMessage + userStore.username }}
          </h2>
        </Transition>
        <div
          ref="inputBoxRef"
          class="shadow-2xl flex flex-col justify-center border rounded-3xl bg-background transition-all duration-500 ease-in-out"
          :class="{ 'is-expanded': isExpanded }"
          :style="{
            width: currentMessages.length > 0 ? '920px' : '450px',
            minHeight: '110px',
            height: 'auto'
          }"
        >
          
          <!-- 多文件预览区域  -->
          <transition name="fade-scale">
            <div v-if="selectedFiles.length > 0" class="file-preview px-3 pt-3 pb-0.5 flex gap-2 overflow-x-auto scrollbar-thin">
               <div 
                  v-for="(file, index) in selectedFiles" 
                  :key="index"
                  class="relative group shrink-0 bg-muted/50 rounded-xl p-2 pr-4 flex items-center gap-3 border border-border/50 shadow-sm w-48"
                >
                  <!-- 图片预览 -->
                  <div v-if="file.type.startsWith('image/')" class="relative size-10 rounded-lg overflow-hidden border border-border bg-background">
                    <img :src="getPreviewUrl(file)" class="w-full h-full object-cover" />
                  </div>
                  <!-- 文件图标预览 -->
                  <div v-else class="size-10 flex items-center justify-center bg-background rounded-lg border border-border text-muted-foreground">
                    <FileText class="size-6" />
                  </div>
                  
                  <div class="flex flex-col min-w-0">
                     <span class="text-xs truncate font-medium text-foreground/80 w-full block">{{ file.name }}</span>
                     <span class="text-[10px] text-muted-foreground">{{ formatFileSize(file.size) }}</span>
                  </div>
      
                  <!-- 移除按钮 -->
                  <button 
                    @click.stop="removeFile(index)" 
                    class="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md hover:scale-110 z-10"
                  >
                     <X class="size-3" />
                  </button>
               </div>
            </div>
          </transition>

          <div class="flex-1 min-h-0 flex items-start px-4 pt-4 relative">
            <textarea
              ref="textareaRef"
              v-model="input"
              @keydown="handleKeydown"
              @input="autoGrow"
              :disabled="loading"
              :placeholder="t('chat.inputPlaceholder')"
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
            
            <!-- 绑定点击事件触发文件选择 -->
            <div
              @click="triggerFileInput"
              class="mr-1 size-10 rounded-full hover:bg-muted transition-colors duration-75 flex items-center justify-center shrink-0 cursor-pointer"
              title="上传文件/图片"
            >
              <Plus class="size-6 text-stone-600" />
            </div>

            <!-- 隐藏的文件输入框 -->
            <input 
              type="file" 
              ref="fileInputRef" 
              class="hidden" 
              @change="handleFileSelect" 
              accept="image/*,.pdf,.txt,.md" 
              multiple
            />

            <!-- Model Selector  -->
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
import ShimmerAvatar from './ShimmerAvatar.vue';
import { Send, Plus, ChevronDown, Check, ChevronsLeftRight, ChevronsRightLeft, FileText, X } from 'lucide-vue-next'
import { ref, watch, computed, onUnmounted, nextTick } from 'vue'
import MessageList from './MessageList.vue'
import { toast } from 'vue-sonner';
import { useChatStore } from '@/store/modules/chat';
import useUserStore from '@/store/modules/user';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n'
import { getTimeKey } from '@/utils/time';
import { GET_MODEL, SET_MODEL } from '@/utils/model';

const { t } = useI18n()
const chatStore = useChatStore();
const userStore = useUserStore();
const isLoggedIn = computed(() => userStore.isLoggedIn);

// 绑定状态和 Getter
const activeConversation = computed(() => chatStore.currentSession); 
const currentMessages = computed(() => chatStore.currentMessages);
const { loading } = storeToRefs(chatStore)

//欢迎语句
const welcomeMessage = computed(() => {
  const key = getTimeKey()
  return t(`common.userWelcome.${key}`) + '! '
})

// 消息输入和发送逻辑
const input = ref('')

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const inputBoxRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false);

// 多文件状态
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<File[]>([]);
const previewUrls = ref<Map<string, string>>(new Map()); // 使用 Map 存储临时 URL


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
const initialModel = GET_MODEL();
const defaultModel = 'deepseek-chat';

if (!initialModel) {
  SET_MODEL(defaultModel); // 如果没有存储的模型，将默认模型写入存储
}
const selectedModel = ref(initialModel || defaultModel);

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

// 触发文件选择
const triggerFileInput = () => {
  fileInputRef.value?.click();
};

// 处理多文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    const newFiles = Array.from(target.files);
    // 限制总数量或大小 (可选)
    newFiles.forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
            toast.warning(`文件 ${file.name} 超过 10MB`);
            return;
        }
        selectedFiles.value.push(file);
        // 生成预览 URL
        if (file.type.startsWith('image/')) {
            previewUrls.value.set(file.name, URL.createObjectURL(file));
        }
    });
    // 清空 input 允许重复选择相同文件
    target.value = '';
    nextTick(() => textareaRef.value?.focus());
  }
};

const getPreviewUrl = (file: File) => previewUrls.value.get(file.name) || '';

// 移除单个文件
const removeFile = (index: number) => {
  const file = selectedFiles.value[index];
  if (file && previewUrls.value.has(file.name)) {
    URL.revokeObjectURL(previewUrls.value.get(file.name)!);
    previewUrls.value.delete(file.name);
  }
  selectedFiles.value.splice(index, 1);
};


const clearFiles = () => {
  selectedFiles.value.forEach(f => {
    if (previewUrls.value.has(f.name)) URL.revokeObjectURL(previewUrls.value.get(f.name)!);
  });
  selectedFiles.value = [];
  previewUrls.value.clear();
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
};

// sendMessage 函数
const sendMessage = async () => {
  if (loading.value) {
    toast.warning(t('chat.sessionLoading'));
    return;
  }

  const messageContent = input.value.trim();
  
  if (!isLoggedIn.value) {
    toast.warning(t('chat.needLogin'));
    return;
  }
  
 if (!messageContent && selectedFiles.value.length === 0) return

  if (!chatStore.currentSession?.id) {
    const created = await chatStore.createSession(t("session.newSessionTitle"));
    if (!created) {
      toast.error(chatStore.error || t('chat.createSessionFailed'));
      return;
    }
  }
  
  // 复制当前文件列表进行发送
  const filesToSend = [...selectedFiles.value];
  
  input.value = ''
  clearFiles(); // 发送后清空文件预览
  
  // 发送后重置 textarea 高度
  nextTick(() => {
    autoGrow();
  });

  try {
    // 传递数组
    await chatStore.sendMessage(messageContent, selectedModel.value, filesToSend);
  } catch (error) {
    toast.error(chatStore.error || t('chat.messageSendFailed'));
  }
}


// 选择语言触发的函数
const selectModel = (value: string) => {
  selectedModel.value = value;
  isDropdownOpen.value = false;
  SET_MODEL(value)
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
  // 清理内存
  clearFiles();
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


/* 输入框滚动条样式 */
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

