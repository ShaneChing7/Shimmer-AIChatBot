<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-vue-next'
import { computed } from 'vue'
import { useStickToBottomContext } from 'vue-stick-to-bottom'

interface Props {
  class?: string
}

const props = defineProps<Props>()
const { isAtBottom, scrollToBottom } = useStickToBottomContext()
const showScrollButton = computed(() => !isAtBottom.value)

function handleClick() {
  scrollToBottom()
}
</script>

<template>
  <div class="pointer-events-none absolute inset-0 z-20 flex items-end justify-center mb-5">
    <Button
      v-show="showScrollButton"
      class=" border-0  cursor-pointer pointer-events-auto rounded-full shadow-sm"
      :class="[props.class]"
      size="icon"
      type="button"
      variant="outline"
      v-bind="$attrs"
      @click="handleClick"
    >
      <ChevronDown class="size-4" />
    </Button>
  </div>
</template>
