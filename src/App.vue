<template>
  <router-view class=" overflow-y-hidden" />
  
  <Toaster rich-colors position="top-center" />
</template>

<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'
</script>