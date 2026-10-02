<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# 軌道工坊捲動釘選敘事｜GSAP Pin Section

## 可替換變數

- 品牌／主題：{{BRAND_OR_SUBJECT}}
- 主要訊息：{{PRIMARY_MESSAGE}}
- 主要行動：{{PRIMARY_ACTION}}
- 內容段落或媒體：{{CONTENT_ITEMS}}
- 色彩與字體限制：{{BRAND_TOKENS}}
- 目標框架：{{TARGET_STACK}}

## 任務

為 {{BRAND_OR_SUBJECT}} 製作一個「軌道工坊捲動釘選敘事」成果。單一工作是：把四個製造階段固定在同一視窗中依序解說。適合 製程、產品拆解與時間線敘事；不適合 內容不足三段或需要快速跳讀的頁面。視覺方向採用「太空載具工坊、工程藍圖與琥珀警示標記」，但需把內容、品牌與媒體視為可替換資料，不可鎖死成示範版型。

## 結構與動畫時間線

建立 intro、pin-stage、四個 chapter marker、進度軌與 outro；來源版本使用 GSAP 3.15.0＋ScrollTrigger，Preview 使用同構的原生 sticky fallback。

進入段落後 pin 3.5 個 viewport；每 25% 切換一章，標題、剖面層與進度同步；離開時完整解除。

## 互動與裝置

原生 wheel／touch／PageDown 驅動章節，章節按鈕可鍵盤跳轉，禁止攔截 host scroll。桌面、觸控與鍵盤都必須有可理解且等價的操作；hover 不得是唯一入口。430px 起可讀，1200px 與 1920px 不得以任意放大遮蔽資訊。所有互動控制必須有可見 focus 樣式、語意名稱與合理 tab 順序。

## 無障礙與 reduced motion

使用語意 HTML、足夠對比、可選取文字與清楚的狀態回饋。偵測 prefers-reduced-motion: reduce 時，停用視差、磁吸、平滑插值、逐格播放與大幅位移，改為靜態構圖、短淡入或直接完成狀態；功能與內容不可消失。

## 效能、清理與 fallback

來源以 gsap.context 與 matchMedia 管理，refresh 只在尺寸改變，cleanup 必須 kill timeline、ScrollTrigger 與 listener。所有 requestAnimationFrame、timer、observer、pointer／scroll listener 與 WebGL 資源都要集中註冊；離開可視區、元件 unmount、頁面切換或 iframe recycle 時完整停止並移除。功能偵測失敗時顯示可讀的靜態 poster，不得留下空白區域或無限 loading。

## 離線與路徑

正式 Atlas Preview 必須使用相對路徑並在 file:// 下開啟，不使用 CDN、遠端字型、遠端圖片、外部 iframe、analytics 或 API。若來源專案需要 npm 相依，鎖定精確版本並提供不需伺服器的同設計靜態 Preview；不得把 static export 說成已驗證 file://，必須實際測試。

## 驗收標準

1. 核心互動與「固定在中央的機體剖面會隨章節逐層組裝」可辨識，且不是其他套件換色複製。
2. 430／1200／1366／1920px 無水平溢位，文字、控制與主要構圖不重疊。
3. 鍵盤、觸控、reduced-motion 與靜態 fallback 均可完成主要工作。
4. Preview 無網路請求；Direct Use 的 Prompt、來源與成果路徑均存在且可開啟。
5. recycle 或離開頁面後無殘留 RAF、timer、observer、音訊或 WebGL context。

## 禁止事項

不得複製第三方 showcase、品牌、影像、模型或文案；不得使用遠端素材、授權不明檔案、空白 placeholder、不可清理的全域 listener，或讓動畫套件取得 Atlas host page 的 scroll ownership。
