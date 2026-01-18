import { defineNuxtConfig } from "nuxt/config"

export default defineNuxtConfig({
    // Nuxt 4 compatibility mode
    future: {
        compatibilityVersion: 4,
    },

    compatibilityDate: "2025-01-01",

    devtools: { enabled: true },

    postcss: {
        plugins: {
            "@tailwindcss/postcss": {},
        },
    },

    app: {
        head: {
            htmlAttrs: {
                lang: "ja",
            },
            title: "carboncopy - HTML to PDF クライアントサイドライブラリ",
            meta: [
                { charset: "utf-8" },
                { name: "viewport", content: "width=device-width, initial-scale=1" },
                { name: "description", content: "複雑な要素を含むHTMLを正確にPDFにレンダリングするためのクライアントサイドライブラリ。位置・サイズ・スタイルを正確に再現。" },
            ],
            link: [
                { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
                { rel: "preconnect", href: "https://fonts.googleapis.com" },
                { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
                { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" },
            ],
        },
    },

    css: ["@/assets/css/main.css"],
})
