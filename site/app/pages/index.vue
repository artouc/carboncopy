<script setup lang="ts">
</script>

<template>
    <div class="min-h-screen font-sans text-foreground bg-background selection:bg-primary/10 selection:text-primary">
        <TemplatesDottedBackground />
        <div class="relative z-10 flex flex-col min-h-screen">
            <TemplatesSiteHeader />
            <main class="flex-1">
                <TemplatesSiteHero />
                <TemplatesSiteFeatures />
                <TemplatesLiveDemo />
            </main>
            <TemplatesSiteFooter />
        </div>
    </div>
</template>
