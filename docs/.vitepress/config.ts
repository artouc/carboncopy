import { defineConfig } from "vitepress"

export default defineConfig({
    title: "carboncopy",
    description: "High-precision HTML to PDF converter",
    lang: "ja-JP",

    head: [
        ["link", { rel: "icon", href: "/favicon.ico" }]
    ],

    cleanUrls: true,

    themeConfig: {
        logo: {
            src: "/carboncopy-logo.svg",
            alt: "carboncopy"
        },
        siteTitle: false,
        nav: [
            { text: "ガイド", link: "/guide/" },
            { text: "API", link: "/api/" },
            { text: "Examples", link: "/examples/" },
        ],

        sidebar: {
            "/guide/": [
                {
                    text: "はじめに",
                    items: [
                        { text: "Introduction", link: "/guide/" },
                        { text: "Getting Started", link: "/guide/getting-started" },
                    ]
                },
                {
                    text: "フォント",
                    items: [
                        { text: "PDF標準フォント", link: "/guide/standard-fonts" },
                        { text: "日本語フォント", link: "/guide/japanese-fonts" },
                    ]
                },
                {
                    text: "描画",
                    items: [
                        { text: "テキスト描画", link: "/guide/text-rendering" },
                        { text: "画像埋め込み", link: "/guide/images" },
                        { text: "テーブル", link: "/guide/tables" },
                    ]
                },
                {
                    text: "その他",
                    items: [
                        { text: "プログラムでPDF生成", link: "/guide/basic-usage" },
                    ]
                }
            ],
            "/api/": [
                {
                    text: "HTML to PDF",
                    items: [
                        { text: "convert()", link: "/api/html-to-pdf" },
                    ]
                },
                {
                    text: "Low-level API",
                    items: [
                        { text: "PDFDocument", link: "/api/pdf-document" },
                        { text: "PDFPage", link: "/api/pdf-page" },
                    ]
                }
            ]
        },

        socialLinks: [
            { icon: "github", link: "https://github.com/artouc/carboncopy" }
        ],

        footer: {
            message: "Released under the MIT License.",
            copyright: "Copyright (c) Arata Ouchi (Original SIN Architecture)"
        }
    }
})
