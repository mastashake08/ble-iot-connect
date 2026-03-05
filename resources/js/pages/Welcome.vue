<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3'
import { dashboard, login, register } from '@/routes'
import { ref, onMounted } from 'vue'

withDefaults(
    defineProps<{
        canRegister: boolean
    }>(),
    {
        canRegister: true,
    }
)

const animatedStats = ref([
    { value: 0, target: 99, suffix: '%', label: 'Connection Success' },
    { value: 0, target: 50, suffix: 'ms', label: 'Avg Response Time' },
    { value: 0, target: 1000, suffix: '+', label: 'Messages/sec' },
])

onMounted(() => {
    // Animate numbers on mount
    animatedStats.value.forEach((stat, index) => {
        const duration = 2000
        const steps = 60
        const increment = stat.target / steps
        let current = 0

        const timer = setInterval(() => {
            current += increment
            if (current >= stat.target) {
                stat.value = stat.target
                clearInterval(timer)
            } else {
                stat.value = Math.floor(current)
            }
        }, duration / steps)
    })
})
</script>

<template>
    <Head title="Welcome - BLE IoT Connect">
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    </Head>
    
    <!-- Black & Green Tech Landing Page -->
    <div class="min-h-screen bg-black text-white">
        <!-- Animated Background Grid -->
        <div class="fixed inset-0 overflow-hidden opacity-20">
            <div class="absolute inset-0" style="background-image: linear-gradient(rgba(34, 197, 94, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.2) 1px, transparent 1px); background-size: 50px 50px;"></div>
        </div>

        <!-- Navigation -->
        <nav class="relative z-10 border-b border-green-500/20 bg-black/50 backdrop-blur-sm">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="flex h-20 items-center justify-between">
                    <!-- Logo -->
                    <div class="flex items-center space-x-3">
                        <div class="relative">
                            <div class="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                <svg class="h-6 w-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
                                </svg>
                            </div>
                            <div class="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold text-white">BLE IoT <span class="text-green-500">Connect</span></h1>
                            <p class="text-xs text-gray-400">Web Bluetooth Platform</p>
                        </div>
                    </div>

                    <!-- Auth Buttons -->
                    <div class="flex items-center gap-4">
                        <Link
                            v-if="$page.props.auth.user"
                            :href="dashboard()"
                            class="rounded-lg border border-green-500 bg-green-500 px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-green-400 hover:shadow-lg hover:shadow-green-500/50"
                        >
                            Dashboard
                        </Link>
                        <template v-else>
                            <Link
                                :href="login()"
                                class="rounded-lg border border-green-500/30 px-6 py-2.5 text-sm font-semibold text-green-500 transition-all hover:border-green-500 hover:bg-green-500/10"
                            >
                                Log in
                            </Link>
                            <Link
                                v-if="canRegister"
                                :href="register()"
                                class="rounded-lg border border-green-500 bg-green-500 px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-green-400 hover:shadow-lg hover:shadow-green-500/50"
                            >
                                Get Started
                            </Link>
                        </template>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="relative z-10 px-4 py-20 sm:px-6 lg:px-8">
            <div class="mx-auto max-w-7xl">
                <div class="text-center">
                    <!-- Badge -->
                    <div class="mb-8 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-500">
                        <span class="relative flex h-2 w-2">
                            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                            <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                        </span>
                        Web Bluetooth API Powered
                    </div>

                    <!-- Heading -->
                    <h2 class="mb-6 text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
                        Connect IoT Devices
                        <br />
                        <span class="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                            Directly in Browser
                        </span>
                    </h2>

                    <!-- Description -->
                    <p class="mx-auto mb-12 max-w-3xl text-xl text-gray-400">
                        A powerful Laravel & Vue application leveraging the <span class="text-green-500 font-semibold">Web Bluetooth API</span> 
                        to connect, monitor, and control BLE devices in real-time. No native apps required – just open your browser.
                    </p>

                    <!-- CTA Buttons -->
                    <div class="flex flex-wrap items-center justify-center gap-4">
                        <Link
                            :href="$page.props.auth.user ? dashboard() : register()"
                            class="group relative overflow-hidden rounded-lg border-2 border-green-500 bg-green-500 px-8 py-4 text-lg font-bold text-black transition-all hover:shadow-2xl hover:shadow-green-500/50"
                        >
                            <span class="relative z-10">Start Connecting Now</span>
                            <div class="absolute inset-0 -z-0 bg-gradient-to-r from-green-400 to-green-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
                        </Link>
                        <a
                            href="https://github.com/mastashake08/ble-iot-connect"
                            target="_blank"
                            class="rounded-lg border-2 border-green-500/30 bg-black px-8 py-4 text-lg font-bold text-green-500 transition-all hover:border-green-500 hover:bg-green-500/10"
                        >
                            View on GitHub
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <!-- Stats -->
        <section class="relative z-10 border-y border-green-500/20 bg-black/50 backdrop-blur-sm py-12">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 gap-8 sm:grid-cols-3">
                    <div
                        v-for="(stat, index) in animatedStats"
                        :key="index"
                        class="text-center"
                    >
                        <div class="mb-2 text-4xl font-bold text-green-500">
                            {{ stat.value }}{{ stat.suffix }}
                        </div>
                        <div class="text-sm text-gray-400">{{ stat.label }}</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section class="relative z-10 px-4 py-20 sm:px-6 lg:px-8">
            <div class="mx-auto max-w-7xl">
                <div class="mb-16 text-center">
                    <h3 class="mb-4 text-4xl font-bold text-white">
                        Powerful Features
                    </h3>
                    <p class="text-xl text-gray-400">
                        Everything you need to build advanced BLE applications
                    </p>
                </div>

                <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <!-- Feature 1 -->
                    <div class="group relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-gray-900 to-black p-8 transition-all hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/20">
                        <div class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                            <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h4 class="mb-3 text-xl font-bold text-white">Real-Time Streaming</h4>
                        <p class="text-gray-400">
                            Built-in ReadableStream & WritableStream support for efficient, low-latency data flow between your devices and application.
                        </p>
                    </div>

                    <!-- Feature 2 -->
                    <div class="group relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-gray-900 to-black p-8 transition-all hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/20">
                        <div class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                            <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                        </div>
                        <h4 class="mb-3 text-xl font-bold text-white">Full GATT Discovery</h4>
                        <p class="text-gray-400">
                            Automatically discover all services, characteristics, and descriptors. Browse and interact with any BLE device capability.
                        </p>
                    </div>

                    <!-- Feature 3 -->
                    <div class="group relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-gray-900 to-black p-8 transition-all hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/20">
                        <div class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                            <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h4 class="mb-3 text-xl font-bold text-white">Web Workers</h4>
                        <p class="text-gray-400">
                            Off-main-thread data processing ensures smooth UI performance. Parse and analyze BLE data without blocking interactions.
                        </p>
                    </div>

                    <!-- Feature 4 -->
                    <div class="group relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-gray-900 to-black p-8 transition-all hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/20">
                        <div class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                            <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <h4 class="mb-3 text-xl font-bold text-white">Beautiful Dashboard</h4>
                        <p class="text-gray-400">
                            Stunning Vue components with Tailwind CSS. Monitor sensors, view real-time data streams, and control devices with style.
                        </p>
                    </div>

                    <!-- Feature 5 -->
                    <div class="group relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-gray-900 to-black p-8 transition-all hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/20">
                        <div class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                            <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h4 class="mb-3 text-xl font-bold text-white">Type-Safe</h4>
                        <p class="text-gray-400">
                            Comprehensive TypeScript definitions for Web Bluetooth API. Catch errors early with full IDE support and autocomplete.
                        </p>
                    </div>

                    <!-- Feature 6 -->
                    <div class="group relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-gray-900 to-black p-8 transition-all hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/20">
                        <div class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                            <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <h4 class="mb-3 text-xl font-bold text-white">High Performance</h4>
                        <p class="text-gray-400">
                            Optimized for speed with characteristic caching, lazy loading, and smart reconnection strategies for reliable connections.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- How It Works -->
        <section class="relative z-10 border-t border-green-500/20 bg-black/50 backdrop-blur-sm px-4 py-20 sm:px-6 lg:px-8">
            <div class="mx-auto max-w-7xl">
                <div class="mb-16 text-center">
                    <h3 class="mb-4 text-4xl font-bold text-white">
                        How It Works
                    </h3>
                    <p class="text-xl text-gray-400">
                        Connect to your devices in three simple steps
                    </p>
                </div>

                <div class="grid gap-12 md:grid-cols-3">
                    <!-- Step 1 -->
                    <div class="relative">
                        <div class="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-2xl font-bold text-black">
                            1
                        </div>
                        <h4 class="mb-3 text-2xl font-bold text-white">Pair Device</h4>
                        <p class="text-gray-400">
                            Click "Connect Device" in the dashboard. Your browser will show available BLE devices. Select your device to pair securely.
                        </p>
                    </div>

                    <!-- Step 2 -->
                    <div class="relative">
                        <div class="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-2xl font-bold text-black">
                            2
                        </div>
                        <h4 class="mb-3 text-2xl font-bold text-white">Explore Services</h4>
                        <p class="text-gray-400">
                            Automatically discover all GATT services and characteristics. Browse capabilities, read values, and write commands.
                        </p>
                    </div>

                    <!-- Step 3 -->
                    <div class="relative">
                        <div class="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-2xl font-bold text-black">
                            3
                        </div>
                        <h4 class="mb-3 text-2xl font-bold text-white">Monitor & Control</h4>
                        <p class="text-gray-400">
                            Subscribe to real-time notifications, view live sensor data, and control your device directly from your browser dashboard.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Tech Stack -->
        <section class="relative z-10 px-4 py-20 sm:px-6 lg:px-8">
            <div class="mx-auto max-w-7xl">
                <div class="mb-16 text-center">
                    <h3 class="mb-4 text-4xl font-bold text-white">
                        Built with Modern Tech
                    </h3>
                    <p class="text-xl text-gray-400">
                        Powered by industry-leading frameworks and APIs
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-8 md:grid-cols-4">
                    <!-- Laravel -->
                    <div class="flex flex-col items-center rounded-xl border border-green-500/20 bg-gradient-to-br from-gray-900 to-black p-6 text-center transition-all hover:border-green-500/50">
                        <div class="mb-4 text-5xl">🔺</div>
                        <h5 class="mb-2 font-bold text-white">Laravel 12</h5>
                        <p class="text-sm text-gray-400">Backend Framework</p>
                    </div>

                    <!-- Vue -->
                    <div class="flex flex-col items-center rounded-xl border border-green-500/20 bg-gradient-to-br from-gray-900 to-black p-6 text-center transition-all hover:border-green-500/50">
                        <div class="mb-4 text-5xl">💚</div>
                        <h5 class="mb-2 font-bold text-white">Vue 3</h5>
                        <p class="text-sm text-gray-400">Frontend Framework</p>
                    </div>

                    <!-- TypeScript -->
                    <div class="flex flex-col items-center rounded-xl border border-green-500/20 bg-gradient-to-br from-gray-900 to-black p-6 text-center transition-all hover:border-green-500/50">
                        <div class="mb-4 text-5xl">🔷</div>
                        <h5 class="mb-2 font-bold text-white">TypeScript</h5>
                        <p class="text-sm text-gray-400">Type Safety</p>
                    </div>

                    <!-- Tailwind -->
                    <div class="flex flex-col items-center rounded-xl border border-green-500/20 bg-gradient-to-br from-gray-900 to-black p-6 text-center transition-all hover:border-green-500/50">
                        <div class="mb-4 text-5xl">🎨</div>
                        <h5 class="mb-2 font-bold text-white">Tailwind CSS</h5>
                        <p class="text-sm text-gray-400">Styling</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="relative z-10 border-t border-green-500/20 bg-gradient-to-br from-gray-900 to-black px-4 py-20 sm:px-6 lg:px-8">
            <div class="mx-auto max-w-4xl text-center">
                <h3 class="mb-6 text-4xl font-bold text-white sm:text-5xl">
                    Ready to Connect?
                </h3>
                <p class="mb-10 text-xl text-gray-400">
                    Start building your BLE IoT applications today with our powerful platform.
                </p>
                <div class="flex flex-wrap items-center justify-center gap-4">
                    <Link
                        :href="$page.props.auth.user ? dashboard() : register()"
                        class="group relative overflow-hidden rounded-lg border-2 border-green-500 bg-green-500 px-10 py-4 text-lg font-bold text-black transition-all hover:shadow-2xl hover:shadow-green-500/50"
                    >
                        <span class="relative z-10">Get Started Free</span>
                        <div class="absolute inset-0 -z-0 bg-gradient-to-r from-green-400 to-green-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
                    </Link>
                    <a
                        href="https://webbluetoothcg.github.io/web-bluetooth/"
                        target="_blank"
                        class="rounded-lg border-2 border-green-500/30 bg-black px-10 py-4 text-lg font-bold text-green-500 transition-all hover:border-green-500 hover:bg-green-500/10"
                    >
                        Learn More
                    </a>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="relative z-10 border-t border-green-500/20 bg-black/50 backdrop-blur-sm px-4 py-8">
            <div class="mx-auto max-w-7xl">
                <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <div class="flex items-center space-x-2 text-sm text-gray-400">
                        <span>© 2026 BLE IoT Connect</span>
                        <span>•</span>
                        <span>Built with ❤️ and caffeine</span>
                    </div>
                    <div class="flex gap-6">
                        <a href="https://github.com/mastashake08/ble-iot-connect" target="_blank" class="text-gray-400 transition-colors hover:text-green-500">
                            GitHub
                        </a>
                        <a href="https://laravel.com/docs" target="_blank" class="text-gray-400 transition-colors hover:text-green-500">
                            Laravel Docs
                        </a>
                        <a href="https://vuejs.org" target="_blank" class="text-gray-400 transition-colors hover:text-green-500">
                            Vue Docs
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>
