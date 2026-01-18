<script setup lang="ts">
import { ref } from "vue"

const is_menu_open = ref(false)

function toggleMenu() {
    is_menu_open.value = !is_menu_open.value
}

function closeMenu() {
    is_menu_open.value = false
}
</script>

<template>
    <header class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="container flex h-14 max-w-screen-2xl items-center mx-auto px-4">
            <a href="/" class="flex items-center mr-4">
                <img src="/carboncopy-logo.svg" alt="carboncopy" class="h-5" />
            </a>
            <div class="flex flex-1 items-center justify-end">
                <!-- Desktop Navigation -->
                <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
                    <a href="#features" class="transition-colors hover:text-foreground/80 text-muted-foreground">Features</a>
                    <a href="#demo" class="transition-colors hover:text-foreground/80 text-muted-foreground">Demo</a>
                    <a href="https://docs.carboncopy.dev/" class="transition-colors hover:text-foreground/80 text-muted-foreground">Docs</a>
                </nav>
                <div class="hidden md:block ml-4">
                    <a
                        href="https://github.com/artouc/carboncopy"
                        target="_blank"
                        rel="noreferrer"
                        class="btn btn-outline h-9 px-4 py-2"
                    >
                        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        GitHub
                    </a>
                </div>

                <!-- Mobile Menu Button -->
                <button
                    @click="toggleMenu"
                    class="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Toggle menu"
                >
                    <svg v-if="!is_menu_open" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Mobile Navigation -->
        <div
            v-show="is_menu_open"
            class="md:hidden border-t border-border/40 bg-background/95 backdrop-blur"
        >
            <nav class="container max-w-screen-2xl mx-auto px-4 py-4 flex flex-col gap-4">
                <a
                    href="#features"
                    @click="closeMenu"
                    class="text-sm font-medium transition-colors hover:text-foreground/80 text-muted-foreground py-2"
                >
                    Features
                </a>
                <a
                    href="#demo"
                    @click="closeMenu"
                    class="text-sm font-medium transition-colors hover:text-foreground/80 text-muted-foreground py-2"
                >
                    Demo
                </a>
                <a
                    href="https://docs.carboncopy.dev/"
                    class="text-sm font-medium transition-colors hover:text-foreground/80 text-muted-foreground py-2"
                >
                    Docs
                </a>
                <a
                    href="https://github.com/artouc/carboncopy"
                    target="_blank"
                    rel="noreferrer"
                    class="btn btn-outline h-9 px-4 py-2 w-fit"
                >
                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                </a>
            </nav>
        </div>
    </header>
</template>
