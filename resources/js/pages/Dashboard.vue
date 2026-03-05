<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Head } from '@inertiajs/vue3'
import AppLayout from '@/layouts/AppLayout.vue'
import BLEDeviceCard from '@/components/BLEDeviceCard.vue'
// Removed BLESensorCard - users can view all data via Services Explorer
import BLEServicesExplorer from '@/components/BLEServicesExplorer.vue'
import BLEDataStream from '@/components/BLEDataStream.vue'
import { dashboard } from '@/routes'
import type { BreadcrumbItem } from '@/types'
import { useBLEDevice } from '@/composables/bluetooth/useBLEDevice'
import { useBLEStream } from '@/composables/bluetooth/useBLEStream'
import { useBLEWorker } from '@/composables/bluetooth/useBLEWorker'
import { GATT_CHARACTERISTICS, GATT_SERVICES } from '@/types/bluetooth'
import { dataViewToHex, stringToArrayBuffer, hexToArrayBuffer } from '@/lib/bluetooth/utils'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
]

// Input mode for write commands
type InputMode = 'string' | 'hex'
const inputMode = ref<InputMode>('hex')

// BLE Device Management
const {
    device,
    deviceInfo,
    connectionState,
    services,
    error: bleError,
    connect,
    disconnect,
    discoverServices,
    readCharacteristic,
    writeCharacteristic,
    subscribeToNotifications,
} = useBLEDevice()

// Sensor Data
const batteryLevel = ref<number | undefined>(undefined)
const signalStrength = ref<number>(75) // Mock RSSI

// User-provided service UUIDs
const customServiceUUIDs = ref<string>(`${GATT_SERVICES.BATTERY_SERVICE}
${GATT_SERVICES.DEVICE_INFORMATION}
${GATT_SERVICES.ENVIRONMENTAL_SENSING}
${GATT_SERVICES.HEART_RATE}
${GATT_SERVICES.GENERIC_ACCESS}
${GATT_SERVICES.GENERIC_ATTRIBUTE}`)
const showServiceInput = ref(false)

// Parse user input into array of UUIDs
const parseServiceUUIDs = (): string[] => {
    return customServiceUUIDs.value
        .split(/[,\n]/)  // Split by comma or newline
        .map(uuid => uuid.trim())
        .filter(uuid => uuid.length > 0)  // Remove empty strings
}

// Data Stream
const dataStreamRef = ref<InstanceType<typeof BLEDataStream> | null>(null)
const { readable, isReading, startReading, stopReading } = useBLEStream(device.value)

// Worker for data processing
const { parseData, analyzeData, isProcessing } = useBLEWorker()

// Statistics
const totalMessages = ref(0)
const dataRate = ref(0)

/**
 * Connect to BLE device
 */
const handleConnect = async () => {
    try {
        const serviceUUIDs = parseServiceUUIDs()
        
        await connect(
            {
                // Optionally filter by services
                // services: serviceUUIDs,
            },
            {
                discoverAllServices: true,
                autoReconnect: true,
                optionalServices: serviceUUIDs,
            }
        )

        // Hide service input after successful connection
        showServiceInput.value = false
        
        // Read initial values
        await readInitialValues()
    } catch (err) {
        console.error('Connection failed:', err)
    }
}

/**
 * Disconnect from device
 */
const handleDisconnect = async () => {
    try {
        await stopReading()
        await disconnect()
        // Reset sensor data
        batteryLevel.value = undefined
    } catch (err) {
        console.error('Disconnect failed:', err)
    }
}

/**
 * Read initial sensor values
 */
const readInitialValues = async () => {
    if (!device.value) return

    // Try to read battery level
    try {
        const batteryService = services.value.find(s => 
            s.uuid === '0000180f-0000-1000-8000-00805f9b34fb'
        )
        if (batteryService) {
            const value = await readCharacteristic(
                batteryService.uuid,
                GATT_CHARACTERISTICS.BATTERY_LEVEL
            )
            batteryLevel.value = value.getUint8(0)
        }
    } catch (err) {
        console.log('Battery service not available')
    }
}

