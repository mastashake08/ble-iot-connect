/**
 * useBLEWorker Composable
 * Manage Web Worker for BLE data processing
 */

import { ref, onUnmounted } from 'vue'
import type { WorkerMessage, WorkerResponse } from '@/types/bluetooth'

export function useBLEWorker() {
  const worker = ref<Worker | null>(null)
  const isProcessing = ref(false)
  const pendingRequests = new Map<string, {
    resolve: (result: unknown) => void
    reject: (error: Error) => void
  }>()

  /**
   * Initialize the worker
   */
  function initWorker(): void {
    if (worker.value) {
      return
    }

    worker.value = new Worker(
      new URL('@/lib/bluetooth/ble-worker.ts', import.meta.url),
      { type: 'module' }
    )

    worker.value.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { id, success, result, error } = event.data
      const pending = pendingRequests.get(id)

      if (pending) {
        if (success) {
          pending.resolve(result)
        } else {
          pending.reject(new Error(error || 'Worker processing failed'))
        }
        pendingRequests.delete(id)
      }

      isProcessing.value = pendingRequests.size > 0
    }

    worker.value.onerror = (event: ErrorEvent) => {
      console.error('Worker error:', event)
      // Reject all pending requests
      pendingRequests.forEach(({ reject }) => {
        reject(new Error('Worker encountered an error'))
      })
      pendingRequests.clear()
      isProcessing.value = false
    }
  }

  /**
   * Send message to worker
   */
  function postMessage(message: WorkerMessage): Promise<unknown> {
    if (!worker.value) {
      initWorker()
    }

    return new Promise((resolve, reject) => {
      pendingRequests.set(message.id, { resolve, reject })
      worker.value!.postMessage(message)
      isProcessing.value = true
    })
  }

  /**
   * Parse data using worker
   */
  async function parseData(
    data: ArrayBuffer | DataView,
    format: string = 'binary',
    metadata?: Record<string, unknown>
  ): Promise<unknown> {
    const message: WorkerMessage = {
      id: crypto.randomUUID(),
      type: 'parse',
      data,
      metadata: { format, ...metadata },
    }

    return await postMessage(message)
  }

  /**
   * Process data using worker
   */
  async function processData(
    data: ArrayBuffer,
    metadata?: Record<string, unknown>
  ): Promise<unknown> {
    const message: WorkerMessage = {
      id: crypto.randomUUID(),
      type: 'process',
      data,
      metadata,
    }

    return await postMessage(message)
  }

  /**
   * Analyze data using worker
   */
  async function analyzeData(
    metadata?: Record<string, unknown>
  ): Promise<unknown> {
    const message: WorkerMessage = {
      id: crypto.randomUUID(),
      type: 'analyze',
      data: new ArrayBuffer(0),
      metadata,
    }

    return await postMessage(message)
  }

  /**
   * Terminate worker
   */
  function terminate(): void {
    if (worker.value) {
      worker.value.terminate()
      worker.value = null
    }
    pendingRequests.clear()
    isProcessing.value = false
  }

  // Cleanup
  onUnmounted(() => {
    terminate()
  })

  return {
    isProcessing,
    parseData,
    processData,
    analyzeData,
    terminate,
  }
}
