/**
 * BLE Utility Functions
 * Helper functions for working with Web Bluetooth API
 */

import {
  type BluetoothError,
  type BluetoothErrorType,
  type BLEService,
  type BLECharacteristic,
  type BLEDescriptor,
  type CharacteristicProperties,
  GATT_SERVICES,
  GATT_CHARACTERISTICS,
} from '@/types/bluetooth'

/**
 * Check if Web Bluetooth is available in the current browser
 */
export async function isBluetoothAvailable(): Promise<boolean> {
  if (!navigator.bluetooth) {
    return false
  }

  try {
    return await navigator.bluetooth.getAvailability()
  } catch {
    return false
  }
}

/**
 * Create a standardized Bluetooth error
 */
export function createBluetoothError(
  error: Error,
  deviceId?: string
): BluetoothError {
  let type: BluetoothErrorType = 'UnknownError'

  if (error.name === 'SecurityError') {
    type = 'SecurityError'
  } else if (error.name === 'NotFoundError') {
    type = 'NotFoundError'
  } else if (error.name === 'NetworkError') {
    type = 'NetworkError'
  } else if (error.name === 'NotSupportedError') {
    type = 'NotSupportedError'
  } else if (error.name === 'InvalidStateError') {
    type = 'InvalidStateError'
  }

  return {
    type,
    message: error.message,
    deviceId,
    timestamp: new Date(),
    originalError: error,
  }
}

/**
 * Get human-readable name for a service UUID
 */
export function getServiceName(uuid: string): string {
  const normalizedUuid = normalizeUUID(uuid)
  
  const serviceNames: Record<string, string> = {
    [GATT_SERVICES.BATTERY_SERVICE]: 'Battery Service',
    [GATT_SERVICES.DEVICE_INFORMATION]: 'Device Information',
    [GATT_SERVICES.HEART_RATE]: 'Heart Rate',
    [GATT_SERVICES.ENVIRONMENTAL_SENSING]: 'Environmental Sensing',
    [GATT_SERVICES.GENERIC_ACCESS]: 'Generic Access',
    [GATT_SERVICES.GENERIC_ATTRIBUTE]: 'Generic Attribute',
  }

  return serviceNames[normalizedUuid] || `Service ${shortenUUID(uuid)}`
}

/**
 * Get human-readable name for a characteristic UUID
 */
export function getCharacteristicName(uuid: string): string {
  const normalizedUuid = normalizeUUID(uuid)
  
  const characteristicNames: Record<string, string> = {
    [GATT_CHARACTERISTICS.BATTERY_LEVEL]: 'Battery Level',
    [GATT_CHARACTERISTICS.MANUFACTURER_NAME]: 'Manufacturer Name',
    [GATT_CHARACTERISTICS.MODEL_NUMBER]: 'Model Number',
    [GATT_CHARACTERISTICS.SERIAL_NUMBER]: 'Serial Number',
    [GATT_CHARACTERISTICS.FIRMWARE_REVISION]: 'Firmware Revision',
    [GATT_CHARACTERISTICS.HARDWARE_REVISION]: 'Hardware Revision',
    [GATT_CHARACTERISTICS.HEART_RATE_MEASUREMENT]: 'Heart Rate',
    [GATT_CHARACTERISTICS.TEMPERATURE]: 'Temperature',
    [GATT_CHARACTERISTICS.HUMIDITY]: 'Humidity',
  }

  return characteristicNames[normalizedUuid] || `Characteristic ${shortenUUID(uuid)}`
}

/**
 * Normalize UUID to full 128-bit format
 */
export function normalizeUUID(uuid: string): string {
  // Already full UUID
  if (uuid.length === 36) {
    return uuid.toLowerCase()
  }

  // 16-bit UUID (e.g., "180f")
  if (uuid.length === 4) {
    return `0000${uuid}-0000-1000-8000-00805f9b34fb`.toLowerCase()
  }

  // 32-bit UUID (e.g., "0000180f")
  if (uuid.length === 8) {
    return `${uuid}-0000-1000-8000-00805f9b34fb`.toLowerCase()
  }

  return uuid.toLowerCase()
}

/**
 * Shorten UUID for display (show only unique part)
 */
export function shortenUUID(uuid: string): string {
  const normalized = normalizeUUID(uuid)
  
  // If it's a standard Bluetooth UUID, extract the 16-bit part
  if (normalized.endsWith('-0000-1000-8000-00805f9b34fb')) {
    return '0x' + normalized.substring(4, 8).toUpperCase()
  }

  // For custom UUIDs, show first 8 characters
  return normalized.substring(0, 8).toUpperCase()
}

/**
 * Parse characteristic properties from BluetoothRemoteGATTCharacteristic
 */