/**
 * Handle reading a characteristic
 */
const handleReadCharacteristic = async (serviceUuid: string, charUuid: string) => {
    try {
        const value = await readCharacteristic(serviceUuid, charUuid)
        
        // Process through worker - convert to ArrayBuffer
        const arrayBuffer = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)
        const parsed = await parseData(arrayBuffer, 'hex')
        
        // Display in data stream
        dataStreamRef.value?.addData(value, parsed)
        
        console.log('Read characteristic:', { serviceUuid, charUuid, value: dataViewToHex(value), parsed })
    } catch (err) {
        console.error('Read failed:', err)
    }
}

/**
 * Handle writing to a characteristic
 */
const handleWriteCharacteristic = async (serviceUuid: string, charUuid: string) => {
    const promptMessage = inputMode.value === 'hex' 
        ? 'Enter value to write (hex format, e.g., 01 02 03):'
        : 'Enter value to write (string):';
    
    const input = prompt(promptMessage)
    if (!input) return

    try {
        let buffer: ArrayBuffer
        
        if (inputMode.value === 'hex') {
            // Convert hex string to ArrayBuffer
            buffer = hexToArrayBuffer(input)
        } else {
            // Convert string to ArrayBuffer
            buffer = stringToArrayBuffer(input)
        }
        
        await writeCharacteristic(serviceUuid, charUuid, buffer)
        console.log('Write successful:', { mode: inputMode.value, input })
    } catch (err) {
        console.error('Write failed:', err)
        alert(`Write failed: ${err instanceof Error ? err.message : String(err)}`)
    }
}

/**
 * Handle subscribing to characteristic notifications
 */
const handleSubscribeCharacteristic = async (serviceUuid: string, charUuid: string) => {
    try {
        // Subscribe using traditional method
        await subscribeToNotifications(serviceUuid, charUuid, async (data) => {
            totalMessages.value++
            
            // Process through worker - convert to ArrayBuffer
            const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
            const parsed = await parseData(arrayBuffer, 'uint8', { 
                deviceId: device.value?.id 
            })
            
            // Display in data stream
            dataStreamRef.value?.addData(data, parsed)
            
            // Update battery level if it's the battery characteristic
            if (charUuid === GATT_CHARACTERISTICS.BATTERY_LEVEL) {
                batteryLevel.value = data.getUint8(0)
            }
        })

        console.log('Subscribed to notifications')
    } catch (err) {
        console.error('Subscribe failed:', err)
    }
}

// Mock data for demo purposes (remove in production)
const startMockData = () => {
    if (!device.value) return
    
    setInterval(() => {
        if (connectionState.value === 'connected') {
            // Update mock data rate
            dataRate.value = Math.floor(Math.random() * 1000)
        }
    }, 2000)
}

// Watch for device connection to start mock data
watch(connectionState, (state) => {
    if (state === 'connected') {
        startMockData()
    }
})

// Check for Web Bluetooth availability on mount
onMounted(async () => {
    if (!navigator.bluetooth) {
        console.warn('Web Bluetooth API not available')
    }
})
</script>

