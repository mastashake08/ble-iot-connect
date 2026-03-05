# BLE IoT Connect - Project Guidelines

## Stack Overview

- **Backend**: Laravel 12 (PHP 8.2+)
- **Frontend**: Vue 3 + TypeScript + Inertia.js
- **Styling**: Tailwind CSS v4
- **Testing**: Pest (PHP), ESLint + TypeScript compiler
- **Key Feature**: Web Bluetooth API for BLE device communication

## Web Bluetooth Architecture

### Core Requirements

All Web Bluetooth code must:

1. **Check browser compatibility** before attempting connections
2. **Implement full GATT discovery** for all connected devices
3. **Handle connection state** (connecting, connected, disconnected)
4. **Properly manage notifications** with characteristic event listeners
5. **Implement error boundaries** for Bluetooth errors (SecurityError, NotFoundError, NetworkError)

### Web Bluetooth Patterns

```typescript
// Always check availability first
const isBluetoothAvailable = await navigator.bluetooth?.getAvailability()

// Request device with appropriate filters
const device = await navigator.bluetooth.requestDevice({
  filters: [{ services: ['service-uuid'] }],
  optionalServices: ['service-uuid'] // For GATT discovery
})

// Connect and discover GATT
const server = await device.gatt?.connect()
const services = await server?.getPrimaryServices()
for (const service of services) {
  const characteristics = await service.getCharacteristics()
  // Process each characteristic
}

// Subscribe to notifications
await characteristic.startNotifications()
characteristic.addEventListener('characteristicvaluechanged', handleNotification)

// Always clean up
device.addEventListener('gattserverdisconnected', handleDisconnect)
```

### Data Handling

- Use `DataView` for parsing binary BLE data
- Convert byte arrays using `TextDecoder` for string data
- Handle endianness explicitly (BLE typically uses little-endian)
- Validate data structure before parsing

### Error Handling

Common Bluetooth errors to handle:

- `SecurityError`: User denied permission or insecure context (non-HTTPS)
- `NotFoundError`: No device selected or device not found
- `NetworkError`: Device disconnected during operation
- `NotSupportedError`: Feature not supported by device

## Code Style

### TypeScript

- Use strict mode type checking
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use explicit return types for public functions
- Async functions must handle rejection with try/catch

### Vue Components

- Use `<script setup lang="ts">` composition API
- Props must have explicit types using `defineProps<Props>()`
- Emit events with `defineEmits<Emits>()`
- Use `ref` for primitive values, `reactive` for objects
- Extract composables for reusable Bluetooth logic (e.g., `useBluetoothDevice`)

### PHP/Laravel

- Follow PSR-12 coding standards
- Use Laravel Pint for formatting: `./vendor/bin/pint`
- Type-hint all parameters and return types
- Use strict types: `declare(strict_types=1);`
- Prefer constructor property promotion

## Testing

### PHP Tests (Pest)

```php
it('does something', function () {
    expect($result)->toBe($expected);
});
```

Run tests: `php artisan test` or `./vendor/bin/pest`

### TypeScript

Run type checking: `npm run types:check`
Run linting: `npm run lint`

## Build and Development

```bash
# Development
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate

# Run dev server
php artisan serve  # Backend
npm run dev        # Frontend with HMR

# Production build
npm run build      # CSR only
npm run build:ssr  # With SSR support
```

## Security Considerations

### Web Bluetooth Security

- Bluetooth is only available in **secure contexts** (HTTPS or localhost)
- User interaction (button click) is required to initiate device pairing
- Always validate device characteristics before read/write operations
- Store device IDs securely if implementing device reconnection
- Sanitize all data received from BLE devices before display

### Laravel Security

- Use `@csrf` in all forms
- Validate all user input with Form Requests
- Use authorization policies for resource access
- Never expose sensitive BLE device data in API responses

## Conventions

### File Organization

- Bluetooth composables: `resources/js/composables/bluetooth/`
- Bluetooth types: `resources/js/types/bluetooth.ts`
- Bluetooth utilities: `resources/js/lib/bluetooth/`
- Backend API controllers: `app/Http/Controllers/`

### Naming

- BLE services/characteristics: Use descriptive names, not UUIDs in UI
- Vue composables: `use*` prefix (e.g., `useBluetoothConnection`)
- Laravel actions: Verb-noun format (e.g., `StoreDeviceReading`)
- Event listeners: `handle*` prefix (e.g., `handleCharacteristicValueChanged`)

### State Management

- Use Inertia.js for SSR page props and shared data
- Use Vue `ref`/`reactive` for local component state
- Use composables for shared Bluetooth connection state
- Store device configurations in Laravel backend

## Common Tasks

### Adding a new BLE characteristic handler

1. Define types in `resources/js/types/bluetooth.ts`
2. Create composable if reusable (e.g., `useHeartRateMonitor`)
3. Add parser in `resources/js/lib/bluetooth/parsers.ts`
4. Update GATT discovery to include new service UUID
5. Add tests for data parsing logic

### Creating API endpoints for device data

1. Create migration for device_readings table
2. Add model in `app/Models/`
3. Create controller with proper validation
4. Define route in `routes/web.php`
5. Write Pest tests in `tests/Feature/`

## References

- [Web Bluetooth API Spec](https://webbluetoothcg.github.io/web-bluetooth/)
- [GATT Specifications](https://www.bluetooth.com/specifications/specs/)
- [Laravel Documentation](https://laravel.com/docs/12.x)
- [Vue 3 Documentation](https://vuejs.org/)
- [Inertia.js Documentation](https://inertiajs.com/)
