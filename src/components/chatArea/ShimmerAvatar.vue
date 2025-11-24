<script setup>
/**
 * Shimmer AI Avatar Component (Vue 3)
 * 替换原有的 Lucide Sparkle 图标
 */

// 生成一个随机 ID 后缀，防止页面上存在多个 Avatar 时渐变 ID 冲突
// 注意：如果您的 Vue 版本是 3.5+，可以直接使用 import { useId } from 'vue'; const uniqueId = useId();
const uniqueId = Math.random().toString(36).substr(2, 9);
const gradientId = `shimmerBg-${uniqueId}`;
const filterId = `glow-${uniqueId}`;
</script>

<template>
  <!-- 
    Vue 3 的透传特性 (Fallthrough Attributes)：
    在使用组件时传入的 class (如 "shrink-0 size-7") 会自动应用到这个根 svg 标签上，无需显式声明 props
  -->
  <svg 
    viewBox="0 0 64 64" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#334155" /> <!-- Slate-700 -->
        <stop offset="100%" stop-color="#0f172a" /> <!-- Slate-900 -->
      </linearGradient>
      <filter :id="filterId">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <!-- 背景圆 -->
    <circle cx="32" cy="32" r="32" :fill="`url(#${gradientId})`" />
    
    <!-- 装饰环 -->
    <circle cx="32" cy="32" r="24" stroke="white" stroke-opacity="0.1" stroke-width="1.5" />

    <!-- 核心光芒 (带动画) -->
    <g :filter="`url(#${filterId})`">
      <path d="M32 12 C32 12 36 28 52 32 C36 36 32 52 32 52 C32 52 28 36 12 32 C28 28 32 12 32 12 Z" fill="white">
        <!-- 呼吸透明度 -->
        <animate 
          attributeName="opacity" 
          values="0.8;1;0.8" 
          dur="4s" 
          repeatCount="indefinite" 
        />
        <!-- 呼吸缩放 -->
        <animateTransform 
          attributeName="transform" 
          type="scale" 
          values="1;1.05;1" 
          additive="sum" 
          transform-origin="32 32" 
          dur="4s" 
          repeatCount="indefinite" 
        />
      </path>
    </g>
  </svg>
</template>