<template>
    <Head title="Dashboard" />

    <AppLayout :breadcrumbs="breadcrumbs">
        <div
            class="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4"
        >
            <!-- Error Banner -->
            <div
                v-if="bleError"
                class="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
            >
                <div class="flex items-center gap-2">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <div>
                        <strong class="font-semibold">{{ bleError.type }}</strong>
                        <p class="text-sm">{{ bleError.message }}</p>
                    </div>
                </div>
            </div>

            <!-- Top Row: Device Card and Service UUID Configuration -->
            <div class="grid auto-rows-min gap-4 md:grid-cols-1">
                <!-- Device Connection Card -->
                <BLEDeviceCard
                    :device="deviceInfo"
                    :connection-state="connectionState"
                    :battery-level="batteryLevel"
                    :signal-strength="signalStrength"
                    @connect="handleConnect"
                    @disconnect="handleDisconnect"
                />
                
                <!-- Service UUID Configuration -->
                <div
                    v-if="connectionState === 'disconnected'"
                    class="rounded-lg border border-sidebar-border/70 bg-white p-6 dark:bg-gray-900 dark:border-sidebar-border"
                >
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Service UUIDs
                            </h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                Specify which services to access (one per line or comma-separated)
                            </p>
                        </div>
                        <button
                            @click="showServiceInput = !showServiceInput"
                            class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                            {{ showServiceInput ? 'Hide' : 'Customize' }}
                        </button>
                    </div>
                    
                    <div v-if="showServiceInput" class="space-y-3">
                        <textarea
                            v-model="customServiceUUIDs"
                            rows="6"
                            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Enter UUIDs (one per line or comma-separated)"
                        />
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            💡 Tip: Include all services you want to access before connecting. Use full 128-bit UUIDs or standard 16-bit UUIDs.
                        </p>
                    </div>
                    
                    <div v-else class="text-sm text-gray-600 dark:text-gray-400">
                 div class="flex flex-col gap-4">
                    <!-- Input Mode Toggle -->
                    <div
                        v-if="connectionState === 'connected'"
                        class="rounded-lg border border-sidebar-border/70 bg-white p-4 dark:bg-gray-900 dark:border-sidebar-border"
                    >
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    Write Input Mode
                                </h3>
                                <p class="text-xs text-gray-600 dark:text-gray-400">
                                    Choose how to enter data when writing to characteristics
                                </p>
                            </div>
                            <div class="flex rounded-lg border border-gray-300 dark:border-gray-700">
                                <button
                                    @click="inputMode = 'hex'"
                                    :class="{
                                        'bg-blue-500 text-white': inputMode === 'hex',
                                        'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300': inputMode !== 'hex',
                                    }"
                                    class="px-3 py-1.5 text-sm font-medium transition-colors rounded-l-lg"
                                >
                                    HEX
                                </button>
                                <button
                                    @click="inputMode = 'string'"
                                    :class="{
                                        'bg-blue-500 text-white': inputMode === 'string',
                                        'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300': inputMode !== 'string',
                                    }"
                                    class="border-l border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors dark:border-gray-700 rounded-r-lg"
                                >
                                    STRING
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <BLEServicesExplorer
                        :services="services"
                        :loading="connectionState === 'connecting'"
                        @read-characteristic="handleReadCharacteristic"
                        @write-characteristic="handleWriteCharacteristic"
                        @subscribe-characteristic="handleSubscribeCharacteristic"
                    />
                </divclass="grid gap-4 md:grid-cols-2">
                <!-- GATT Services Explorer -->
                <BLEServicesExplorer
                    :services="services"
                    :loading="connectionState === 'connecting'"
                    @read-characteristic="handleReadCharacteristic"
                    @write-characteristic="handleWriteCharacteristic"
                    @subscribe-characteristic="handleSubscribeCharacteristic"
                />

                <!-- Real-time Data Stream -->
                <BLEDataStream
                    ref="dataStreamRef"
                    title="Real-time Data Stream"
                    :max-entries="50"
                />
            </div>

            <!-- Statistics Footer -->
            <div
                v-if="connectionState === 'connected'"
                class="grid gap-4 md:grid-cols-3"
            >
                <div class="rounded-lg border border-sidebar-border/70 bg-white p-4 dark:bg-gray-900 dark:border-sidebar-border">
                    <p class="text-sm text-gray-600 dark:text-gray-400">Total Messages</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {{ totalMessages.toLocaleString() }}
                    </p>
                </div>
                <div class="rounded-lg border border-sidebar-border/70 bg-white p-4 dark:bg-gray-900 dark:border-sidebar-border">
                    <p class="text-sm text-gray-600 dark:text-gray-400">Data Rate</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {{ dataRate }} B/s
                    </p>
                </div>
                <div class="rounded-lg border border-sidebar-border/70 bg-white p-4 dark:bg-gray-900 dark:border-sidebar-border">
                    <p class="text-sm text-gray-600 dark:text-gray-400">Worker Status</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {{ isProcessing ? 'Processing' : 'Idle' }}
                    </p>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
