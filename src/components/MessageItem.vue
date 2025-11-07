<template>
  <div class="flex w-full mb-4 px-4 mt-2.5" :class="message.sender === 'user' ? 'justify-end' : 'justify-start'">
    <!-- AI 消息 -->
    <div v-if="message.sender === 'ai'" class="flex items-start max-w-[70%] gap-3">
      <Bot class="shrink-0 size-8 mt-0.5"></Bot>
      <div class="flex flex-col">
        <div class="bg-white-200 text-gray-900 dark:text-white dark:bg-muted rounded-2xl rounded-bl-sm px-4 py-2 text-sm leading-relaxed shadow-lg">
          <!-- 显示加载动画或实际内容 -->
          <div v-if="isThinking" class="flex items-center gap-2 py-1">
            <div class="flex gap-1">
              <div class="typing-cursor">
                <span>AI 正在输入</span>
                <div class="cursor"></div>
              </div>
            </div>
            <!-- <span class="text-gray-500 text-xs">AI 正在思考...</span> -->
          </div>
          <div v-else  class="rendered-content m-1">
            <Response>{{ message.content }}</Response>
          </div>
        </div>
        <div class="text-xs text-gray-400 mt-2 ml-2 flex">
          <div class=" mt-1">
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
              <TooltipContent side="bottom" class=" bg-black text-white px-2 py-1 rounded-md [&_svg]:hidden!">
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
import { defineProps, computed } from 'vue'
import useUserStore from '@/store/modules/user'
import { formatSessionTime } from '@/utils/time'
import type { ChatMessage } from '@/api/chat/type'
import { Bot,Copy,RotateCw,MessageSquareShare    } from 'lucide-vue-next'
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

// 判断是否正在思考 (AI 消息且内容为空)
const isThinking = computed(() => {
  return props.message.sender === 'ai' && (!props.message.content || props.message.content.trim() === '')
})

/**
 * ⚡ 动作处理函数
 * @param actionType 动作类型: 'share', 'retry', 'copy'
 */
const handleAction = async (actionType: 'share' | 'retry' | 'copy') => {
  switch (actionType) {
    case 'share':
      // --- 分享逻辑 ---
      handleShare();
      break;

    case 'retry':
      // --- 重试逻辑 ---
      handleRetry();
      break;

    case 'copy':
      // --- 复制逻辑 ---
      handleCopy();
      break;

    default:
      console.warn(`未知的操作类型: ${actionType}`);
  }
}

/**
 * 分享功能逻辑
 * 尝试使用 Web Share API (如果可用) 或回退到复制链接
 */
const handleShare = () => {
  const shareText = `来自 AI 的消息: ${props.message.content}`; // 定义分享内容
  
  if (navigator.share) {
    // 检查浏览器是否支持 Web Share API
    navigator.share({
      title: 'AI 聊天记录分享',
      text: shareText,
      url: window.location.href // 可以是当前聊天页面的链接
    })
    .then(() => {
      // showToast('分享成功!');
      console.log('分享成功');
    })
    .catch((error) => {
      // showToast('分享失败: ' + error.name);
      console.error('分享失败', error);
      // 分享失败时，可以尝试回退到复制内容或链接
      // fallbackCopy(shareText); 
    });
  } else {
    // 浏览器不支持 Web Share API 时的回退方案
    // showToast('您的浏览器不支持 Web Share API，已复制内容。');
    console.log('浏览器不支持 Web Share API，回退到复制功能');
    // 强制执行复制逻辑作为回退
    handleCopy();
  }
}

/**
 * 重试功能逻辑
 * 通常需要重新调用生成消息的 API
 */
const handleRetry = () => {
  // 关键步骤：通知父组件或 Vuex/Pinia Store 重新发送请求
  // 
  // 假设通过 $emit 或自定义事件通知外部重新生成此消息
  // ⚠️ 注意：这里您可能需要将组件修改为 emit 事件或使用 store
  // 
  // 示例: 
  // emit('retryMessage', props.message.id); 
  // 或者:
  // chatStore.retryMessage(props.message.id);
  
  // 简化的日志输出
  console.log(`正在重试消息 ID: ${props.message.id}`);
  // showToast('正在重新生成回答...');
  // 实际项目中，通常会触发一个 API 请求
}

