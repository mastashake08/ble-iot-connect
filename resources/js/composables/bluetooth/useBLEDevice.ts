/**
 * useBLEDevice Composable
 * Main composable for managing BLE device connections
 */

import { ref, computed, onUnmounted } from 'vue'
import type {
  BLEDeviceInfo,
  BLEService,
  BLEFilterOptions,
  ConnectionOptions,
  ConnectionState,
  BluetoothError,
  UseBLEDevice,
} from '@/types/bluetooth'
import {
  isBluetoothAvailable,
  createBluetoothError,
  discoverGATT,
  normalizeUUID,
} from '@/lib/bluetooth/utils'

export function useBLEDevice(): UseBLEDevice {
  // State
  const device = ref<BluetoothDevice | null>(null)
  const deviceInfo = ref<BLEDeviceInfo | null>(null)
  const connectionState = ref<ConnectionState>('disconnected')
  const services = ref<BLEService[]>([])
  const error = ref<BluetoothError | null>(null)
  
  // Characteristic cache
  const characteristicCache = new Map<string, BluetoothRemoteGATTCharacteristic>()

  // Computed
  const isConnected = computed(() => device.value?.gatt?.connected ?? false)

  /**
   * Connect to a BLE device
   */
  async function connect(
    filters?: BLEFilterOptions,
    options?: ConnectionOptions
  ): Promise<void> {
    error.value = null

    try {
      // Check availability
      const available = await isBluetoothAvailable()
      if (!available) {
        throw new Error('Web Bluetooth is not available in this browser')
      }

      connectionState.value = 'connecting'

      // Request device
      const requestOptions: RequestDeviceOptions = {
        filters: filters?.services
          ? [{ services: filters.services }]
          : [{ acceptAllDevices: true } as any],
        optionalServices: options?.optionalServices || [],
      }

      if (filters?.name) {
        requestOptions.filters = [{ name: filters.name }]
      } else if (filters?.namePrefix) {
        requestOptions.filters = [{ namePrefix: filters.namePrefix }]
      }

      device.value = await navigator.bluetooth!.requestDevice(requestOptions)

      // Set up disconnect handler
      device.value.addEventListener('gattserverdisconnected', handleDisconnect)

      // Connect to GATT server
      const server = await device.value.gatt!.connect()

      // Update device info
      deviceInfo.value = {
        id: device.value.id,
        name: device.value.name,
        connected: true,
        lastSeen: new Date(),
      }

      connectionState.value = 'connected'

      // Discover services if requested
      if (options?.discoverAllServices !== false) {
        await discoverServices()
      }
    } catch (err) {
      const bleError = createBluetoothError(
        err instanceof Error ? err : new Error(String(err)),
        device.value?.id
      )
      error.value = bleError
      connectionState.value = 'disconnected'
      throw bleError
    }
  }

  /**
   * Disconnect from the device
   */
  async function disconnect(): Promise<void> {
    if (!device.value?.gatt?.connected) {
      return
    }

    try {
      connectionState.value = 'disconnecting'
      device.value.gatt.disconnect()
      characteristicCache.clear()
      connectionState.value = 'disconnected'
      
      if (deviceInfo.value) {
        deviceInfo.value.connected = false
      }
    } catch (err) {
      error.value = createBluetoothError(
        err instanceof Error ? err : new Error(String(err)),
        device.value.id
      )
      throw err
    }
  }

  /**
   * Discover all GATT services
   */
  async function discoverServices(): Promise<BLEService[]> {
    if (!device.value?.gatt?.connected) {
      throw new Error('Device not connected')
    }

    try {
      const discoveredServices = await discoverGATT(device.value.gatt)
      services.value = discoveredServices
      return discoveredServices
    } catch (err) {
      error.value = createBluetoothError(
        err instanceof Error ? err : new Error(String(err)),
        device.value.id
      )
      throw err
    }
  }

  /**
   * Read a characteristic value
   */
  async function readCharacteristic(
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<DataView> {
    const characteristic = await getCharacteristic(serviceUuid, characteristicUuid)
    
    try {
      return await characteristic.readValue()
    } catch (err) {
      error.value = createBluetoothError(
        err instanceof Error ? err : new Error(String(err)),
        device.value?.id
      )
      throw err
    }
  }

  /**
   * Write a value to a characteristic
   */
  async function writeCharacteristic(
    serviceUuid: string,
    characteristicUuid: string,
    value: BufferSource
  ): Promise<void> {
    const characteristic = await getCharacteristic(serviceUuid, characteristicUuid)
    
    try {
      await characteristic.writeValue(value)
    } catch (err) {
      error.value = createBluetoothError(
        err instanceof Error ? err : new Error(String(err)),
        device.value?.id
      )
      throw err
    }
  }

  /**
   * Subscribe to characteristic notifications
   */
  async function subscribeToNotifications(
    serviceUuid: string,
    characteristicUuid: string,
    callback: (data: DataView) => void
  ): Promise<void> {
    const characteristic = await getCharacteristic(serviceUuid, characteristicUuid)
    
    try {
      await characteristic.startNotifications()
      
      const handler = (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic
        if (target.value) {
          callback(target.value)
        }
      }
      
      characteristic.addEventListener('characteristicvaluechanged', handler)
    } catch (err) {
      error.value = createBluetoothError(
        err instanceof Error ? err : new Error(String(err)),
        device.value?.id
      )
      throw err
    }
  }

  /**
   * Unsubscribe from characteristic notifications
   */
  async function unsubscribeFromNotifications(
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<void> {
    const characteristic = await getCharacteristic(serviceUuid, characteristicUuid)
    
    try {
      await characteristic.stopNotifications()
      characteristic.removeEventListener('characteristicvaluechanged', () => {})
    } catch (err) {
      error.value = createBluetoothError(
        err instanceof Error ? err : new Error(String(err)),
        device.value?.id
      )
      throw err
    }
  }

  /**
   * Get a characteristic (cached)
   */
  async function getCharacteristic(
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<BluetoothRemoteGATTCharacteristic> {
    if (!device.value?.gatt?.connected) {
      throw new Error('Device not connected')
    }

    const cacheKey = `${normalizeUUID(serviceUuid)}:${normalizeUUID(characteristicUuid)}`
    
    if (characteristicCache.has(cacheKey)) {
      return characteristicCache.get(cacheKey)!
    }

    try {
      const service = await device.value.gatt.getPrimaryService(serviceUuid)
      const characteristic = await service.getCharacteristic(characteristicUuid)
      characteristicCache.set(cacheKey, characteristic)
      return characteristic
    } catch (err) {
      throw new Error(`Failed to get characteristic: ${err}`)
    }
  }

  /**
   * Handle device disconnect
   */
  function handleDisconnect(): void {
    connectionState.value = 'disconnected'
    characteristicCache.clear()
    
    if (deviceInfo.value) {
      deviceInfo.value.connected = false
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (device.value?.gatt?.connected) {
      device.value.gatt.disconnect()
    }
  })

  return {
    device,
    deviceInfo,
    connectionState,
    services,
    error,
    connect,
    disconnect,
    discoverServices,
    readCharacteristic,
    writeCharacteristic,
    subscribeToNotifications,
    unsubscribeFromNotifications,
  }
}
