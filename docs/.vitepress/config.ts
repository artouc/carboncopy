import { defineConfig } from "vitepress"

export default defineConfig({
    title: "carboncopy Docs - HTML to PDF クライアントサイドライブラリ",
    description: "複雑な要素を含むHTMLを正確にPDFにレンダリングするためのクライアントサイドライブラリ。位置・サイズ・スタイルを正確に再現。",
    lang: "ja-JP",

    head: [
        ["link", { rel: "icon", href: "/favicon.ico" }],
        ["meta", { property: "og:type", content: "website" }],
        ["meta", { property: "og:title", content: "carboncopy Docs - HTML to PDF クライアントライブラリ" }],
        ["meta", { property: "og:description", content: "複雑な要素を含むHTMLを正確にPDFにレンダリングするためのクライアントサイドライブラリ。位置・サイズ・スタイルを正確に再現。" }],
        ["meta", { property: "og:image", content: "https://docs.carboncopy.dev/Docs-OGP.jpg" }],
        ["meta", { name: "twitter:card", content: "summary_large_image" }],
        ["meta", { name: "twitter:image", content: "https://docs.carboncopy.dev/Docs-OGP.jpg" }],
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
            { text: "Changelog", link: "/changelog" },
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
