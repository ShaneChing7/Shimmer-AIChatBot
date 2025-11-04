<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { computed, useAttrs } from 'vue'

interface Props {
  class?: string
  tooltip?: string
  label?: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'ghost',
  size: 'sm',
})

const attrs = useAttrs()

const classes = computed(() => cn('relative size-9 p-1.5 text-muted-foreground hover:text-foreground', props.class))
</script>

<template>
  <TooltipProvider v-if="props.tooltip">
    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          :class="classes"
          :size="props.size"
          :variant="props.variant"
          type="button"
          v-bind="attrs"
        >
          <slot />
          <span class="sr-only">{{ props.label || props.tooltip }}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{{ props.tooltip }}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  <Button
    v-else
    :class="classes"
    :size="props.size"
    :variant="props.variant"
    type="button"
    v-bind="attrs"
  >
    <slot />
    <span class="sr-only">{{ props.label || props.tooltip }}</span>
  </Button>
</template>
