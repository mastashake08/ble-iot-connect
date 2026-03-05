/**
 * BLE Data Processing Worker
 * Handles heavy data parsing and processing off the main thread
 */

import { type WorkerMessage, type WorkerResponse } from '@/types/bluetooth'

// Worker State
const dataBuffer: Map<string, ArrayBuffer[]> = new Map()
const statistics: Map<string, { count: number; avgSize: number; lastProcessed: number }> = new Map()

// Message Handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, data, metadata } = event.data

  try {
    let result: unknown

    switch (type) {
      case 'parse':
        result = await parseData(data, metadata)
        break
      case 'process':
        result = await processData(data, metadata)
        break
      case 'analyze':
        result = await analyzeData(data, metadata)
        break
      default:
        throw new Error(`Unknown message type: ${type}`)
    }

    const response: WorkerResponse = {
      id,
      success: true,
      result,
    }

    self.postMessage(response)
  } catch (error) {
    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }

    self.postMessage(response)
  }
}

/**
 * Parse raw BLE data based on metadata configuration
 */
async function parseData(data: unknown, metadata?: Record<string, unknown>): Promise<unknown> {
  if (!data) {
    throw new Error('No data provided for parsing')
  }

  const format = metadata?.format as string || 'binary'
  const endianness = metadata?.endianness as 'little' | 'big' || 'little'

  // Convert to DataView if needed
  let dataView: DataView
  if (data instanceof DataView) {
    dataView = data
  } else if (data instanceof ArrayBuffer) {
    dataView = new DataView(data)
  } else {
    throw new Error('Data must be ArrayBuffer or DataView')
  }

  switch (format) {
    case 'utf8':
      return parseUTF8(dataView)
    case 'utf16':
      return parseUTF16(dataView)
    case 'hex':
      return parseHex(dataView)
    case 'int8':
      return dataView.getInt8(0)
    case 'uint8':
      return dataView.getUint8(0)
    case 'int16':
      return dataView.getInt16(0, endianness === 'little')
    case 'uint16':
      return dataView.getUint16(0, endianness === 'little')
    case 'int32':
      return dataView.getInt32(0, endianness === 'little')
    case 'uint32':
      return dataView.getUint32(0, endianness === 'little')
    case 'float32':
      return dataView.getFloat32(0, endianness === 'little')
    case 'float64':
      return dataView.getFloat64(0, endianness === 'little')
    case 'battery':
      return parseBatteryLevel(dataView)
    case 'temperature':
      return parseTemperature(dataView)
    case 'humidity':
      return parseHumidity(dataView)
    case 'heartRate':
      return parseHeartRate(dataView)
    case 'binary':
    default:
      return parseBinary(dataView)
  }
}

/**
 * Process and aggregate data over time
 */
async function processData(data: unknown, metadata?: Record<string, unknown>): Promise<unknown> {
  const deviceId = metadata?.deviceId as string || 'unknown'
  
  if (data instanceof ArrayBuffer) {
    // Add to buffer
    if (!dataBuffer.has(deviceId)) {
      dataBuffer.set(deviceId, [])
    }
    dataBuffer.get(deviceId)!.push(data)

    // Update statistics
    const stats = statistics.get(deviceId) || { count: 0, avgSize: 0, lastProcessed: Date.now() }
    stats.count++
    stats.avgSize = (stats.avgSize * (stats.count - 1) + data.byteLength) / stats.count
    stats.lastProcessed = Date.now()
    statistics.set(deviceId, stats)

    // Process buffer if it exceeds threshold
    const bufferSize = dataBuffer.get(deviceId)!.length
    if (bufferSize > 100) {
      return await flushBuffer(deviceId)
    }
  }

  return { processed: true, bufferSize: dataBuffer.get(deviceId)?.length || 0 }
}

/**
 * Analyze data patterns and statistics
 */
async function analyzeData(data: unknown, metadata?: Record<string, unknown>): Promise<unknown> {
  const deviceId = metadata?.deviceId as string || 'unknown'
  const stats = statistics.get(deviceId)

  if (!stats) {
    return { error: 'No statistics available for device' }
  }

  const bufferData = dataBuffer.get(deviceId) || []
  
  return {
    deviceId,
    totalMessages: stats.count,
    averageSize: Math.round(stats.avgSize),
    bufferedMessages: bufferData.length,
    lastProcessed: new Date(stats.lastProcessed).toISOString(),
    dataRate: calculateDataRate(deviceId),
  }
}

/**
 * Flush buffer and return aggregated data
 */
async function flushBuffer(deviceId: string): Promise<unknown> {
  const buffer = dataBuffer.get(deviceId)
  if (!buffer || buffer.length === 0) {
    return { flushed: 0 }
  }

  const totalBytes = buffer.reduce((sum, ab) => sum + ab.byteLength, 0)
  dataBuffer.set(deviceId, [])

  return {
    flushed: buffer.length,
    totalBytes,
    timestamp: Date.now(),
  }
}

/**
 * Calculate data rate in bytes per second
 */
function calculateDataRate(deviceId: string): number {
  const stats = statistics.get(deviceId)
  if (!stats) return 0

  const timeDiff = (Date.now() - stats.lastProcessed) / 1000
  if (timeDiff === 0) return 0

  return Math.round(stats.avgSize / timeDiff)
}

// Parsing helpers

function parseUTF8(dataView: DataView): string {
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(dataView.buffer)
}

function parseUTF16(dataView: DataView): string {
  const decoder = new TextDecoder('utf-16')
  return decoder.decode(dataView.buffer)
}

function parseHex(dataView: DataView): string {
  const bytes = new Uint8Array(dataView.buffer)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function parseBinary(dataView: DataView): number[] {
  const bytes = new Uint8Array(dataView.buffer)
  return Array.from(bytes)
}

function parseBatteryLevel(dataView: DataView): number {
  // Battery level is typically a single uint8 (0-100)
  return dataView.getUint8(0)
}

function parseTemperature(dataView: DataView): number {
  // Temperature often encoded as int16 in celsius * 100
  const raw = dataView.getInt16(0, true)
  return raw / 100
}

function parseHumidity(dataView: DataView): number {
  // Humidity often encoded as uint16 * 100
  const raw = dataView.getUint16(0, true)
  return raw / 100
}

function parseHeartRate(dataView: DataView): { heartRate: number; energyExpended?: number } {
  // Heart rate measurement format (complex format with flags)
  const flags = dataView.getUint8(0)
  const heartRateValueFormat = flags & 0x01
  
  let heartRate: number
  let offset = 1

  if (heartRateValueFormat === 0) {
    // UINT8 format
    heartRate = dataView.getUint8(offset)
    offset += 1
  } else {
    // UINT16 format
    heartRate = dataView.getUint16(offset, true)
    offset += 2
  }

  // Energy expended present?
  const energyExpendedPresent = flags & 0x08
  let energyExpended: number | undefined

  if (energyExpendedPresent && dataView.byteLength >= offset + 2) {
    energyExpended = dataView.getUint16(offset, true)
  }

  return { heartRate, energyExpended }
}

// Export type for TypeScript
export type {}
