<script setup lang="ts">
</script>

<template>
    <footer class="border-t border-border bg-background py-12 md:py-16">
        <div class="container px-4 md:px-6 mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div class="col-span-1 md:col-span-2">
                    <a href="/" class="flex items-center mb-4">
                        <img src="/carboncopy-logo.svg" alt="carboncopy" class="h-5" />
                    </a>
                    <p class="text-muted-foreground max-w-sm">
                        複雑な要素を含むHTMLを正確にPDFにレンダリングするための、クライアントサイドライブラリです。
                    </p>
                </div>

                <div>
                    <h3 class="font-semibold mb-4">Product</h3>
                    <ul class="space-y-3 text-sm text-muted-foreground">
                        <li><a href="#features" class="hover:text-foreground transition-colors">Features</a></li>
                        <li><a href="https://docs.carboncopy.dev/" class="hover:text-foreground transition-colors">Documentation</a></li>
                        <li><a href="https://docs.carboncopy.dev/api/" class="hover:text-foreground transition-colors">API Reference</a></li>
                    </ul>
                </div>

                <div>
                    <h3 class="font-semibold mb-4">Community</h3>
                    <ul class="space-y-3 text-sm text-muted-foreground">
                        <li><a href="https://github.com/artouc/carboncopy" class="hover:text-foreground transition-colors">GitHub</a></li>
                        <li><a href="https://www.npmjs.com/package/@osaxyz/carboncopy" class="hover:text-foreground transition-colors">npm</a></li>
                    </ul>
                </div>
            </div>

            <div class="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
                <p>&copy; Arata Ouchi (Original SIN Architecture). Released under the MIT License.</p>
                <div class="flex gap-4">
                    <a href="https://github.com/artouc/carboncopy/blob/main/LICENSE" class="hover:text-foreground transition-colors">MIT License</a>
                </div>
            </div>
        </div>
    </footer>
</template>
