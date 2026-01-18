<script setup lang="ts">
</script>

<template>
    <div class="fixed inset-0 z-0 pointer-events-none flex items-center justify-center bg-background">
        <div
            class="absolute inset-0 opacity-40"
            :style="{
                backgroundImage: `
                    linear-gradient(to right, var(--color-border) 1px, transparent 1px),
                    linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)
                `,
                backgroundSize: '4rem 4rem',
                maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
            }"
        />
        <div
            class="absolute inset-0 opacity-15"
            :style="{
                backgroundImage: 'radial-gradient(circle, var(--color-foreground) 1px, transparent 1px)',
                backgroundSize: '1rem 1rem',
                maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 90%)'
            }"
        />
    </div>
</template>
