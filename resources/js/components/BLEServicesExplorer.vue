<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BLEService } from '@/types/bluetooth'
import { getServiceName, getCharacteristicName, shortenUUID } from '@/lib/bluetooth/utils'

interface Props {
  services: BLEService[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  readCharacteristic: [serviceUuid: string, characteristicUuid: string]
  writeCharacteristic: [serviceUuid: string, characteristicUuid: string]
  subscribeCharacteristic: [serviceUuid: string, characteristicUuid: string]
}>()

const expandedServices = ref<Set<string>>(new Set())

const toggleService = (uuid: string) => {
  if (expandedServices.value.has(uuid)) {
    expandedServices.value.delete(uuid)
  } else {
    expandedServices.value.add(uuid)
  }
}

const getPropertyBadges = (properties: any) => {
  const badges = []
  if (properties.read) badges.push({ text: 'R', color: 'blue', tooltip: 'Read' })
  if (properties.write) badges.push({ text: 'W', color: 'green', tooltip: 'Write' })
  if (properties.notify) badges.push({ text: 'N', color: 'purple', tooltip: 'Notify' })
  if (properties.indicate) badges.push({ text: 'I', color: 'orange', tooltip: 'Indicate' })
  return badges
}

const characteristicCount = computed(() => {
  return props.services.reduce((sum: number, service: BLEService) => sum + service.characteristics.length, 0)
})
</script>

<template>
  <div
    class="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-white shadow-lg dark:bg-gray-900 dark:border-sidebar-border"
  >
    <!-- Header -->
    <div class="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:from-blue-950/30 dark:to-purple-950/30 dark:border-gray-800">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            GATT Services
          </h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {{ services.length }} services, {{ characteristicCount }} characteristics
          </p>
        </div>
        <div class="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
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
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-6">
      <div class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>

    <!-- Services List -->
    <div v-else class="max-h-96 overflow-y-auto">
      <div v-if="services.length === 0" class="p-8 text-center">
        <p class="text-gray-500 dark:text-gray-400">No services discovered</p>
      </div>

      <div v-else class="divide-y divide-gray-200 dark:divide-gray-800">
        <div
          v-for="service in services"
          :key="service.uuid"
          class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <!-- Service Header -->
          <button
            @click="toggleService(service.uuid)"
            class="flex w-full items-center justify-between p-4 text-left"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h4 class="font-medium text-gray-900 dark:text-gray-100">
                  {{ service.name }}
                </h4>
                <span
                  class="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                >
                  {{ shortenUUID(service.uuid) }}
                </span>
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {{ service.characteristics.length }} characteristics
              </p>
            </div>
            <svg
              :class="{ 'rotate-180': expandedServices.has(service.uuid) }"
              class="h-5 w-5 text-gray-400 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <!-- Characteristics -->
          <div
            v-if="expandedServices.has(service.uuid)"
            class="border-t border-gray-100 bg-gray-50 px-4 py-2 dark:border-gray-800 dark:bg-gray-900/50"
          >
            <div
              v-for="char in service.characteristics"
              :key="char.uuid"
              class="mb-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div class="mb-2 flex items-start justify-between">
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ char.name }}
                    <span v-if="char.name !== `Characteristic ${shortenUUID(char.uuid)}`" class="text-xs text-gray-500 dark:text-gray-400">
                      ({{ shortenUUID(char.uuid) }})
                    </span>
                  </p>
                  <p class="mt-0.5 text-xs font-mono text-gray-500 dark:text-gray-500 break-all">
                    {{ char.uuid }}
                  </p>
                </div>
                <div class="flex gap-1">
                  <span
                    v-for="badge in getPropertyBadges(char.properties)"
                    :key="badge.text"
                    :title="badge.tooltip"
                    class="rounded px-1.5 py-0.5 text-xs font-semibold"
                    :class="{
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': badge.color === 'blue',
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': badge.color === 'green',
                      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': badge.color === 'purple',
                      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400': badge.color === 'orange',
                    }"
                  >
                    {{ badge.text }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button
                  v-if="char.properties.read"
                  @click="emit('readCharacteristic', service.uuid, char.uuid)"
                  class="rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-600"
                >
                  Read
                </button>
                <button
                  v-if="char.properties.write"
                  @click="emit('writeCharacteristic', service.uuid, char.uuid)"
                  class="rounded bg-green-500 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-green-600"
                >
                  Write
                </button>
                <button
                  v-if="char.properties.notify || char.properties.indicate"
                  @click="emit('subscribeCharacteristic', service.uuid, char.uuid)"
                  class="rounded bg-purple-500 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-purple-600"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
