<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { dataViewToHex, dataViewToString } from '@/lib/bluetooth/utils'

interface DataEntry {
  id: string
  timestamp: Date
  value: string
  type: 'hex' | 'string' | 'parsed'
  raw?: DataView
}

interface Props {
  title?: string
  maxEntries?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Real-time Data Stream',
  maxEntries: 50,
})

const dataEntries = ref<DataEntry[]>([])
const isPaused = ref(false)
const displayMode = ref<'hex' | 'string' | 'parsed'>('hex')
const scrollContainer = ref<HTMLElement | null>(null)
const autoScroll = ref(true)

const addData = (data: DataView, parsed?: unknown) => {
  if (isPaused.value) return

  const entry: DataEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    value: displayMode.value === 'string' 
      ? dataViewToString(data)
      : displayMode.value === 'hex'
      ? dataViewToHex(data)
      : JSON.stringify(parsed || {}),
    type: displayMode.value,
    raw: data,
  }

  dataEntries.value.unshift(entry)

  if (dataEntries.value.length > props.maxEntries) {
    dataEntries.value = dataEntries.value.slice(0, props.maxEntries)
  }

  if (autoScroll.value && scrollContainer.value) {
    setTimeout(() => {
      scrollContainer.value?.scrollTo({ top: 0, behavior: 'smooth' })
    }, 10)
  }
}

const clearData = () => {
  dataEntries.value = []
}

const togglePause = () => {
  isPaused.value = !isPaused.value
}

const changeDisplayMode = (mode: 'hex' | 'string' | 'parsed') => {
  displayMode.value = mode
  // Reformat existing entries
  dataEntries.value = dataEntries.value.map((entry: DataEntry) => ({
    ...entry,
    value: entry.raw
      ? mode === 'string'
        ? dataViewToString(entry.raw)
        : mode === 'hex'
        ? dataViewToHex(entry.raw)
        : entry.value
      : entry.value,
    type: mode,
  }))
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  })
}

defineExpose({ addData, clearData })

onUnmounted(() => {
  clearData()
})
</script>

<template>
  <div
    class="relative flex flex-col overflow-hidden rounded-xl border border-sidebar-border/70 bg-white shadow-lg dark:bg-gray-900 dark:border-sidebar-border"
  >
    <!-- Header -->
    <div class="border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 p-4 dark:from-green-950/30 dark:to-blue-950/30 dark:border-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ title }}
          </h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {{ dataEntries.length }} messages
            <span v-if="isPaused" class="text-orange-600 dark:text-orange-400">(Paused)</span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Display Mode -->
          <div class="flex rounded-lg border border-gray-300 dark:border-gray-700">
            <button
              @click="changeDisplayMode('hex')"
              :class="{
                'bg-blue-500 text-white': displayMode === 'hex',
                'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300': displayMode !== 'hex',
              }"
              class="px-3 py-1 text-xs font-medium transition-colors"
            >
              HEX
            </button>
            <button
              @click="changeDisplayMode('string')"
              :class="{
                'bg-blue-500 text-white': displayMode === 'string',
                'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300': displayMode !== 'string',
              }"
              class="border-x border-gray-300 px-3 py-1 text-xs font-medium transition-colors dark:border-gray-700"
            >
              STR
            </button>
            <button
              @click="changeDisplayMode('parsed')"
              :class="{
                'bg-blue-500 text-white': displayMode === 'parsed',
                'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300': displayMode !== 'parsed',
              }"
              class="px-3 py-1 text-xs font-medium transition-colors"
            >
              JSON
            </button>
          </div>

          <!-- Pause/Play -->
          <button
            @click="togglePause"
            :class="{
              'bg-orange-500 hover:bg-orange-600': isPaused,
              'bg-green-500 hover:bg-green-600': !isPaused,
            }"
            class="rounded-lg p-2 text-white transition-colors"
            :title="isPaused ? 'Resume' : 'Pause'"
          >
            <svg v-if="isPaused" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <svg v-else class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          </button>

          <!-- Clear -->
          <button
            @click="clearData"
            class="rounded-lg bg-red-500 p-2 text-white transition-colors hover:bg-red-600"
            title="Clear all"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Data Stream -->
    <div
      ref="scrollContainer"
      class="flex-1 overflow-y-auto p-4"
      style="max-height: 400px"
    >
      <div v-if="dataEntries.length === 0" class="flex h-full items-center justify-center">
        <p class="text-gray-500 dark:text-gray-400">No data received yet</p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="entry in dataEntries"
          :key="entry.id"
          class="group rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
        >
          <div class="mb-1 flex items-center justify-between">
            <span class="text-xs font-mono text-gray-500 dark:text-gray-400">
              {{ formatTime(entry.timestamp) }}
            </span>
            <span
              class="rounded px-2 py-0.5 text-xs font-medium"
              :class="{
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': entry.type === 'hex',
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': entry.type === 'string',
                'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': entry.type === 'parsed',
              }"
            >
              {{ entry.type.toUpperCase() }}
            </span>
          </div>
          <div
            class="break-all font-mono text-sm text-gray-900 dark:text-gray-100"
            :class="{
              'text-xs': entry.type === 'hex',
            }"
          >
            {{ entry.value }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