export function parseCharacteristicProperties(
  characteristic: BluetoothRemoteGATTCharacteristic
): CharacteristicProperties {
  return {
    broadcast: characteristic.properties.broadcast,
    read: characteristic.properties.read,
    writeWithoutResponse: characteristic.properties.writeWithoutResponse,
    write: characteristic.properties.write,
    notify: characteristic.properties.notify,
    indicate: characteristic.properties.indicate,
    authenticatedSignedWrites: characteristic.properties.authenticatedSignedWrites,
    reliableWrite: characteristic.properties.reliableWrite,
    writableAuxiliaries: characteristic.properties.writableAuxiliaries,
  }
}

/**
 * Discover all GATT services and characteristics
 */
export async function discoverGATT(
  server: BluetoothRemoteGATTServer
): Promise<BLEService[]> {
  const services: BLEService[] = []

  try {
    const gattServices = await server.getPrimaryServices()
    
    if (gattServices.length === 0) {
      throw new Error(
        'No services found. Make sure to specify the services you want to access in "optionalServices" when connecting.'
      )
    }

    for (const service of gattServices) {
      const characteristics: BLECharacteristic[] = []

      try {
        const gattCharacteristics = await service.getCharacteristics()

        for (const characteristic of gattCharacteristics) {
          const descriptors: BLEDescriptor[] = []

          try {
            const gattDescriptors = await characteristic.getDescriptors()
            
            for (const descriptor of gattDescriptors) {
              descriptors.push({
                uuid: descriptor.uuid,
                name: getDescriptorName(descriptor.uuid),
              })
            }
          } catch (error) {
            console.warn('Failed to get descriptors:', error)
          }

          characteristics.push({
            uuid: characteristic.uuid,
            name: getCharacteristicName(characteristic.uuid),
            serviceUuid: service.uuid,
            properties: parseCharacteristicProperties(characteristic),
            descriptors,
          })
        }
      } catch (error) {
        console.warn('Failed to get characteristics:', error)
      }

      services.push({
        uuid: service.uuid,
        name: getServiceName(service.uuid),
        isPrimary: service.isPrimary,
        characteristics,
      })
    }
    
    if (services.length === 0) {
      throw new Error(
        'No services could be accessed. Ensure services are listed in "optionalServices" during connection.'
      )
    }
  } catch (error) {
    console.error('Failed to discover GATT:', error)
    throw error
  }

  return services
}

/**
 * Get human-readable name for a descriptor UUID
 */
export function getDescriptorName(uuid: string): string {
  const normalizedUuid = normalizeUUID(uuid)
  
  const descriptorNames: Record<string, string> = {
    '00002900-0000-1000-8000-00805f9b34fb': 'Characteristic Extended Properties',
    '00002901-0000-1000-8000-00805f9b34fb': 'Characteristic User Description',
    '00002902-0000-1000-8000-00805f9b34fb': 'Client Characteristic Configuration',
    '00002903-0000-1000-8000-00805f9b34fb': 'Server Characteristic Configuration',
    '00002904-0000-1000-8000-00805f9b34fb': 'Characteristic Presentation Format',
    '00002905-0000-1000-8000-00805f9b34fb': 'Characteristic Aggregate Format',
  }

  return descriptorNames[normalizedUuid] || `Descriptor ${shortenUUID(uuid)}`
}

/**
 * Convert DataView to hex string for display
 */
export function dataViewToHex(dataView: DataView): string {
  const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ')
    .toUpperCase()
}

/**
 * Convert DataView to UTF-8 string
 */
export function dataViewToString(dataView: DataView): string {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false })
    const uint8Array = new Uint8Array(
      dataView.buffer,
      dataView.byteOffset,
      dataView.byteLength
    )
    return decoder.decode(uint8Array)
  } catch (error) {
    console.error('Failed to decode string:', error)
    return dataViewToHex(dataView) // Fallback to hex
  }
}

/**
 * Try to parse DataView as JSON
 */
export function dataViewToJSON(dataView: DataView): unknown {
  try {
    const str = dataViewToString(dataView)
    // Try to parse as JSON
    return JSON.parse(str)
  } catch (error) {
    // If not valid JSON, return the string representation
    const str = dataViewToString(dataView)
    // Check if it looks like a number
    const num = Number(str)
    if (!isNaN(num) && str.trim() !== '') {
      return num
    }
    return str
  }
}

/**
 * Convert string to ArrayBuffer for writing
 */
export function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder()
  return encoder.encode(str).buffer
}

/**
 * Convert hex string to ArrayBuffer
 */
export function hexToArrayBuffer(hex: string): ArrayBuffer {
  const hexString = hex.replace(/\s/g, '')
  const bytes = new Uint8Array(hexString.length / 2)
  
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16)
  }
  
  return bytes.buffer
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Get battery level from characteristic value
 */
export function parseBatteryLevel(dataView: DataView): number {
  return dataView.getUint8(0)
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
      }
    }
  }

  throw lastError || new Error('All retry attempts failed')
}

/**
 * Validate if device supports required services
 */
export function validateDeviceServices(
  services: BLEService[],
  requiredServiceUuids: string[]
): boolean {
  const serviceUuids = services.map(s => normalizeUUID(s.uuid))
  return requiredServiceUuids.every(uuid => 
    serviceUuids.includes(normalizeUUID(uuid))
  )
}
