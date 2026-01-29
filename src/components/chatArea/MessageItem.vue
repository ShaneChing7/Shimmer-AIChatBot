<template>
  <div class="flex w-full mb-4 px-4 mt-2.5" :class="message.sender === 'user' ? 'justify-end' : 'justify-start'">
    <!--  AI 消息  -->
    <div v-if="message.sender === 'ai'" class="flex items-start max-w-[70%] gap-3">
      <div class="flex flex-col w-full">
        <div class="bg-white-200 text-gray-900 dark:text-white dark:bg-muted rounded-2xl rounded-bl-sm px-4 py-2 text-sm leading-relaxed shadow-lg">
          
          <div v-if="isCompletelyEmpty" class="flex items-center gap-2 py-1">
            <div class="flex gap-1">
              <div class="typing-cursor">
                <span>{{t('chat.aiTyping')}}</span>
                <div class="cursor"></div>
              </div>
            </div>
          </div>
          
          <div v-else class="w-full">
            <!-- 推理过程 -->
            <div v-if="hasReasoningContent" class="reasoning-section mb-3">
              <div 
                class="reasoning-header flex items-center gap-2 p-2 bg-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg cursor-pointer  dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-200"
                @click="toggleReasoning"
              >
                <Atom class="w-4 h-4 text-gray-500" />
                <div class="flex items-center gap-2 flex-1">
                  <span class="text-xs font-semibold text-black dark:text-blue-400">{{t('chat.thinkingProcess')}}</span>
                  <div v-if="isReasoningStreaming" class="flex items-center gap-1">
                    <div class="flex gap-0.5">
                      <span class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                      <span class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                      <span class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                    </div>
                    <span class="text-xs text-gray-400 font-medium">{{t('chat.reasoning')}}</span>
                  </div>
                  <span v-else class="text-xs text-gray-500 dark:text-gray-400">({{ reasoningCharCount }} {{t('common.word')}})</span>
                </div>
                <ChevronRight class="w-4 h-4 text-gray-500 transition-transform duration-400" :class="{ 'rotate-90 ': isReasoningExpanded }" />
              </div>
              
              <div v-show="isReasoningExpanded" class="reasoning-content mt-2 p-3 bg-white dark:from-gray-800 dark:to-gray-750 rounded-lg relative overflow-hidden">
                <div class="text-xs text-gray-500 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {{ message.reasoning_content }}
                  <span v-if="isReasoningStreaming" class="inline-block w-1.5 h-3.5 bg-blue-500 ml-0.5 animate-pulse"></span>
                </div>
              </div>
            </div>
            
            <!-- 回答内容 -->
            <div class="answer-content">
              <div v-if="hasAnswerContent" class="rendered-content m-1" :class="{ 'streaming-content': isAnswerStreaming }">
                <Response>{{ message.content }}</Response>
                <span v-if="isAnswerStreaming" class="inline-block w-1.5 h-3.5 bg-gray-600 dark:bg-gray-300 ml-0.5 animate-pulse"></span>
              </div>
              <div v-else-if="hasReasoningContent && !hasAnswerContent" class="m-1 py-2">
                <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <div class="flex gap-1">
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                  </div>
                  <span class="text-xs">{{t('chat.generatingAnswer')}}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 操作栏 -->
        <div class="text-xs text-gray-400 mt-2 ml-2 flex">
          <Transition name="fade">
            <div v-if="!isStreaming" class="mt-1">
              {{ formatSessionTime(message.created_at || new Date().toISOString()) }}
            </div>
          </Transition>
          <div class="flex-1"></div>
            <!--  修复 Issue 3: 仅当是最后一条 AI 消息 且 未在生成 且 状态不是 completed 时才显示继续 -->
            <TransitionGroup 
            name="fade" 
            tag="div" 
            class="flex gap-x-3 mr-2"
            >
            <div
              v-if="isLastAiMessage && !isStreaming && message.status !== 'completed'"
              :key="'play'"
              class="flex items-center"
            >
              <Tooltip>
                <TooltipTrigger as-child>
                  <div class="flex justify-center items-center rounded-2xl h-6 w-6 hover:bg-gray-200 cursor-pointer" @click="handleAction('continue')">
                    <Play :size="16" class="fill-current"></Play>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" class="bg-black text-white px-2 py-1 rounded-md [&_svg]:hidden!"><p>{{t('chat.continue')}}</p></TooltipContent>
              </Tooltip>
            </div>

            <div v-if="!isStreaming" :key="'share'" class="flex items-center">
              <Tooltip>
                <TooltipTrigger as-child>
                  <div class="flex justify-center items-center rounded-2xl h-6 w-6 hover:bg-gray-200 cursor-pointer" @click="handleAction('share')">
                    <MessageSquareShare :size="16"></MessageSquareShare>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" class="bg-black text-white px-2 py-1 rounded-md [&_svg]:hidden!"><p>{{t('chat.share')}}</p></TooltipContent>
              </Tooltip>
            </div>

            <div v-if="!isStreaming" :key="'retry'" class="flex items-center">
              <Tooltip>
                <TooltipTrigger as-child>
                  <div class="flex justify-center items-center rounded-2xl h-6 w-6 hover:bg-gray-200 cursor-pointer" @click="handleAction('retry')">
                    <RotateCw :size="16"></RotateCw>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" class="bg-black text-white px-2 py-1 rounded-md [&_svg]:hidden!"><p>{{t('chat.retry')}}</p></TooltipContent>
              </Tooltip>
            </div>

            <div v-if="!isStreaming" :key="'copy'" class="flex items-center">
              <Tooltip>
                <TooltipTrigger as-child>
                  <div class="flex justify-center items-center rounded-2xl h-6 w-6 hover:bg-gray-200 cursor-pointer" @click="handleAction('copy')">
                    <Transition name="icon-fade" mode="out-in">
                        <component :is="copySuccess ? Check : Copy" :size="16" :key="copySuccess ? 'check-icon' : 'copy-icon'" ></component>
                    </Transition>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" class="bg-black text-white px-2 py-1 rounded-md [&_svg]:hidden!"><p>{{ copySuccess ? t('chat.copied') : t('chat.copy') }}</p></TooltipContent>
              </Tooltip>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>

    <!-- ----------------------------------------------------------------------- -->
    <!--  User 消息  -->
    <!-- ----------------------------------------------------------------------- -->
    <div v-else class="flex items-start max-w-[70%] gap-3 flex-row-reverse">
      <Avatar class="w-10 h-10 shrink-0">
        <AvatarImage :src="userStore.avatar" alt="@user" />
        <AvatarFallback>{{ userStore.username[0] }}</AvatarFallback>
      </Avatar>
      
      <div class="flex flex-col items-end gap-2">
        
        <!-- 多文件网格容器 (如果有多个文件) -->
        <div v-if="allFiles.length > 0" class="flex flex-wrap justify-end gap-2 max-w-full">
           <div 
             v-for="(file, index) in allFiles"
             :key="index"
             @click.stop="handlePreview(file.file_url,file)"
             class="group flex items-center gap-3 p-3 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-all shadow-sm"
             style="width: fit-content;"
           >
            <!-- 图标/缩略图区域 -->
            <div class="relative shrink-0 size-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center border border-gray-200 dark:border-gray-700">
              <img 
                v-if="isImage(file)" 
                :src="file.file_url" 
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <FileText v-else class="size-6 text-gray-500 dark:text-gray-400" />
            </div>

            <!-- 文件名区域 (如果有 id 为负数，说明是本地预览，可能没有 name，需要 fallback) -->
            <div class="flex flex-col min-w-[100px] max-w-[200px] overflow-hidden">
              <span class="truncate font-medium text-sm text-gray-900 dark:text-gray-100">
                {{ getFileName(file) }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                {{ isImage(file) ? t('common.image') : t('common.file') }}
              </span>
            </div>
           </div>
        </div>

        <!-- 独立文本气泡 -->
        <div 
          v-if="message.content" 
          class="bg-black text-white dark:bg-gray-500 rounded-2xl rounded-br-sm px-4 py-2 text-sm leading-relaxed shadow-sm"
        >
          <div v-html="message.content" class="rendered-content"></div>
        </div>
        
        <div class="text-xs text-gray-400 mr-2">
          {{ formatSessionTime(message.created_at || new Date().toISOString()) }}
        </div>
      </div>
    </div>

    <!-- 全屏预览模态框 -->
    <Teleport to="body">
      <Transition name="fade">
        <div 
          v-if="previewImage" 
          class="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          @click="closePreview"
        >
          <div class="relative max-w-full max-h-full flex items-center justify-center" @click.stop>
            <img 
              :src="previewImage" 
              class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-zoom-in" 
            />
            <button 
              class="absolute -top-12 right-0 text-white/70 hover:text-white p-2 transition-colors rounded-full hover:bg-white/10"
              @click="closePreview"
            >
              <X class="size-8" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { defineProps, computed, ref } from 'vue'
import useUserStore from '@/store/modules/user'
import { formatSessionTime } from '@/utils/time'
import type { ChatMessage,MessageFile } from '@/api/chat/type'
import { Copy, RotateCw, MessageSquareShare, Atom, ChevronRight, Check, FileText, X,Play } from 'lucide-vue-next'
import { Response } from '@/components/ai-elements/response'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useChatStore } from "@/store/modules/chat"
import { GET_MODEL } from "@/utils/model"
import { storeToRefs } from "pinia"
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const userStore = useUserStore()
const chatStore = useChatStore()
const props = defineProps<{
  message: ChatMessage & { text?: string }
}>()

