# BLE IoT Connect - Web Bluetooth Implementation

A comprehensive Web Bluetooth implementation for Laravel/Vue applications with real-time data streaming, Web Workers for performance optimization, and stylish UI components.

## 🎯 Features

- ✅ **Full GATT Discovery** - Automatically discovers all services and characteristics
- ✅ **Streaming API** - Uses `ReadableStream` and `WritableStream` for efficient data flow
- ✅ **Web Workers** - Off-main-thread data processing for optimal performance
- ✅ **Real-time Updates** - Live sensor data display with notifications
- ✅ **Stylish UI** - Beautiful, responsive card-based interface
- ✅ **Type-Safe** - Full TypeScript support with comprehensive type definitions
- ✅ **Error Handling** - Robust error boundaries and recovery mechanisms

## 📁 Project Structure

```
resources/js/
├── types/
│   ├── bluetooth.ts           # BLE type definitions
│   └── web-bluetooth.d.ts     # Web Bluetooth API types
├── lib/
│   └── bluetooth/
│       ├── utils.ts           # BLE utility functions
│       ├── ble-worker.ts      # Web Worker for data processing
│       └── index.ts           # Barrel export
├── composables/
│   └── bluetooth/
│       ├── useBLEDevice.ts    # Device connection management
│       ├── useBLEStream.ts    # Stream-based data handling
│       ├── useBLEWorker.ts    # Worker management
│       └── index.ts           # Barrel export
├── components/
│   ├── BLEDeviceCard.vue      # Device connection card
│   ├── BLESensorCard.vue      # Sensor data display card
│   ├── BLEServicesExplorer.vue # GATT services explorer
│   └── BLEDataStream.vue      # Real-time data stream viewer
└── pages/
    └── Dashboard.vue          # Main dashboard with BLE integration
```

## 🚀 Getting Started

### Prerequisites

- Modern browser with Web Bluetooth support (Chrome, Edge, Opera)
- HTTPS or localhost (Web Bluetooth requires secure context)
- BLE device with GATT services

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
php artisan serve
```

### Browser Compatibility

Web Bluetooth is supported in:
- ✅ Chrome 56+
- ✅ Edge 79+
- ✅ Opera 43+
- ❌ Firefox (behind flag)
- ❌ Safari (not supported)

## 💻 Usage

### Basic Connection

```typescript
import { useBLEDevice } from '@/composables/bluetooth'

const {
  device,
  deviceInfo,
  connectionState,
  services,
  error,
  connect,
  disconnect,
} = useBLEDevice()

// Connect to device
await connect(
  {
    services: ['battery_service'], // Optional filters
  },
  {
    discoverAllServices: true,
    autoReconnect: true,
  }
)

// Disconnect
await disconnect()
```

### Reading Characteristics

```typescript
const { readCharacteristic } = useBLEDevice()

// Read battery level
const value = await readCharacteristic(
  '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
  '00002a19-0000-1000-8000-00805f9b34fb'  // Battery Level
)

const batteryLevel = value.getUint8(0)
```

### Writing Characteristics

```typescript
const { writeCharacteristic } = useBLEDevice()

// Write data to characteristic
const data = new Uint8Array([0x01, 0x02, 0x03])
await writeCharacteristic(serviceUuid, characteristicUuid, data.buffer)
```

### Subscribing to Notifications

```typescript
const { subscribeToNotifications } = useBLEDevice()

// Subscribe to characteristic changes
await subscribeToNotifications(
  serviceUuid,
  characteristicUuid,
  (data: DataView) => {
    console.log('Notification received:', data)
  }
)
```

### Using Streams

```typescript
import { useBLEStream } from '@/composables/bluetooth'

const { readable, startReading, stopReading } = useBLEStream(device.value)

// Start reading as a stream
await startReading(serviceUuid, characteristicUuid)

// Process stream data
const reader = readable.value?.getReader()
while (true) {
  const { done, value } = await reader!.read()
  if (done) break
  
  console.log('Stream data:', value)
}
```

### Using Web Worker

```typescript
import { useBLEWorker } from '@/composables/bluetooth'

const { parseData, processData, analyzeData } = useBLEWorker()

// Parse BLE data in worker
const parsed = await parseData(
  dataView.buffer,
  'temperature',
  { deviceId: device.id }
)

// Process data over time
await processData(dataView.buffer, { deviceId: device.id })

// Analyze accumulated data
const stats = await analyzeData({ deviceId: device.id })
```

## 🧩 Components

### BLEDeviceCard

Device connection status and control.

```vue
<BLEDeviceCard
  :device="deviceInfo"
  :connection-state="connectionState"
  :battery-level="75"
  :signal-strength="85"
  @connect="handleConnect"
  @disconnect="handleDisconnect"
