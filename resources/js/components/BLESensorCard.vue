<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: number | string
  unit?: string
  icon?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
  loading: false,
})

const colorClasses = computed(() => {
  const colors: Record<typeof props.color, { bg: string; text: string; gradient: string }> = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-500/10 to-blue-600/10',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      gradient: 'from-green-500/10 to-green-600/10',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      gradient: 'from-purple-500/10 to-purple-600/10',
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
      gradient: 'from-orange-500/10 to-orange-600/10',
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      gradient: 'from-red-500/10 to-red-600/10',
    },
  }
  return colors[props.color]
})

const trendIcon = computed(() => {
  if (props.trend === 'up') return '↑'
  if (props.trend === 'down') return '↓'
  return '→'
})

const trendColor = computed(() => {
  if (props.trend === 'up') return 'text-green-600 dark:text-green-400'
  if (props.trend === 'down') return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
})
</script>

<template>
  <div
    class="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-gradient-to-br from-white to-gray-50 shadow-md transition-all hover:shadow-lg dark:from-gray-900 dark:to-gray-800 dark:border-sidebar-border"
  >
    <!-- Gradient overlay -->
    <div
      :class="colorClasses.gradient"
      class="absolute inset-0 bg-gradient-to-br opacity-50"
    />

    <!-- Content -->
    <div class="relative p-5">
      <!-- Header -->
      <div class="mb-3 flex items-center justify-between">
        <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400">
          {{ title }}
        </h4>
        <div
          v-if="icon"
          :class="colorClasses.bg"
          class="rounded-lg p-2"
        >
          <span :class="colorClasses.text" class="text-lg">{{ icon }}</span>
        </div>
      </div>

      <!-- Value -->
      <div class="mb-2">
        <div v-if="loading" class="flex items-center gap-2">
          <div class="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div class="h-6 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div v-else class="flex items-baseline gap-2">
          <span class="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {{ value }}
          </span>
          <span
            v-if="unit"
            class="text-lg font-medium text-gray-600 dark:text-gray-400"
          >
            {{ unit }}
          </span>
        </div>
      </div>

      <!-- Trend -->
      <div v-if="trend && trendValue" class="flex items-center gap-1 text-sm">
        <span :class="trendColor" class="font-medium">
          {{ trendIcon }} {{ trendValue }}
        </span>
        <span class="text-gray-500 dark:text-gray-500">vs last reading</span>
      </div>
    </div>

    <!-- Animated border on hover -->
    <div
      class="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 hover:opacity-100"
      :class="colorClasses.text"
      style="box-shadow: inset 0 0 0 2px currentColor"
    />
  </div>
</template>
