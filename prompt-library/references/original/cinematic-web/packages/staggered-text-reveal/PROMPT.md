<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# 電影片頭分段文字揭示｜Staggered Text Reveal

## 可替換變數

- 品牌／主題：{{BRAND_OR_SUBJECT}}
- 主要訊息：{{PRIMARY_MESSAGE}}
- 主要行動：{{PRIMARY_ACTION}}
- 內容段落或媒體：{{CONTENT_ITEMS}}
- 色彩與字體限制：{{BRAND_TOKENS}}
- 目標框架：{{TARGET_STACK}}

## 任務

為 {{BRAND_OR_SUBJECT}} 製作一個「電影片頭分段文字揭示」成果。單一工作是：讓一句核心宣言按語意節拍逐段出現。適合 片頭、案例研究段落與品牌宣言；不適合 長篇正文或需要快速掃讀的操作介面。視覺方向採用「16mm 電影片頭、裁切字窗與可讀 timecode」，但需把內容、品牌與媒體視為可替換資料，不可鎖死成示範版型。

## 結構與動畫時間線

使用 section.title-card、timecode、三個 data-line 片語、摘要與重新播放按鈕；原文在 DOM 中保持連續且可由輔助科技閱讀。

先顯示 timecode，再以 90ms 間隔揭示三個片語；總長不超過 1.4 秒，最後顯示摘要與控制。

## 互動與裝置

按鈕可重新播放，Enter 與 Space 等價；畫面進入可視區時只自動播放一次。桌面、觸控與鍵盤都必須有可理解且等價的操作；hover 不得是唯一入口。430px 起可讀，1200px 與 1920px 不得以任意放大遮蔽資訊。所有互動控制必須有可見 focus 樣式、語意名稱與合理 tab 順序。

## 無障礙與 reduced motion

使用語意 HTML、足夠對比、可選取文字與清楚的狀態回饋。偵測 prefers-reduced-motion: reduce 時，停用視差、磁吸、平滑插值、逐格播放與大幅位移，改為靜態構圖、短淡入或直接完成狀態；功能與內容不可消失。

## 效能、清理與 fallback

以 CSS transform／clip-path 與一次性 class 切換完成；禁止為每個字元建立永久 observer 或 timer。所有 requestAnimationFrame、timer、observer、pointer／scroll listener 與 WebGL 資源都要集中註冊；離開可視區、元件 unmount、頁面切換或 iframe recycle 時完整停止並移除。功能偵測失敗時顯示可讀的靜態 poster，不得留下空白區域或無限 loading。

## 離線與路徑

正式 Atlas Preview 必須使用相對路徑並在 file:// 下開啟，不使用 CDN、遠端字型、遠端圖片、外部 iframe、analytics 或 API。若來源專案需要 npm 相依，鎖定精確版本並提供不需伺服器的同設計靜態 Preview；不得把 static export 說成已驗證 file://，必須實際測試。

## 驗收標準

1. 核心互動與「以語意片語而非逐字碎裂的遮罩揭示」可辨識，且不是其他套件換色複製。
2. 430／1200／1366／1920px 無水平溢位，文字、控制與主要構圖不重疊。
3. 鍵盤、觸控、reduced-motion 與靜態 fallback 均可完成主要工作。
4. Preview 無網路請求；Direct Use 的 Prompt、來源與成果路徑均存在且可開啟。
5. recycle 或離開頁面後無殘留 RAF、timer、observer、音訊或 WebGL context。

## 禁止事項

不得複製第三方 showcase、品牌、影像、模型或文案；不得使用遠端素材、授權不明檔案、空白 placeholder、不可清理的全域 listener，或讓動畫套件取得 Atlas host page 的 scroll ownership。
