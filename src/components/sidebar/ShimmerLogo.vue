<script setup>
/**
 * Shimmer Logo Component (Vue 3)
 * 包含图标和 "Shimmer" 品牌文字
 */

// 生成随机 ID 以防止渐变冲突
const uniqueId = Math.random().toString(36).substr(2, 9);
const gradientId = `logoGrad-${uniqueId}`;
</script>

<template>
  <!-- 
    viewBox="0 0 200 48" 设定了 4:1 的长宽比
    通过 class="h-8 w-auto" 等 Tailwind 类来控制实际显示大小
  -->
  <svg 
    viewBox="0 0 200 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Shimmer Logo"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#334155" /> <!-- Slate-700 -->
        <stop offset="100%" stop-color="#0f172a" /> <!-- Slate-900 -->
      </linearGradient>
    </defs>

    <!-- 图标部分 -->
    <circle cx="24" cy="24" r="20" :fill="`url(#${gradientId})`" />
    <path 
      d="M24 10 C24 10 27 21 38 24 C27 27 24 38 24 38 C24 38 21 27 10 24 C21 21 24 10 24 10 Z" 
      fill="white" 
    />
    
    <!-- 文字部分 -->
    <!-- 
      注意：这里使用系统字体栈渲染文字。
      如果您的项目引入了 Inter 字体，它会自动应用。
      如果没有，它会回退到 sans-serif，依然保持整洁。
    -->
    <text 
      x="60" 
      y="32" 
      fill="currentColor" 
      class="text-slate-900 dark:text-white"
      font-family="'Inter', ui-sans-serif, system-ui, sans-serif" 
      font-weight="700" 
      font-size="24" 
      letter-spacing="-0.5"
    >
      Shimmer
    </text>
  </svg>
</template>