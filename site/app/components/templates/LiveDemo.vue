<script setup lang="ts">
import { ref, computed } from "vue"

type TemplateKey = "invoice" | "report" | "receipt" | "certificate" | "ticket" | "code"

const active_tab = ref<TemplateKey>("invoice")
const is_converting = ref(false)
const preview_ref = ref<HTMLDivElement | null>(null)
const toast_message = ref("")
const show_toast = ref(false)

const templates: Record<TemplateKey, { name: string; icon: string; html: string }> = {
    invoice: {
        name: "Invoice",
        icon: "receipt",
        html: `<div style="padding: 40px; font-family: Helvetica, sans-serif; width: 500px; background: white;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
            <h1 style="color: #1e40af; margin: 0; font-size: 32px;">INVOICE</h1>
            <p style="color: #64748b; margin: 5px 0 0;">#INV-2024-001</p>
        </div>
        <div style="text-align: right;">
            <p style="margin: 0; font-weight: bold;">carboncopy Inc.</p>
            <p style="margin: 5px 0; color: #64748b; font-size: 14px;">1-2-3 Tech District</p>
            <p style="margin: 0; color: #64748b; font-size: 14px;">Tokyo, Japan 100-0000</p>
        </div>
    </div>
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0 0 5px; font-size: 14px;"><strong>Bill To:</strong></p>
        <p style="margin: 0; font-size: 14px;">Acme Corp. / John Doe</p>
    </div>
    <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #1e293b; color: white;">
            <th style="padding: 12px; text-align: left;">Item</th>
            <th style="padding: 12px; text-align: right;">Qty</th>
            <th style="padding: 12px; text-align: right;">Price</th>
            <th style="padding: 12px; text-align: right;">Total</th>
        </tr>
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Premium Plan</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">1</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">¥5,000</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">¥5,000</td>
        </tr>
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Additional Users</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">3</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">¥1,000</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">¥3,000</td>
        </tr>
        <tr style="font-weight: bold; background: #f1f5f9;">
            <td colspan="3" style="padding: 12px; text-align: right;">Total (Tax incl.)</td>
            <td style="padding: 12px; text-align: right; color: #1e40af;">¥8,800</td>
        </tr>
    </table>
</div>`
    },
    report: {
        name: "Report",
        icon: "file-text",
        html: `<div style="padding: 40px; font-family: Georgia, serif; width: 550px; background: white;">
    <h1 style="color: #1a1a1a; border-bottom: 3px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 20px;">
        Quarterly Report
    </h1>
    <p style="color: #666; font-size: 14px; margin-bottom: 30px;">Q4 2025 | Financial Overview</p>
    <h2 style="color: #333; font-size: 18px; margin-bottom: 15px;">1. Executive Summary</h2>
    <p style="line-height: 1.8; color: #444; margin-bottom: 25px;">
        当四半期の業績は予想を大きく上回り、特に新規顧客獲得において顕著な成果を上げました。
        市場の変動にも関わらず、当社の製品ラインナップは堅調な需要を維持しています。
    </p>
    <div style="background: #e0f2fe; padding: 15px; border-left: 4px solid #0284c7; margin-bottom: 25px;">
        <strong>Key Highlight:</strong> 前年同期比で売上が 125% 増加し、営業利益率は過去最高を記録しました。
    </div>
    <h2 style="color: #333; font-size: 18px; margin-bottom: 15px;">2. Key Metrics</h2>
    <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #f5f5f5;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Metric</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Q3</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Q4</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Change</th>
        </tr>
        <tr>
            <td style="padding: 12px; border: 1px solid #ddd;">Revenue</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">$2.4M</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">$2.95M</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: green;">+23%</td>
        </tr>
        <tr>
            <td style="padding: 12px; border: 1px solid #ddd;">Users</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">8,200</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">9,700</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: green;">+18%</td>
        </tr>
    </table>
</div>`
    },
    receipt: {
        name: "Receipt",
        icon: "scroll",
        html: `<div style="width: 280px; padding: 20px; font-family: Courier, monospace; background: white; font-size: 12px;">
    <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 15px;">
        <h2 style="margin: 0; font-size: 18px;">COFFEE SHOP</h2>
        <p style="margin: 5px 0 0; font-size: 11px;">123 Main Street</p>
        <p style="margin: 2px 0;">Tel: (555) 123-4567</p>
    </div>
    <p style="margin: 0 0 10px;">Date: 2026-01-18 14:32</p>
    <p style="margin: 0 0 15px;">Order #: 0847</p>
    <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Latte (L)</span>
            <span>$4.50</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Croissant</span>
            <span>$3.25</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Muffin</span>
            <span>$2.75</span>
        </div>
    </div>
    <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span>Subtotal</span>
            <span>$10.50</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span>Tax (8%)</span>
            <span>$0.84</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px;">
            <span>TOTAL</span>
            <span>$11.34</span>
        </div>
    </div>
    <div style="text-align: center; border-top: 2px dashed #000; padding-top: 15px;">
        <p style="margin: 0 0 5px;">Thank you!</p>
        <p style="margin: 0; font-size: 10px;">Have a great day!</p>
    </div>
</div>`
    },
    certificate: {
        name: "Certificate",
        icon: "award",
        html: `<div style="width: 550px; padding: 40px; font-family: Georgia, serif; text-align: center; background: linear-gradient(to bottom, #fffbeb, #fef3c7); border: 6px double #b45309;">
    <div style="border: 2px solid #b45309; padding: 30px;">
        <p style="color: #92400e; font-size: 12px; letter-spacing: 3px; margin: 0 0 8px;">CERTIFICATE OF</p>
        <h1 style="color: #78350f; font-size: 36px; margin: 0 0 25px; font-weight: normal;">Achievement</h1>
        <p style="color: #666; margin: 0 0 8px;">This is to certify that</p>
        <h2 style="color: #1a1a1a; font-size: 28px; margin: 0 0 8px; font-style: italic;">Jane Doe</h2>
        <p style="color: #666; margin: 0 0 25px;">has successfully completed the course</p>
        <h3 style="color: #78350f; font-size: 20px; margin: 0 0 25px; font-weight: normal;">
            Advanced Web Development
        </h3>
        <p style="color: #666; font-size: 14px; margin: 0 0 30px;">
            Awarded on January 18, 2026
        </p>
        <div style="display: flex; justify-content: space-around; margin-top: 25px;">
            <div>
                <div style="border-top: 2px solid #78350f; width: 120px; margin-bottom: 5px;"></div>
                <p style="margin: 0; font-size: 11px; color: #666;">Instructor</p>
            </div>
            <div>
                <div style="border-top: 2px solid #78350f; width: 120px; margin-bottom: 5px;"></div>
                <p style="margin: 0; font-size: 11px; color: #666;">Director</p>
            </div>
        </div>
    </div>
</div>`
    },
    ticket: {
        name: "Ticket",
        icon: "ticket",
        html: `<div style="width: 380px; font-family: Helvetica, sans-serif; background: #1a1a1a; color: white; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 20px;">
        <p style="margin: 0 0 5px; font-size: 11px; opacity: 0.9;">LIVE CONCERT</p>
        <h1 style="margin: 0; font-size: 24px;">Summer Music Festival</h1>
    </div>
    <div style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <div>
                <p style="margin: 0 0 5px; font-size: 10px; color: #888;">DATE</p>
                <p style="margin: 0; font-size: 14px;">July 15, 2026</p>
            </div>
            <div>
                <p style="margin: 0 0 5px; font-size: 10px; color: #888;">TIME</p>
                <p style="margin: 0; font-size: 14px;">7:00 PM</p>
            </div>
            <div>
                <p style="margin: 0 0 5px; font-size: 10px; color: #888;">GATE</p>
                <p style="margin: 0; font-size: 14px;">A</p>
            </div>
        </div>
        <div style="background: #333; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <p style="margin: 0 0 3px; font-size: 10px; color: #888;">SEAT</p>
                    <p style="margin: 0; font-size: 20px; font-weight: bold;">VIP-42</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0 0 3px; font-size: 10px; color: #888;">PRICE</p>
                    <p style="margin: 0; font-size: 18px; color: #ec4899;">$150</p>
                </div>
            </div>
        </div>
        <div style="text-align: center; padding-top: 12px; border-top: 1px dashed #444;">
            <p style="margin: 0; font-size: 11px; color: #666; font-family: Courier, monospace;">
                TICKET# SMF-2026-00847
            </p>
        </div>
    </div>
</div>`
    },
    code: {
        name: "Code",
        icon: "code",
        html: `<div style="width: 480px; font-family: Courier, monospace; background: #1e1e1e; color: #d4d4d4; border-radius: 8px; overflow: hidden;">
    <div style="background: #323232; padding: 10px 15px; display: flex; align-items: center; gap: 8px;">
        <span style="width: 12px; height: 12px; background: #ff5f56; border-radius: 50%; display: inline-block;"></span>
        <span style="width: 12px; height: 12px; background: #ffbd2e; border-radius: 50%; display: inline-block;"></span>
        <span style="width: 12px; height: 12px; background: #27ca40; border-radius: 50%; display: inline-block;"></span>
        <span style="margin-left: 10px; color: #888; font-size: 12px;">example.ts</span>
    </div>
    <pre style="margin: 0; padding: 20px; font-size: 13px; line-height: 1.6; overflow-x: auto;"><code><span style="color: #c586c0;">import</span> { convert } <span style="color: #c586c0;">from</span> <span style="color: #ce9178;">"@osaxyz/carboncopy"</span>

<span style="color: #6a9955;">// Get the HTML element</span>
<span style="color: #c586c0;">const</span> element = document.<span style="color: #dcdcaa;">getElementById</span>(<span style="color: #ce9178;">"content"</span>)

<span style="color: #6a9955;">// Convert to PDF</span>
<span style="color: #c586c0;">const</span> result = <span style="color: #c586c0;">await</span> <span style="color: #dcdcaa;">convert</span>(element, {
    format: <span style="color: #ce9178;">"auto"</span>,
    info: {
        title: <span style="color: #ce9178;">"My Document"</span>,
        author: <span style="color: #ce9178;">"carboncopy"</span>
    }
})

<span style="color: #6a9955;">// Download the PDF</span>
result.<span style="color: #dcdcaa;">download</span>(<span style="color: #ce9178;">"document.pdf"</span>)</code></pre>
</div>`
    }
}