/>
```

### BLESensorCard

Display individual sensor readings.

```vue
<BLESensorCard
  title="Temperature"
  :value="25.5"
  unit="°C"
  icon="🌡️"
  color="orange"
  trend="up"
  trend-value="+1.2°C"
/>
```

### BLEServicesExplorer

Interactive GATT services and characteristics browser.

```vue
<BLEServicesExplorer
  :services="services"
  @read-characteristic="handleRead"
  @write-characteristic="handleWrite"
  @subscribe-characteristic="handleSubscribe"
/>
```

### BLEDataStream

Real-time data stream viewer with HEX/String/JSON modes.

```vue
<BLEDataStream
  ref="dataStreamRef"
  title="Real-time Data"
  :max-entries="50"
/>

<!-- In script -->
dataStreamRef.value?.addData(dataView, parsedData)
```

## 🔧 Utility Functions

### UUID Handling

```typescript
import { normalizeUUID, shortenUUID, getServiceName } from '@/lib/bluetooth/utils'

// Normalize 16-bit to 128-bit UUID
const fullUuid = normalizeUUID('180f') 
// '0000180f-0000-1000-8000-00805f9b34fb'

// Shorten for display
const shortUuid = shortenUUID(fullUuid) // '0x180F'

// Get human-readable name
const name = getServiceName(fullUuid) // 'Battery Service'
```

### Data Conversion

```typescript
import { 
  dataViewToHex, 
  dataViewToString,
  stringToArrayBuffer,
  hexToArrayBuffer 
} from '@/lib/bluetooth/utils'

// Convert DataView to hex string
const hex = dataViewToHex(dataView) // '01 02 03 FF'

// Convert DataView to UTF-8 string
const str = dataViewToString(dataView)

// Convert string to ArrayBuffer for writing
const buffer = stringToArrayBuffer('Hello')

// Convert hex string to ArrayBuffer
const buffer2 = hexToArrayBuffer('01 02 03')
```

### GATT Discovery

```typescript
import { discoverGATT } from '@/lib/bluetooth/utils'

// Discover all services and characteristics
const services = await discoverGATT(device.gatt!)

services.forEach(service => {
  console.log(`Service: ${service.name}`)
  service.characteristics.forEach(char => {
    console.log(`  - ${char.name} (${char.properties})`)
  })
})
```

## 📊 Data Processing

### Supported Formats

The Web Worker supports parsing various data formats:

- `binary` - Raw byte array
- `hex` - Hexadecimal string
- `utf8` / `utf16` - Text strings
- `int8` / `uint8` - 8-bit integers
- `int16` / `uint16` - 16-bit integers
- `int32` / `uint32` - 32-bit integers
- `float32` / `float64` - Floating point
- `battery` - Battery level (0-100)
- `temperature` - Temperature in Celsius
- `humidity` - Humidity percentage
- `heartRate` - Heart rate measurement

### Custom Parsers

```typescript
await parseData(dataView.buffer, 'custom', {
  customParser: (data: DataView) => {
    // Your custom parsing logic
    return {
      value: data.getInt16(0, true),
      timestamp: Date.now()
    }
  }
})
```

## 🎨 Styling

All components use Tailwind CSS v4 with dark mode support. Colors are customizable via props:

- `blue` - Primary actions
- `green` - Success/connected states
- `purple` - Notifications
- `orange` - Warnings
- `red` - Errors/disconnected

## 🔐 Security

### Requirements

1. **HTTPS Required** - Web Bluetooth only works on HTTPS (or localhost)
2. **User Gesture** - Device pairing must be triggered by user interaction
3. **Permission Prompts** - Browser shows permission dialog before connecting

### Best Practices

- Always validate device characteristics before operations
- Sanitize all data received from BLE devices
- Implement timeouts for long-running operations
- Handle disconnection gracefully with reconnection logic

## 🐛 Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `SecurityError` | Not HTTPS or user denied | Use HTTPS, request user permission |
| `NotFoundError` | No device selected | User must select device from dialog |
| `NetworkError` | Device disconnected | Implement reconnection logic |
| `NotSupportedError` | Feature not available | Check device capabilities |

## 🧪 Testing

```bash
# Type checking
npm run types:check

# Linting
npm run lint

# PHP tests
php artisan test
```

## 📚 References

- [Web Bluetooth API Specification](https://webbluetoothcg.github.io/web-bluetooth/)
- [GATT Specifications](https://www.bluetooth.com/specifications/specs/)
- [MDN Web Bluetooth Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