// --------------------------------------------------------
// 文件相关逻辑
// --------------------------------------------------------

const previewImage = ref<string | null>(null)

// 获取所有文件的列表 (兼容新旧字段)
const allFiles = computed(() => {
  const files: MessageFile[] = [];
  
  // 优先使用新的多文件数组
  if (props.message.files && props.message.files.length > 0) {
    return props.message.files;
  } 
  // 兼容旧的单文件字段
  else if (props.message.file_url) {
    files.push({ 
      id: props.message.id, 
      file_url: props.message.file_url 
    });
  }
  
  return files;
})


// 判断是否为图片
const isImage = (file: MessageFile) => {
  // 如果有明确的 type 字段（乐观更新时有），直接用 type 判断
  if (file.file_type) {
    return file.file_type.startsWith('image/');
  }

  // 如果是后端返回的数据，通常 file_url 有明确的后缀
  const url = file.file_url;
  if (!url) return false
  
  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url) || url.startsWith('data:image');
}

// 获取文件名
const getFileName = (file: MessageFile) => {
  // 1. 优先使用乐观更新传过来的文件名
  if (file.file_name) return file.file_name;

  const url = file.file_url;
  if (!url) return t('common.unknownFile');
  if (url.startsWith('blob:')) return 'Uploaded File'; // 只有在 type 和 name 都缺失的极端情况下才会走到这
  
  try {
    const name = url.split('/').pop() || t('common.file');
    return decodeURIComponent(name);
  } catch (e) {
    return t('common.file');
  }
}