/**
 * 复制功能逻辑
 * 将消息内容复制到剪贴板
 */
const handleCopy = async () => {
  const contentToCopy = props.message.content || '';

  if (!contentToCopy) {
    // showToast('没有内容可以复制。');
    return;
  }

  try {
    // 使用 Clipboard API
    await navigator.clipboard.writeText(contentToCopy);
    // showToast('内容已复制到剪贴板！');
    console.log('内容已复制');
  } catch (err) {
    // showToast('复制失败，请手动复制。');
    console.error('复制到剪贴板失败:', err);
    // 备用方案（例如使用 document.execCommand('copy')，但已不推荐）
  }
}

</script>

<style scoped>
/* 加载动画 - 跳动的点 */
/* 2. 打字机光标 */
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

  0%,
  100% {
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
</style>

<!-- 动画效果 -->

<!-- /* 1. 跳动的点 */
    .bouncing-dots {
      display: flex;
      gap: 8px;
    }

    .bouncing-dots span {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      animation: bounce 1.4s infinite ease-in-out both;
    }

    .bouncing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .bouncing-dots span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* 2. 打字机光标 */
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
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }

    /* 3. 波浪线 */
    .wave-dots {
      display: flex;
      gap: 6px;
    }

    .wave-dots span {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #667eea;
      animation: wave 1.2s ease-in-out infinite;
    }

    .wave-dots span:nth-child(1) { animation-delay: 0s; }
    .wave-dots span:nth-child(2) { animation-delay: 0.1s; }
    .wave-dots span:nth-child(3) { animation-delay: 0.2s; }
    .wave-dots span:nth-child(4) { animation-delay: 0.3s; }
    .wave-dots span:nth-child(5) { animation-delay: 0.4s; }

    @keyframes wave {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-15px); }
    }

    /* 4. 旋转圆圈 */
    .spinning-circle {
      width: 40px;
      height: 40px;
      border: 3px solid #e0e0e0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* 5. 脉冲圆环 */
    .pulse-ring {
      position: relative;
      width: 40px;
      height: 40px;
    }

    .pulse-ring::before,
    .pulse-ring::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border: 3px solid #667eea;
      border-radius: 50%;
      animation: pulse 2s ease-out infinite;
    }

    .pulse-ring::after {
      animation-delay: 1s;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.5);
        opacity: 1;
      }
      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }

    /* 6. 渐变条 */
    .gradient-bar {
      width: 150px;
      height: 4px;
      background: linear-gradient(90deg, 
        transparent, 
        #667eea 50%, 
        transparent
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 2px;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* 7. 弹跳小球 */
    .bouncing-ball {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      animation: ball-bounce 0.6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
    }

    @keyframes ball-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-30px); }
    }

    /* 8. 呼吸光晕 */
    .breathing-glow {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      animation: glow 2s ease-in-out infinite;
    }

    @keyframes glow {
      0%, 100% {
        box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
        transform: scale(1);
      }
      50% {
        box-shadow: 0 0 30px rgba(102, 126, 234, 0.8);
        transform: scale(1.1);
      }
    }

    <div class="card">
      <div class="card-title">1. 跳动的点 (推荐)</div>
      <div class="animation-container">
        <div class="bouncing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">2. 打字机光标</div>
      <div class="animation-container">
        <div class="typing-cursor">
          <span>AI 正在输入</span>
          <div class="cursor"></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">3. 波浪线</div>
      <div class="animation-container">
        <div class="wave-dots">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">4. 旋转圆圈</div>
      <div class="animation-container">
        <div class="spinning-circle"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">5. 脉冲圆环</div>
      <div class="animation-container">
        <div class="pulse-ring"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">6. 渐变条</div>
      <div class="animation-container">
        <div class="gradient-bar"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">7. 弹跳小球</div>
      <div class="animation-container">
        <div class="bouncing-ball"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">8. 呼吸光晕</div>
      <div class="animation-container">
        <div class="breathing-glow"></div>
      </div>
    </div> -->