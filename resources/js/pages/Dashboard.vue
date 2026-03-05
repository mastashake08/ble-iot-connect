<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Head } from '@inertiajs/vue3'
import AppLayout from '@/layouts/AppLayout.vue'
import BLEDeviceCard from '@/components/BLEDeviceCard.vue'
import BLESensorCard from '@/components/BLESensorCard.vue'
import BLEServicesExplorer from '@/components/BLEServicesExplorer.vue'
import BLEDataStream from '@/components/BLEDataStream.vue'
import { dashboard } from '@/routes'
import type { BreadcrumbItem } from '@/types'
import { useBLEDevice } from '@/composables/bluetooth/useBLEDevice'
import { useBLEStream } from '@/composables/bluetooth/useBLEStream'
import { useBLEWorker } from '@/composables/bluetooth/useBLEWorker'
import { GATT_CHARACTERISTICS, GATT_SERVICES } from '@/types/bluetooth'
import { dataViewToHex } from '@/lib/bluetooth/utils'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
]

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
const temperature = ref<number | undefined>(undefined)
const humidity = ref<number | undefined>(undefined)
const heartRate = ref<number | undefined>(undefined)
const signalStrength = ref<number>(75) // Mock RSSI

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
        await connect(
            {
                // Optionally filter by services
                // services: [GATT_SERVICES.BATTERY_SERVICE],
            },
            {
                discoverAllServices: true,
                autoReconnect: true,
                optionalServices: [
                    GATT_SERVICES.BATTERY_SERVICE,
                    GATT_SERVICES.DEVICE_INFORMATION,
                    GATT_SERVICES.ENVIRONMENTAL_SENSING,
                    GATT_SERVICES.HEART_RATE,
                    GATT_SERVICES.GENERIC_ACCESS,
                    GATT_SERVICES.GENERIC_ATTRIBUTE,
                ],
            }
        )

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
        temperature.value = undefined
        humidity.value = undefined
        heartRate.value = undefined
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
        
        // Process through worker
        const parsed = await parseData(value.buffer, 'hex')
        
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
    const input = prompt('Enter value to write (hex format, e.g., 01 02 03):')
    if (!input) return

    try {
        // Convert hex string to ArrayBuffer
        const hexString = input.replace(/\s/g, '')
        const bytes = new Uint8Array(hexString.length / 2)
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hexString.substr(i * 2, 2), 16)
        }
        
        await writeCharacteristic(serviceUuid, charUuid, bytes.buffer)
        console.log('Write successful')
    } catch (err) {
        console.error('Write failed:', err)
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
            
            // Process through worker
            const parsed = await parseData(data.buffer, 'uint8', { 
                deviceId: device.value?.id 
            })
            
            // Display in data stream
            dataStreamRef.value?.addData(data, parsed)
            
            // Update sensor values based on characteristic
            if (charUuid === GATT_CHARACTERISTICS.BATTERY_LEVEL) {
                batteryLevel.value = data.getUint8(0)
            } else if (charUuid === GATT_CHARACTERISTICS.TEMPERATURE) {
                temperature.value = data.getInt16(0, true) / 100
            } else if (charUuid === GATT_CHARACTERISTICS.HUMIDITY) {
                humidity.value = data.getUint16(0, true) / 100
            } else if (charUuid === GATT_CHARACTERISTICS.HEART_RATE_MEASUREMENT) {
                const flags = data.getUint8(0)
                const is16Bit = flags & 0x01
                heartRate.value = is16Bit ? data.getUint16(1, true) : data.getUint8(1)
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
            // Update mock sensor values
            temperature.value = 20 + Math.random() * 10
            humidity.value = 40 + Math.random() * 30
            heartRate.value = 60 + Math.floor(Math.random() * 40)
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

            <!-- Top Row: Device Card and Sensor Cards -->
            <div class="grid auto-rows-min gap-4 md:grid-cols-4">
                <!-- Device Connection Card -->
                <BLEDeviceCard
                    :device="deviceInfo"
                    :connection-state="connectionState"
                    :battery-level="batteryLevel"
                    :signal-strength="signalStrength"
                    @connect="handleConnect"
                    @disconnect="handleDisconnect"
                />

                <!-- Sensor Cards -->
                <BLESensorCard
                    title="Temperature"
                    :value="temperature?.toFixed(1) ?? '--'"
                    unit="°C"
                    icon="🌡️"
                    color="orange"
                    :loading="connectionState === 'connecting'"
                />

                <BLESensorCard
                    title="Humidity"
                    :value="humidity?.toFixed(1) ?? '--'"
                    unit="%"
                    icon="💧"
                    color="blue"
                    :loading="connectionState === 'connecting'"
                />

                <BLESensorCard
                    title="Heart Rate"
                    :value="heartRate ?? '--'"
                    unit="bpm"
                    icon="❤️"
                    color="red"
                    :loading="connectionState === 'connecting'"
                />
            </div>

            <!-- Bottom Row: Services Explorer and Data Stream -->
            <div class="grid gap-4 md:grid-cols-2">
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