// 处理预览点击
const handlePreview = (url: string | null, file?: MessageFile) => {
  if (!url) return;
  
  // 预览时也使用更准确的判断
  const isImg = file ? isImage(file) : /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);

  if (isImg) {
    previewImage.value = url;
  } else {
    window.open(url, '_blank');
  }
}

const closePreview = () => {
  previewImage.value = null;
}

// --------------------------------------------------------
// AI 消息逻辑
// --------------------------------------------------------

// AI 逻辑
const { regeneratingMessageId } = storeToRefs(chatStore)

// 判断是否正在流式传输 (包括普通生成和重新生成)
// 现在 chatStore.isGenerating(sessionId) 是更准确的判断，但这里我们只能拿到 messageId
// 结合 chatStore 状态来判断
const isStreaming = computed(() => {
    // 1. 如果是临时消息 (id < 0) 且当前会话正在生成，视为 streaming
    const sessionGenerating = chatStore.isGenerating(props.message.session);
    if (props.message.id < 0 && sessionGenerating) return true;
    // 2. 如果是正在重新生成的消息
    if (regeneratingMessageId.value === props.message.id) return true;
    return false;
})

// 判断是否是最后一条 AI 消息 (用于显示 Continue 按钮)
const isLastAiMessage = computed(() => {
    if (props.message.sender !== 'ai') return false;
    const currentMsgs = chatStore.currentMessages;
    if (currentMsgs.length === 0) return false;
    return currentMsgs[currentMsgs.length - 1]?.id === props.message.id;
})
const copyTimer = ref<number | null>(null)
const copySuccess = ref<boolean>(false)
const isReasoningExpanded = ref(false)

