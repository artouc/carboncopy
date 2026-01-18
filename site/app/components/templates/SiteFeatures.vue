<script setup lang="ts">
const features = [
    {
        icon: "scan-line",
        title: "ピクセルパーフェクト",
        description: "getBoundingClientRectを使用し、ブラウザのレイアウト計算結果をそのままPDFに変換。CSSレイアウトを完全に再現します。"
    },
    {
        icon: "type",
        title: "日本語完全対応",
        description: "CIDフォント埋め込みによる日本語テキストの正確な描画を実現。生成されたPDFのテキストはコピー＆ペースト可能です。"
    },
    {
        icon: "table",
        title: "テーブル・リスト",
        description: "複雑なテーブルレイアウトやリストマーカーも正確に再現。border-collapseやcolspan/rowspanも期待通りに動作します。"
    },
    {
        icon: "image",
        title: "画像埋め込み",
        description: "JPEG/PNG画像のネイティブ埋め込みに対応。透明度（アルファチャンネル）や解像度の指定も柔軟に行えます。"
    },
    {
        icon: "feather",
        title: "軽量・依存最小",
        description: "ブラウザのみで動作し、Puppeteerなどの重い依存関係は不要。バンドルサイズを最小限に抑えています。"
    },
    {
        icon: "settings",
        title: "柔軟なAPI",
        description: "シンプルな高レベルAPIと、詳細な制御が可能なローレベルAPIの両方を提供。用途に応じて使い分けられます。"
    }
]
</script>

<template>
    <section id="features" class="py-24 bg-accent/30 border-y border-border relative z-10">
        <div class="container px-4 md:px-6 mx-auto">
            <div class="text-center max-w-2xl mx-auto mb-16">
                <h2 class="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Why carboncopy?</h2>
                <p class="text-muted-foreground text-lg">
                    既存のソリューションで抱えていたレイアウト崩れや日本語フォントの問題を解決するために設計されました。
                </p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div
                    v-for="(feature, index) in features"
                    :key="index"
                    class="group relative p-6 bg-background rounded-xl border border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
                >
                    <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                    <div class="relative">
                        <div class="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                            <!-- ScanLine icon -->
                            <svg v-if="feature.icon === 'scan-line'" class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                                <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                                <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                                <path d="M7 12h10"/>
                            </svg>
                            <!-- Type icon -->
                            <svg v-else-if="feature.icon === 'type'" class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="4 7 4 4 20 4 20 7"/>
                                <line x1="9" y1="20" x2="15" y2="20"/>
                                <line x1="12" y1="4" x2="12" y2="20"/>
                            </svg>
                            <!-- Table icon -->
                            <svg v-else-if="feature.icon === 'table'" class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 3v18"/>
                                <rect width="18" height="18" x="3" y="3" rx="2"/>
                                <path d="M3 9h18"/>
                                <path d="M3 15h18"/>
                            </svg>
                            <!-- Image icon -->
                            <svg v-else-if="feature.icon === 'image'" class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                <circle cx="9" cy="9" r="2"/>
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                            </svg>
                            <!-- Feather icon -->
                            <svg v-else-if="feature.icon === 'feather'" class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z"/>
                                <path d="M16 8 2 22"/>
                                <path d="M17.5 15H9"/>
                            </svg>
                            <!-- Settings icon -->
                            <svg v-else-if="feature.icon === 'settings'" class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </div>
                        <h3 class="text-xl font-bold mb-2">{{ feature.title }}</h3>
                        <p class="text-muted-foreground leading-relaxed">
                            {{ feature.description }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
