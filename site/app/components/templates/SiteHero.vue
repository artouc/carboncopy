<script setup lang="ts">
const features_list = [
    "Pixel Perfect",
    "No Puppeteer",
    "Full Japanese Support"
]
</script>

<template>
    <section class="relative z-10 pt-24 pb-32 md:pt-32 md:pb-48 overflow-hidden">
        <div class="container px-4 md:px-6 mx-auto relative">
            <div class="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
                <div
                    class="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-foreground opacity-0 animate-fade-in"
                >
                    v0.1.0 is now available
                </div>

                <h1
                    class="text-4xl font-extrabold tracking-tight lg:text-6xl text-primary opacity-0 animate-fade-in animation-delay-100"
                >
                    高精度なHTML→PDF変換を <br class="hidden md:block" />
                    <span class="text-muted-foreground">ブラウザだけで実現。</span>
                </h1>

                <p
                    class="text-xl text-muted-foreground max-w-[700px] leading-relaxed opacity-0 animate-fade-in animation-delay-200"
                >
                    位置・サイズ・スタイルを正確に再現するHTML→PDF変換ライブラリ。<br/>
                    getBoundingClientRectを使用し、ブラウザのレイアウト計算結果をそのままPDFに変換します。
                </p>

                <div
                    class="flex flex-col sm:flex-row items-center gap-4 mt-4 opacity-0 animate-fade-in animation-delay-300"
                >
                    <a
                        href="https://docs.carboncopy.dev/getting-started"
                        class="btn btn-primary h-10 px-8"
                    >
                        Get Started
                        <svg class="ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12h14"/>
                            <path d="m12 5 7 7-7 7"/>
                        </svg>
                    </a>
                    <a
                        href="https://docs.carboncopy.dev/"
                        class="btn btn-outline h-10 px-8"
                    >
                        Read Documentation
                    </a>
                </div>

                <div
                    class="pt-8 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground opacity-0 animate-fade-in animation-delay-500"
                >
                    <div
                        v-for="feature in features_list"
                        :key="feature"
                        class="flex items-center gap-2"
                    >
                        <svg class="h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>{{ feature }}</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
