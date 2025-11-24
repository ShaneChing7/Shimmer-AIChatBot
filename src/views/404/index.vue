<script setup>
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
// 如果您已经创建了 ShimmerLogo，也可以引入它放在左上角
// import ShimmerLogo from './components/ShimmerLogo.vue'; 

const router = useRouter();

const goHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="relative min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden selection:bg-indigo-500/30">
    
    <!-- 背景装饰：星空/噪点 -->
    <div class="absolute inset-0 z-0">
      <!-- 径向渐变背景 -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-black"></div>
      
      <!-- 网格线装饰 (可选) -->
      <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
    </div>

    <!-- 主体内容 -->
    <div class="relative z-10 flex flex-col items-center text-center px-4 max-w-lg mx-auto">
      
      <!-- 404 视觉图：雷达搜索效果 -->
      <div class="relative w-48 h-48 mb-8 flex items-center justify-center">
        <!-- 扩散波纹动画 rings -->
        <div class="absolute inset-0 rounded-full border border-slate-700/50 animate-[ping_3s_ease-out_infinite] opacity-20"></div>
        <div class="absolute inset-4 rounded-full border border-slate-600/40 animate-[ping_3s_ease-out_infinite_1s] opacity-20"></div>
        <div class="absolute inset-8 rounded-full border border-slate-500/30 animate-[ping_3s_ease-out_infinite_2s] opacity-20"></div>
        
        <!-- 核心 Shimmer 图标 (稍微调暗，表示离线/丢失状态) -->
        <div class="relative w-24 h-24 rounded-full bg-slate-900 shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)] border border-slate-800 flex items-center justify-center group">
          <svg viewBox="0 0 64 64" fill="none" class="w-16 h-16 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
             <path d="M32 12 C32 12 36 28 52 32 C36 36 32 52 32 52 C32 52 28 36 12 32 C28 28 32 12 32 12 Z" fill="#94a3b8" class="animate-pulse">
             </path>
             <circle cx="32" cy="32" r="24" stroke="#475569" stroke-width="1.5" stroke-opacity="0.5" />
          </svg>
        </div>
      </div>

      <!-- 错误代码 -->
      <h1 class="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 mb-2 font-sans tracking-tight">
        404
      </h1>

      <!-- 文案 -->
      <h2 class="text-xl text-slate-200 font-medium mb-4">
        {{t('notFound.signalLost')}}
      </h2>
      <p class="text-slate-400 mb-10 leading-relaxed">
        {{t('notFound.description1')}} <br>
        {{t('notFound.description2')}}
      </p>

      <!-- 返回按钮 -->
      <button 
        @click="goHome"
        class="group relative inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-100 hover:bg-white text-slate-900 rounded-full font-semibold transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        <span>{{t('notFound.backToConsole')}}</span>
        <!-- 箭头图标 -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:translate-x-0.5 transition-transform">
          <path d="M5 12h14"></path>
          <path d="m12 5 7 7-7 7"></path>
        </svg>
      </button>

    </div>

    <!-- 底部版权或辅助信息 (可选) -->
    <div class="absolute bottom-6 text-slate-600 text-xs font-mono">
      SYSTEM_ERR_NOT_FOUND // SHIMMER_AI
    </div>

  </div>
</template>

<style scoped>
/* 如果您没有在 tailwind.config.js 中配置 ping 动画的时长，这里可以微调，或者直接使用上面的任意类 */
</style>