const current_html = computed(() => templates[active_tab.value].html)

function showToast(message: string) {
    toast_message.value = message
    show_toast.value = true
    setTimeout(() => {
        show_toast.value = false
    }, 3000)
}

async function handleConvert() {
    if (!preview_ref.value) return

    is_converting.value = true

    try {
        const { convert } = await import("@osaxyz/carboncopy")
        const result = await convert(preview_ref.value, {
            format: "auto",
            background: true,
            info: {
                title: templates[active_tab.value].name
            }
        })
        result.download(`${active_tab.value}.pdf`)
        showToast("PDF generated successfully!")
    } catch (error) {
        console.error("PDF conversion error:", error)
        showToast("Error: PDF conversion failed")
    } finally {
        is_converting.value = false
    }
}
</script>

<template>
    <section id="demo" class="py-24 relative overflow-hidden z-10">
        <div class="container px-4 md:px-6 mx-auto relative">
            <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h2 class="text-3xl font-bold tracking-tight mb-2">Live Demo</h2>
                    <p class="text-muted-foreground">
                        実際のHTML要素がどのようにPDFに変換されるかを確認してください。<br/>
                        「Convert to PDF」ボタンをクリックすると、表示されているプレビューがPDFとしてダウンロードされます。
                    </p>
                </div>

                <!-- Tab Navigation -->
                <div class="flex items-center gap-1 bg-muted p-1 rounded-lg flex-wrap">
                    <button
                        v-for="(tmpl, key) in templates"
                        :key="key"
                        class="px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2"
                        :class="active_tab === key
                            ? 'bg-background shadow text-foreground'
                            : 'text-muted-foreground hover:text-foreground'"
                        @click="active_tab = key"
                    >
                        <!-- Receipt icon -->
                        <svg v-if="tmpl.icon === 'receipt'" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
                            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                            <path d="M12 17.5v-11"/>
                        </svg>
                        <!-- FileText icon -->
                        <svg v-else-if="tmpl.icon === 'file-text'" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                            <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                            <path d="M10 9H8"/>
                            <path d="M16 13H8"/>
                            <path d="M16 17H8"/>
                        </svg>
                        <!-- Scroll icon -->
                        <svg v-else-if="tmpl.icon === 'scroll'" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 17V5a2 2 0 0 0-2-2H4"/>
                            <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>
                        </svg>
                        <!-- Award icon -->
                        <svg v-else-if="tmpl.icon === 'award'" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="8" r="6"/>
                            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                        </svg>
                        <!-- Ticket icon -->
                        <svg v-else-if="tmpl.icon === 'ticket'" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                            <path d="M13 5v2"/>
                            <path d="M13 17v2"/>
                            <path d="M13 11v2"/>
                        </svg>
                        <!-- Code icon -->
                        <svg v-else-if="tmpl.icon === 'code'" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="16 18 22 12 16 6"/>
                            <polyline points="8 6 2 12 8 18"/>
                        </svg>
                        <span class="hidden sm:inline">{{ tmpl.name }}</span>
                    </button>
                </div>
            </div>

            <div class="grid lg:grid-cols-2 gap-8 items-start">
                <!-- Preview Side -->
                <div class="space-y-4">
                    <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden h-[500px] flex flex-col">
                        <div class="border-b border-border bg-muted/30 px-4 py-2 flex items-center justify-between">
                            <span class="text-xs font-mono text-muted-foreground">preview.html</span>
                            <div class="flex gap-1.5">
                                <div class="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                                <div class="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                                <div class="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
                            </div>
                        </div>

                        <!-- Preview content area -->
                        <div class="flex-1 bg-muted/10 p-4 md:p-8 overflow-auto flex items-center justify-center relative">
                            <!-- Dotted pattern background -->
                            <div
                                class="absolute inset-0 z-0 opacity-20 pointer-events-none"
                                :style="{
                                    backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                                    backgroundSize: '10px 10px'
                                }"
                            />

                            <div
                                ref="preview_ref"
                                class="relative z-10 shadow-lg"
                                v-html="current_html"
                            />
                        </div>
                    </div>

                    <div class="flex justify-between items-center text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border">
                        <div class="font-mono">
                            &lt;div id="{{ active_tab }}"&gt;...&lt;/div&gt;
                        </div>
                        <div>{{ templates[active_tab].name }}</div>
                    </div>
                </div>

                <!-- Code / Controls Side -->
                <div class="space-y-6">
                    <div class="rounded-xl border border-border bg-[#0d0d12] text-white shadow-lg overflow-hidden h-[300px] flex flex-col">
                        <div class="border-b border-white/10 bg-white/5 px-4 py-2 flex items-center gap-2">
                            <div class="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                            <div class="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                            <div class="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                            <span class="ml-2 text-xs font-mono text-white/50">main.js</span>
                        </div>
                        <div class="p-4 font-mono text-sm overflow-auto leading-relaxed">
                            <span class="text-purple-400">import</span> { convert } <span class="text-purple-400">from</span> <span class="text-green-400">"@osaxyz/carboncopy"</span>;<br/><br/>
                            <span class="text-white/50">// Select the element</span><br/>
                            <span class="text-purple-400">const</span> <span class="text-blue-400">element</span> = <span class="text-yellow-400">document</span>.<span class="text-blue-300">getElementById</span>(<span class="text-green-400">"{{ active_tab }}"</span>);<br/><br/>
                            <span class="text-white/50">// Convert to PDF</span><br/>
                            <span class="text-purple-400">const</span> <span class="text-blue-400">result</span> = <span class="text-purple-400">await</span> <span class="text-blue-300">convert</span>(<span class="text-blue-400">element</span>, {<br/>
                            &nbsp;&nbsp;<span class="text-blue-300">format</span>: <span class="text-green-400">"auto"</span>,<br/>
                            &nbsp;&nbsp;<span class="text-blue-300">background</span>: <span class="text-orange-400">true</span><br/>
                            });<br/><br/>
                            <span class="text-white/50">// Download</span><br/>
                            <span class="text-blue-400">result</span>.<span class="text-blue-300">download</span>(<span class="text-green-400">"{{ active_tab }}.pdf"</span>);
                        </div>
                    </div>

                    <div>
                        <button
                            class="w-full h-14 rounded-xl btn btn-primary text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                            :disabled="is_converting"
                            @click="handleConvert"
                        >
                            <template v-if="is_converting">
                                <svg class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                </svg>
                                Generating PDF...
                            </template>
                            <template v-else>
                                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" x2="12" y1="15" y2="3"/>
                                </svg>
                                Convert to PDF
                            </template>
                        </button>
                        <p class="mt-3 text-center text-sm text-muted-foreground">
                            Process happens entirely in your browser. No data leaves your device.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toast notification -->
        <Transition
            enter-active-class="transition ease-out duration-300"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-2"
        >
            <div
                v-if="show_toast"
                class="fixed bottom-4 right-4 bg-foreground text-background px-4 py-3 rounded-lg shadow-lg z-50"
            >
                {{ toast_message }}
            </div>
        </Transition>
    </section>
</template>