const isCompletelyEmpty = computed(() => {
  const hasReasoning = props.message.reasoning_content && props.message.reasoning_content.trim() !== ''
  const hasContent = props.message.content && props.message.content.trim() !== ''
  if (isStreaming.value) {
    return !hasReasoning && !hasContent
  }
  return props.message.sender === 'ai' && !hasReasoning && !hasContent
})

const hasReasoningContent = computed(() => {
  return props.message.reasoning_content && props.message.reasoning_content.trim() !== ''
})

const hasAnswerContent = computed(() => {
  return props.message.content && props.message.content.trim() !== ''
})

const isReasoningStreaming = computed(() => {
  return isStreaming.value && hasReasoningContent.value && !hasAnswerContent.value
})

const isAnswerStreaming = computed(() => {
  return isStreaming.value && hasAnswerContent.value
})

const reasoningCharCount = computed(() => {
  return props.message.reasoning_content?.length || 0
})

const toggleReasoning = () => {
  isReasoningExpanded.value = !isReasoningExpanded.value
}

const handleAction = async (actionType: 'share' | 'retry' | 'copy'| 'continue') => {
  if (actionType === 'share') handleShare();
  else if (actionType === 'retry') handleRetry();
  else if (actionType === 'copy') handleCopy();
  else if (actionType === 'continue') handleContinue();
}

const handleContinue = () => {
    const currentModel = GET_MODEL() || 'deepseek-chat';
    chatStore.continueGenerate(props.message.session, currentModel);
}

const handleShare = () => {
  const shareText = `${t('chat.sharePrefix')}: ${props.message.content}`;
  if (navigator.share) {
    navigator.share({
      title: t('chat.shareTitle'),
      text: shareText,
      url: window.location.href
    }).catch((error) => console.error(t('chat.shareFaild'), error));
  } else {
    handleCopy();
  }
}

const handleRetry = () => {
  const currentModel = GET_MODEL() || 'deepseek-chat'; 
  chatStore.regenerateMessage(props.message.id, currentModel);
}

const handleCopy = async () => {
  let contentToCopy = props.message.content || '';
  if (props.message.reasoning_content) {
    contentToCopy = `[${t('chat.thinkingProcess')}]\n${props.message.reasoning_content}\n\n[${t('chat.answer')}]\n${contentToCopy}`;
  }
  if (!contentToCopy) return;

  try {
    await navigator.clipboard.writeText(contentToCopy);
    if (copyTimer.value) {
      clearTimeout(copyTimer.value)
      copyTimer.value = null
    }
    copySuccess.value = true
    copyTimer.value = window.setTimeout(() => {
      copySuccess.value = false
      copyTimer.value = null
    }, 1500)
  } catch (err) {
    console.error(t('chat.copyFailed'), err);
  }
}
</script>

<style scoped>
/* 预览淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}



/* 缩放动画 */
@keyframes zoomIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-zoom-in {
  animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* copy图标与check图标切换动画 */
.icon-fade-enter-from,
.icon-fade-leave-to {
    opacity: 0; 
}

.icon-fade-enter-active,
.icon-fade-leave-active {
    transition: opacity 0.1s ease-in-out, transform 0.1s ease-in-out;
}

/* 打字机光标动画 */
.typing-cursor {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.cursor {
  width: 2px;
  height: 20px;
  background: #667eea;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* 确保渲染内容的样式 */
.rendered-content {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 推理区域淡入动画 */
.reasoning-section {
  animation: fadeInSlide 0.3s ease-out;
}

@keyframes fadeInSlide {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 推理内容展开/收起动画 */
.reasoning-content {
  max-height: 400px;
  overflow-y: auto;
  animation: expandDown 0.3s ease-out;
}

@keyframes expandDown {
  from {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  to {
    opacity: 1;
    max-height: 400px;
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }
}

/* 流式内容淡入 */
.streaming-content {
  animation: contentFadeIn 0.2s ease-in;
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 美化滚动条 */
.reasoning-content::-webkit-scrollbar {
  width: 4px;
}


.reasoning-content::-webkit-scrollbar-thumb {
  background: #e5e5e5;
  border-radius: 3px;
  transition: background 0.2s;
}

.reasoning-content::-webkit-scrollbar-thumb:hover {
  background: #dcdcdc
}

/* 深色模式优化 */
.dark .reasoning-content {
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.9));
}

/* 推理标题悬停效果 */
.reasoning-header {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.reasoning-header:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
</style>