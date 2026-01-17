import { defineConfig } from "vitepress"

export default defineConfig({
    title: "carboncopy",
    description: "High-precision HTML to PDF converter",
    lang: "ja-JP",

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
                        { text: "Basic Usage", link: "/guide/basic-usage" },
                    ]
                },
                {
                    text: "機能",
                    items: [
                        { text: "PDF標準フォント", link: "/guide/standard-fonts" },
                        { text: "テキスト描画", link: "/guide/text-rendering" },
                        { text: "日本語フォント", link: "/guide/japanese-fonts" },
                        { text: "画像埋め込み", link: "/guide/images" },
                        { text: "テーブル", link: "/guide/tables" },
                    ]
                }
            ],
            "/api/": [
                {
                    text: "API Reference",
                    items: [
                        { text: "Overview", link: "/api/" },
                        { text: "HtmlToPdf", link: "/api/html-to-pdf" },
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
