<template>
  <div class="flex w-full mb-4 px-4 mt-2.5" :class="message.sender === 'user' ? 'justify-end' : 'justify-start'">
    <!-- AI 消息 -->
    <div v-if="message.sender === 'ai'" class="flex items-start max-w-[70%] gap-3">
      <Sparkle class="shrink-0 size-7 mt-0.5"></Sparkle>
      <div class="flex flex-col w-full">
        <div class="bg-white-200 text-gray-900 dark:text-white dark:bg-muted rounded-2xl rounded-bl-sm px-4 py-2 text-sm leading-relaxed shadow-lg">
          <!-- 🎯 只有在完全没有内容时才显示"正在输入" -->
          <div v-if="isCompletelyEmpty" class="flex items-center gap-2 py-1">
            <div class="flex gap-1">
              <div class="typing-cursor">
                <span>AI 正在输入</span>
                <div class="cursor"></div>
              </div>
            </div>
          </div>
          
          <!-- 🎯 有任何内容就显示 -->
          <div v-else class="w-full">
            <!-- 🎯 推理过程区域 (如果存在) -->
            <div v-if="hasReasoningContent" class="reasoning-section mb-3">
              <div 
                class="reasoning-header flex items-center gap-2 p-2 bg-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg cursor-pointer  dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-200"
                @click="toggleReasoning"
              >
                
                <Atom   
                  class="w-4 h-4 text-gray-500" 
                />
                
                <div class="flex items-center gap-2 flex-1">
                  <span class="text-xs font-semibold text-black dark:text-blue-400">
                    思考过程
                  </span>
                  
                  <!-- 🎯 实时推理状态指示器 -->
                  <div v-if="isReasoningStreaming" class="flex items-center gap-1">
                    <div class="flex gap-0.5">
                      <span class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                      <span class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                      <span class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                    </div>
                    <span class="text-xs text-gray-400 font-medium">推理中</span>
                  </div>
                  
                  <!-- 推理完成指示 -->
                  <span v-else class="text-xs text-gray-500 dark:text-gray-400">
                    ({{ reasoningCharCount }} 字)
                  </span>
                </div>

                <ChevronRight    
                  class="w-4 h-4 text-gray-500 transition-transform duration-400" 
                  :class="{ 'rotate-90 ': isReasoningExpanded }"
                />
              </div>
              
              <!-- 🎯 推理内容 - 支持流式展示 -->
              <div 
                v-show="isReasoningExpanded"
                class="reasoning-content mt-2 p-3 bg-white dark:from-gray-800 dark:to-gray-750 rounded-lg  relative overflow-hidden"
              >
                <!-- 流式输出的推理内容 -->
                <div class="text-xs text-gray-500 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {{ message.reasoning_content }}
                  <!-- 🎯 推理中显示光标 -->
                  <span v-if="isReasoningStreaming" class="inline-block w-1.5 h-3.5 bg-blue-500 ml-0.5 animate-pulse"></span>
                </div>
              </div>
            </div>
            
            <!-- 🎯 正常回复内容区域 -->
            <div class="answer-content">
              <!-- 如果正在输出答案，显示渐入动画 -->
              <div 
                v-if="hasAnswerContent"
                class="rendered-content m-1"
                :class="{ 'streaming-content': isAnswerStreaming }"
              >
                <Response>{{ message.content }}</Response>
                <!-- 🎯 回答中显示光标 -->
                <span v-if="isAnswerStreaming" class="inline-block w-1.5 h-3.5 bg-gray-600 dark:bg-gray-300 ml-0.5 animate-pulse"></span>
              </div>
              
              <!-- 🎯 如果只有推理内容但还没有答案内容 -->
              <div v-else-if="hasReasoningContent && !hasAnswerContent" class="m-1 py-2">
                <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <div class="flex gap-1">
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                  </div>
                  <span class="text-xs">正在生成回答...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="text-xs text-gray-400 mt-2 ml-2 flex">
          <div class="mt-1">
            {{ formatSessionTime(message.created_at || new Date().toISOString()) }}
          </div>
          
          <div class="flex-1"></div>
          <div class="flex gap-x-3 mr-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <div class="flex justify-center items-center rounded-2xl h-6 w-6 hover:bg-gray-200 cursor-pointer" @click="handleAction('share')">
                    <MessageSquareShare :size="16"></MessageSquareShare>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" class="bg-black text-white px-2 py-1 rounded-md [&_svg]:hidden!">
                  <p>分享</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <div class="flex justify-center items-center rounded-2xl h-6 w-6 hover:bg-gray-200 cursor-pointer" @click="handleAction('retry')">
                    <RotateCw :size="16"></RotateCw>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" class="bg-black text-white px-2 py-1 rounded-md [&_svg]:hidden!">
                  <p>重试</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <div class="flex justify-center items-center rounded-2xl h-6 w-6 hover:bg-gray-200 cursor-pointer" @click="handleAction('copy')">
                    <Copy :size="16"></Copy>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" class="bg-black text-white px-2 py-1 rounded-md [&_svg]:hidden!">
                  <p>复制</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户消息 -->
    <div v-else class="flex items-start max-w-[70%] gap-3 flex-row-reverse">
      <Avatar class="w-10 h-10">
        <AvatarImage :src="userStore.avatar" alt="@unovue" />
        <AvatarFallback>{{ userStore.username[0] }}</AvatarFallback>
      </Avatar>
      <div class="flex flex-col items-end">
        <div class="bg-black text-white dark:bg-gray-500 rounded-2xl rounded-br-sm px-4 py-2 text-sm leading-relaxed shadow-sm">
          <div v-html="message.content" class="rendered-content"></div>
        </div>
        <div class="text-xs text-gray-400 mt-1 mr-2">
          {{ formatSessionTime(message.created_at || new Date().toISOString()) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { defineProps, computed, ref } from 'vue'
import useUserStore from '@/store/modules/user'
import { formatSessionTime } from '@/utils/time'
import type { ChatMessage } from '@/api/chat/type'
import { Bot, Copy, RotateCw, MessageSquareShare, Atom,ChevronRight,Sparkle} from 'lucide-vue-next'
import { Response } from '@/components/ai-elements/response'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const userStore = useUserStore()

const props = defineProps<{
  message: ChatMessage & { text?: string }
}>()

// 🎯 推理过程展开状态 - 默认折叠
const isReasoningExpanded = ref(false)

// 🎯 判断是否完全没有内容（既没有推理也没有回答）
const isCompletelyEmpty = computed(() => {
  const hasReasoning = props.message.reasoning_content && props.message.reasoning_content.trim() !== ''
  const hasContent = props.message.content && props.message.content.trim() !== ''
  return props.message.sender === 'ai' && !hasReasoning && !hasContent
})

// 🎯 是否有推理内容
const hasReasoningContent = computed(() => {
  return props.message.reasoning_content && props.message.reasoning_content.trim() !== ''
})

// 🎯 是否有回答内容
const hasAnswerContent = computed(() => {
  return props.message.content && props.message.content.trim() !== ''
})

// 🎯 推理过程是否正在流式输出
// 判断依据：有推理内容，但最终消息还没收到（id 为临时负数）
const isReasoningStreaming = computed(() => {
  return props.message.id < 0 && hasReasoningContent.value && !hasAnswerContent.value
})

// 🎯 回答是否正在流式输出
const isAnswerStreaming = computed(() => {
  return hasAnswerContent.value && props.message.id < 0
})

// 🎯 推理内容字符数
const reasoningCharCount = computed(() => {
  return props.message.reasoning_content?.length || 0
})

// 🎯 切换推理过程展开/折叠
const toggleReasoning = () => {
  isReasoningExpanded.value = !isReasoningExpanded.value
}

/**
 * ⚡ 动作处理函数
 */
const handleAction = async (actionType: 'share' | 'retry' | 'copy') => {
  switch (actionType) {
    case 'share':
      handleShare();
      break;
    case 'retry':
      handleRetry();
      break;
    case 'copy':
      handleCopy();
      break;
    default:
      console.warn(`未知的操作类型: ${actionType}`);
  }
}

const handleShare = () => {
  const shareText = `来自 AI 的消息: ${props.message.content}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'AI 聊天记录分享',
      text: shareText,
      url: window.location.href
    })
    .then(() => {
      console.log('分享成功');
    })
    .catch((error) => {
      console.error('分享失败', error);
    });
  } else {
    console.log('浏览器不支持 Web Share API,回退到复制功能');
    handleCopy();
  }
}

const handleRetry = () => {
  console.log(`正在重试消息 ID: ${props.message.id}`);
}

const handleCopy = async () => {
  let contentToCopy = props.message.content || '';
  
  // 如果有推理过程，可以选择一起复制
  if (props.message.reasoning_content) {
    contentToCopy = `【思考过程】\n${props.message.reasoning_content}\n\n【回答】\n${contentToCopy}`;
  }

  if (!contentToCopy) {
    return;
  }

  try {
    await navigator.clipboard.writeText(contentToCopy);
    console.log('内容已复制');
  } catch (err) {
    console.error('复制到剪贴板失败:', err);
  }
}
</script>

<style scoped>
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

/* 🎯 推理区域淡入动画 */
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

/* 🎯 推理内容展开/收起动画 */
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

/* 🎯 流式内容淡入 */
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

/* 🎯 光标闪烁动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* 🎯 弹跳动画 */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
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