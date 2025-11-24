<template>
  <Teleport to="body">
    <!-- 1. 遮罩层 -->
    <transition name="fade">
      <div 
        v-if="visible" 
        class="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm dark:bg-black/40" 
        @click="close"
      ></div>
    </transition>

    <!-- 2. 模态框主体 -->
    <transition name="fade-scale">
      <div 
        v-if="visible"
        class="fixed top-1/2 left-1/2 z-[101] w-full max-w-[500px] -translate-x-1/2 -translate-y-1/2 px-4"
      >
        <div class="flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-[25px] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden max-h-[90vh]">
          
          <!-- 标题栏 -->
          <div class="h-14 w-full flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800/50 shrink-0">
             <div class="flex items-center gap-2">
                
                <div class="text-[18px] font-black tracking-tight">{{ t('contact.title') }}</div>
             </div>
             
             <div class="p-1.5 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" @click="close">
                 <X :size="20" class="text-gray-500 dark:text-gray-400"></X>
             </div>
          </div>

          <!-- 内容区域 -->
          <div class="p-6 overflow-y-auto custom-scrollbar">
            
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {{ t('contact.description') }}
            </p>

            <div class="space-y-4">

              <!-- 1. 邮箱卡片 (复制) -->
              <div>
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1 mb-2 block">
                  {{ t('contact.emailLabel') }}
                </span>
                <div class="group flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                    <div class="flex items-center gap-3 overflow-hidden">
                      <div class="p-2.5 rounded-xl bg-white dark:bg-gray-700 text-blue-500 shadow-sm border border-gray-100 dark:border-gray-600 flex items-center justify-center">
                          <Mail :size="20" />
                      </div>
                      <div class="flex flex-col overflow-hidden">
                          <span class="text-sm font-bold text-gray-900 dark:text-gray-100 truncate select-all">{{ contactEmail }}</span>
                          <!-- <span class="text-xs text-gray-500">{{ t('contact.officialInquiry') }}</span> -->
                      </div>
                    </div>
                    <button 
                      @click="copyText(contactEmail, 'email')"
                      class="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600 shadow-sm"
                      :title="t('contact.copy')"
                    >
                      <Check v-if="isEmailCopied" :size="18" class="text-green-500" />
                      <Copy v-else :size="18" />
                    </button>
                </div>
              </div>

              <!-- 2. Telegram 卡片 (使用本地图片) -->
              <div>
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1 mb-2 block">
                  {{ t('contact.telegramLabel') }}
                </span>
                <div class="group flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                    <div class="flex items-center gap-3 overflow-hidden">
                      <!-- Telegram Logo Container -->
                      <div class="p-2.5 rounded-xl bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 flex items-center justify-center">
                          <!-- 使用 public 下的 telegram.svg -->
                          <img src="/telegram.svg" alt="Telegram" class="w-5 h-5 object-contain" />
                      </div>
                      <div class="flex flex-col overflow-hidden">
                          <span class="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{{ telegramHandle }}</span>
                          <!-- <span class="text-xs text-gray-500">{{ t('contact.joinChannel') }}</span> -->
                      </div>
                    </div>
                    <button 
                      @click="openTelegram"
                      class="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-sky-500 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600 shadow-sm"
                      :title="t('contact.open')"
                    >
                      <ExternalLink :size="18" />
                    </button>
                </div>
              </div>

              <!-- 3. WeChat 卡片 (使用本地图片) -->
              <div>
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1 mb-2 block">
                  {{ t('contact.wechatLabel') }}
                </span>
                <div class="group flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                    <div class="flex items-center gap-3 overflow-hidden">
                      <!-- WeChat Logo Container -->
                      <div class="p-2.5 rounded-xl bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 flex items-center justify-center">
                          <!-- 使用 public 下的 wechat.svg -->
                          <img src="/wechat.svg" alt="WeChat" class="w-5 h-5 object-contain" />
                      </div>
                      <div class="flex flex-col overflow-hidden">
                          <span class="text-sm font-bold text-gray-900 dark:text-gray-100 truncate select-all">{{ wechatId }}</span>
                          <!-- <span class="text-xs text-gray-500">{{ t('contact.officialAccount') }}</span> -->
                      </div>
                    </div>
                    <button 
                      @click="copyText(wechatId, 'wechat')"
                      class="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-green-500 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600 shadow-sm"
                      :title="t('contact.copy')"
                    >
                      <Check v-if="isWechatCopied" :size="18" class="text-green-500" />
                      <Copy v-else :size="18" />
                    </button>
                </div>
              </div>

            </div>
          </div>
          
          <!-- 底部 -->
          <div class=" items-center  px-6 py-1 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex justify-center text-xs text-gray-400">
             <a href="https://github.com/ShaneChing7" class="  p-1  rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Github :size="20" />
            </a>
            {{ t('contact.businessHours') }}
                
          </div>

        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { 
  X, Mail, Copy, Check,Github , ExternalLink 
} from 'lucide-vue-next';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
}>();

const { t } = useI18n();

// --- 联系方式数据 ---
const contactEmail = "1@shane.beauty";
const telegramHandle = "@ShaneQin";
const wechatId = "ShaneQin7";

// --- 状态管理 ---
const isEmailCopied = ref(false);
const isWechatCopied = ref(false);

// 关闭模态框
const close = () => {
  emit('update:visible', false);
};

// 通用复制功能
const copyText = (text: string, type: 'email' | 'wechat') => {
  navigator.clipboard.writeText(text);
  
  if (type === 'email') {
    isEmailCopied.value = true;
    setTimeout(() => isEmailCopied.value = false, 2000);
  } else if (type === 'wechat') {
    isWechatCopied.value = true;
    setTimeout(() => isWechatCopied.value = false, 2000);
  }
};

// 打开 Telegram 链接
const openTelegram = () => {
  const url = `https://t.me/${telegramHandle.replace('@', '')}`;
  window.open(url, '_blank');
};
</script>



<style scoped>
/* 动画样式保持不变 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.fade-scale-enter-active, .fade-scale-leave-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-scale-enter-from, .fade-scale-leave-to { opacity: 0;   transform: translate(0%, 0%) scale(0.3); }

/* 滚动条 */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
</style>