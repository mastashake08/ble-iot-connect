/**
 * Bluetooth Types and Interfaces
 * Comprehensive type definitions for Web Bluetooth API
 */

// Connection States
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting'

// Error Types
export type BluetoothErrorType = 
  | 'SecurityError' 
  | 'NotFoundError' 
  | 'NetworkError' 
  | 'NotSupportedError'
  | 'InvalidStateError'
  | 'UnknownError'

// BLE Device Info
export interface BLEDeviceInfo {
  id: string
  name: string | null
  connected: boolean
  rssi?: number
  batteryLevel?: number
  lastSeen: Date
}

// GATT Service
export interface BLEService {
  uuid: string
  name: string
  isPrimary: boolean
  characteristics: BLECharacteristic[]
}

// GATT Characteristic
export interface BLECharacteristic {
  uuid: string
  name: string
  serviceUuid: string
  properties: CharacteristicProperties
  value?: DataView
  descriptors: BLEDescriptor[]
}

// Characteristic Properties
export interface CharacteristicProperties {
  broadcast: boolean
  read: boolean
  writeWithoutResponse: boolean
  write: boolean
  notify: boolean
  indicate: boolean
  authenticatedSignedWrites: boolean
  reliableWrite: boolean
  writableAuxiliaries: boolean
}

// GATT Descriptor
export interface BLEDescriptor {
  uuid: string
  name: string
  value?: DataView
}

// Device Data
export interface DeviceData {
  deviceId: string
  timestamp: Date
  type: string
  value: unknown
  unit?: string
  raw?: ArrayBuffer
}

// Notification Data
export interface NotificationData {
  characteristicUuid: string
  serviceUuid: string
  value: DataView
  timestamp: Date
}

// Stream Message Types
export interface StreamMessage {
  type: 'notification' | 'data' | 'error' | 'status'
  payload: unknown
  timestamp: Date
}

// Worker Message Types
export interface WorkerMessage {
  id: string
  type: 'parse' | 'process' | 'analyze'
  data: ArrayBuffer | DataView | unknown
  metadata?: Record<string, unknown>
}

export interface WorkerResponse {
  id: string
  success: boolean
  result?: unknown
  error?: string
}

// BLE Filter Options
export interface BLEFilterOptions {
  services?: string[]
  name?: string
  namePrefix?: string
  manufacturerData?: { companyIdentifier: number; dataPrefix?: DataView }[]
  serviceData?: { service: string; dataPrefix?: DataView }[]
}

// Connection Options
export interface ConnectionOptions {
  autoReconnect?: boolean
  reconnectDelay?: number
  maxReconnectAttempts?: number
  discoverAllServices?: boolean
  optionalServices?: string[]
}

// Device Discovery Result
export interface DiscoveryResult {
  device: BluetoothDevice
  services: BLEService[]
  characteristics: Map<string, BLECharacteristic>
  timestamp: Date
}

// BLE Manager State
export interface BLEManagerState {
  isAvailable: boolean
  isScanning: boolean
  connectedDevices: Map<string, BLEDeviceInfo>
  connectionState: ConnectionState
  lastError?: BluetoothError
}

// Custom Bluetooth Error
export interface BluetoothError {
  type: BluetoothErrorType
  message: string
  deviceId?: string
  timestamp: Date
  originalError?: Error
}

// Data Parser Configuration
export interface ParserConfig {
  format: 'utf8' | 'utf16' | 'binary' | 'hex' | 'custom'
  endianness?: 'little' | 'big'
  customParser?: (data: DataView) => unknown
}

// Composable Return Types
export interface UseBLEDevice {
  device: Ref<BluetoothDevice | null>
  deviceInfo: Ref<BLEDeviceInfo | null>
  connectionState: Ref<ConnectionState>
  services: Ref<BLEService[]>
  error: Ref<BluetoothError | null>
  connect: (filters?: BLEFilterOptions, options?: ConnectionOptions) => Promise<void>
  disconnect: () => Promise<void>
  discoverServices: () => Promise<BLEService[]>
  readCharacteristic: (serviceUuid: string, characteristicUuid: string) => Promise<DataView>
  writeCharacteristic: (serviceUuid: string, characteristicUuid: string, value: BufferSource) => Promise<void>
  subscribeToNotifications: (serviceUuid: string, characteristicUuid: string, callback: (data: DataView) => void) => Promise<void>
  unsubscribeFromNotifications: (serviceUuid: string, characteristicUuid: string) => Promise<void>
}

export interface UseBLEStream {
  readable: ReadableStream<NotificationData> | null
  writable: WritableStream<BufferSource> | null
  isReading: Ref<boolean>
  isWriting: Ref<boolean>
  startReading: (serviceUuid: string, characteristicUuid: string) => Promise<void>
  stopReading: () => Promise<void>
  write: (data: BufferSource) => Promise<void>
}

// Standard GATT Services (Common UUIDs)
export const GATT_SERVICES = {
  BATTERY_SERVICE: '0000180f-0000-1000-8000-00805f9b34fb',
  DEVICE_INFORMATION: '0000180a-0000-1000-8000-00805f9b34fb',
  HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb',
  ENVIRONMENTAL_SENSING: '0000181a-0000-1000-8000-00805f9b34fb',
  GENERIC_ACCESS: '00001800-0000-1000-8000-00805f9b34fb',
  GENERIC_ATTRIBUTE: '00001801-0000-1000-8000-00805f9b34fb',
} as const

// Standard GATT Characteristics
export const GATT_CHARACTERISTICS = {
  BATTERY_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb',
  MANUFACTURER_NAME: '00002a29-0000-1000-8000-00805f9b34fb',
  MODEL_NUMBER: '00002a24-0000-1000-8000-00805f9b34fb',
  SERIAL_NUMBER: '00002a25-0000-1000-8000-00805f9b34fb',
  FIRMWARE_REVISION: '00002a26-0000-1000-8000-00805f9b34fb',
  HARDWARE_REVISION: '00002a27-0000-1000-8000-00805f9b34fb',
  HEART_RATE_MEASUREMENT: '00002a37-0000-1000-8000-00805f9b34fb',
  TEMPERATURE: '00002a6e-0000-1000-8000-00805f9b34fb',
  HUMIDITY: '00002a6f-0000-1000-8000-00805f9b34fb',
} as const

// Type helper to reference Ref from Vue
import { type Ref } from 'vue'
