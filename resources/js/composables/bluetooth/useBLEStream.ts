/**
 * useBLEStream Composable
 * Stream-based BLE data handling with ReadableStream and WritableStream
 */

import { ref, onUnmounted } from 'vue'
import type { UseBLEStream, NotificationData } from '@/types/bluetooth'

export function useBLEStream(device: BluetoothDevice | null) {
  // State
  const readable = ref<ReadableStream<NotificationData> | null>(null)
  const writable = ref<WritableStream<BufferSource> | null>(null)
  const isReading = ref(false)
  const isWriting = ref(false)

  // Internal state
  let readableController: ReadableStreamDefaultController<NotificationData> | null = null
  let currentCharacteristic: BluetoothRemoteGATTCharacteristic | null = null
  let notificationHandler: ((event: Event) => void) | null = null

  /**
   * Start reading notifications as a ReadableStream
   */
  async function startReading(
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<void> {
    if (!device?.gatt?.connected) {
      throw new Error('Device not connected')
    }

    if (isReading.value) {
      throw new Error('Already reading from stream')
    }

    try {
      // Get service and characteristic
      const service = await device.gatt.getPrimaryService(serviceUuid)
      const characteristic = await service.getCharacteristic(characteristicUuid)
      currentCharacteristic = characteristic

      // Create ReadableStream
      readable.value = new ReadableStream<NotificationData>({
        start(controller) {
          readableController = controller
        },
        cancel() {
          stopReading()
        },
      })

      // Set up notification handler
      notificationHandler = (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic
        if (target.value && readableController) {
          const data: NotificationData = {
            characteristicUuid: target.uuid,
            serviceUuid: target.service.uuid,
            value: target.value,
            timestamp: new Date(),
          }
          readableController.enqueue(data)
        }
      }

      characteristic.addEventListener('characteristicvaluechanged', notificationHandler)
      await characteristic.startNotifications()
      isReading.value = true
    } catch (err) {
      isReading.value = false
      readable.value = null
      throw err
    }
  }

  /**
   * Stop reading notifications
   */
  async function stopReading(): Promise<void> {
    if (!isReading.value || !currentCharacteristic) {
      return
    }

    try {
      if (notificationHandler) {
        currentCharacteristic.removeEventListener(
          'characteristicvaluechanged',
          notificationHandler
        )
      }
      await currentCharacteristic.stopNotifications()
      
      if (readableController) {
        readableController.close()
        readableController = null
      }
      
      isReading.value = false
      readable.value = null
      currentCharacteristic = null
      notificationHandler = null
    } catch (err) {
      console.error('Error stopping notifications:', err)
    }
  }

  /**
   * Create a WritableStream for writing data to a characteristic
   */
  function createWritableStream(
    serviceUuid: string,
    characteristicUuid: string
  ): WritableStream<BufferSource> {
    return new WritableStream<BufferSource>({
      async start() {
        if (!device?.gatt?.connected) {
          throw new Error('Device not connected')
        }
        isWriting.value = true
      },

      async write(chunk) {
        if (!device?.gatt?.connected) {
          throw new Error('Device disconnected during write')
        }

        try {
          const service = await device.gatt.getPrimaryService(serviceUuid)
          const characteristic = await service.getCharacteristic(characteristicUuid)
          await characteristic.writeValue(chunk)
        } catch (err) {
          throw new Error(`Write failed: ${err}`)
        }
      },

      async close() {
        isWriting.value = false
      },

      async abort(reason) {
        isWriting.value = false
        console.error('Stream aborted:', reason)
      },
    })
  }

  /**
   * Write data using a WritableStream
   */
  async function write(
    serviceUuid: string,
    characteristicUuid: string,
    data: BufferSource
  ): Promise<void> {
    if (!device?.gatt?.connected) {
      throw new Error('Device not connected')
    }

    try {
      // Create writable stream if not exists
      if (!writable.value) {
        writable.value = createWritableStream(serviceUuid, characteristicUuid)
      }

      const writer = writable.value.getWriter()
      await writer.write(data)
      writer.releaseLock()
    } catch (err) {
      throw new Error(`Failed to write data: ${err}`)
    }
  }

  // Cleanup
  onUnmounted(() => {
    stopReading()
    if (writable.value) {
      writable.value.close()
    }
  })

  return {
    readable,
    writable,
    isReading,
    isWriting,
    startReading,
    stopReading,
    write,
  }
}
