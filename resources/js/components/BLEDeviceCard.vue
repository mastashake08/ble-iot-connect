<script setup lang="ts">
import { computed } from 'vue'
import type { BLEDeviceInfo, ConnectionState } from '@/types/bluetooth'

interface Props {
  device: BLEDeviceInfo | null
  connectionState: ConnectionState
  batteryLevel?: number
  signalStrength?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  connect: []
  disconnect: []
}>()

const statusColor = computed(() => {
  switch (props.connectionState) {
    case 'connected':
      return 'bg-green-500'
    case 'connecting':
      return 'bg-yellow-500 animate-pulse'
    case 'disconnecting':
      return 'bg-orange-500 animate-pulse'
    default:
      return 'bg-gray-400'
  }
})

const statusText = computed(() => {
  switch (props.connectionState) {
    case 'connected':
      return 'Connected'
    case 'connecting':
      return 'Connecting...'
    case 'disconnecting':
      return 'Disconnecting...'
    default:
      return 'Disconnected'
  }
})

const handleAction = () => {
  if (props.connectionState === 'connected') {
    emit('disconnect')
  } else if (props.connectionState === 'disconnected') {
    emit('connect')
  }
}
</script>

<template>
  <div
    class="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-gradient-to-br from-white to-gray-50 p-6 shadow-lg transition-all hover:shadow-xl dark:from-gray-900 dark:to-gray-800 dark:border-sidebar-border"
  >
    <!-- Background pattern -->
    <div class="absolute inset-0 opacity-5">
      <svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="device-pattern"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#device-pattern)" />
      </svg>
    </div>

    <!-- Content -->
    <div class="relative">
      <!-- Header -->
      <div class="mb-4 flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <div
              :class="statusColor"
              class="h-3 w-3 rounded-full shadow-lg"
            />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ device?.name || 'No Device' }}
            </h3>
          </div>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {{ statusText }}
          </p>
        </div>

        <!-- Bluetooth Icon -->
        <div
          class="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30"
        >
          <svg
            class="h-6 w-6 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
            />
          </svg>
        </div>
      </div>

      <!-- Device Info -->
      <div v-if="device" class="mb-4 space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">Device ID</span>
          <span class="font-mono text-gray-900 dark:text-gray-100">
            {{ device.id.slice(0, 8) }}...
          </span>
        </div>

        <div
          v-if="batteryLevel !== undefined"
          class="flex items-center justify-between text-sm"
        >
          <span class="text-gray-600 dark:text-gray-400">Battery</span>
          <div class="flex items-center gap-2">
            <div class="h-2 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                :style="{ width: `${batteryLevel}%` }"
                :class="{
                  'bg-green-500': batteryLevel > 50,
                  'bg-yellow-500': batteryLevel > 20 && batteryLevel <= 50,
                  'bg-red-500': batteryLevel <= 20,
                }"
                class="h-full transition-all duration-300"
              />
            </div>
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ batteryLevel }}%
            </span>
          </div>
        </div>

        <div
          v-if="signalStrength !== undefined"
          class="flex items-center justify-between text-sm"
        >
          <span class="text-gray-600 dark:text-gray-400">Signal</span>
          <div class="flex items-center gap-1">
            <div
              v-for="i in 4"
              :key="i"
              :class="{
                'bg-blue-500': signalStrength >= i * 25,
                'bg-gray-300 dark:bg-gray-600': signalStrength < i * 25,
              }"
              class="h-3 w-1 rounded-full transition-colors"
              :style="{ height: `${i * 3 + 3}px` }"
            />
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <button
        @click="handleAction"
        :disabled="connectionState === 'connecting' || connectionState === 'disconnecting'"
        class="w-full rounded-lg px-4 py-2 font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
        :class="{
          'bg-blue-600 hover:bg-blue-700 active:bg-blue-800': connectionState === 'disconnected',
          'bg-red-600 hover:bg-red-700 active:bg-red-800': connectionState === 'connected',
          'bg-gray-500': connectionState === 'connecting' || connectionState === 'disconnecting',
        }"
      >
        <span v-if="connectionState === 'disconnected'">Connect Device</span>
        <span v-else-if="connectionState === 'connected'">Disconnect</span>
        <span v-else>{{ statusText }}</span>
      </button>
    </div>
  </div>
</template>
