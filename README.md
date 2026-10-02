<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# AI Prompt Library

## 繁體中文

AI Prompt Library 是本機優先、可離線搬移的靜態資料庫，提供 5,298 筆完整可用公開內容，來自 16 個固定版本來源；其中 2,380 筆可直接閱讀、複製與下載完整 Prompt。Atlas 同時提供標題／正文搜尋、Related、Compare、隔離 Preview 與 Manifest-bound Download。公開資料只來自明確 allowlist；私人匯入、備份、測試證據與授權不明內容均未包含。

- 原創程式碼：MIT，僅限 **junru-norple** 實際持有著作權或相關權利的部分。
- 原創 Prompt、文件、描述與簡報設計：CC BY 4.0，同樣僅限實際持有權利的部分。
- prompts.chat：2,082 筆 Prompt data 依固定 commit 的 CC0-1.0 完整收錄；上游 source/site code 依 MIT。內容保留原授權，不改標為 CC BY。
- 其他第三方固定來源：依各來源 MIT、Apache-2.0 或 CC BY 4.0 範圍收錄；每筆保留來源、commit、授權與檔案定位。
- 第三方依賴：依各自授權；下載 ZIP 內含適用的授權、attribution、scope 與 artifact manifest。
- 商標與名稱：均屬各權利人；本專案不暗示任何合作、隸屬或背書。

公開內容涵蓋 Prompt、Live UI、Theme、Design System、Workflow、Artifact Example、Skill 與 Template；實際類別數量見下方統計。本次已依固定來源及授權證據排除不足以證明可再散布的項目。部分第三方正文的本機絕對路徑已在公開改作中替換為中性占位文字，並標示 **SANITIZED_LOCAL_ADAPTATION**；這些公開改作不宣稱與上游原始位元組相同，來源、作者及授權仍保留。

**首次發布**：依 **PUBLISHING.md** 先建立空白 Private Repository。請一併複製隱藏檔，保留 **.gitattributes** 的 *** -text** 規則，避免 Git 改寫受 SHA 綁定的換行。使用者自行確認 noreply 作者 Email；遠端 clean clone 通過 **npm test** 並與交付收據完全一致後，再改為 Public。

Windows 可雙擊 **00_OPEN_PROMPT_LIBRARY.cmd**；也可直接以 file:// 開啟 **prompt-library/visual-catalog/index.html**。正式功能不需要 localhost、CDN、遠端 API、帳號或來源電腦絕對路徑。執行 **npm test** 可重算公開 Gate。

本專案按現狀提供，不提供保證；本文件不是專業法律意見。授權細節請見 **LICENSE_SCOPE.md** 與 **THIRD_PARTY_NOTICES.md**。

## English

AI Prompt Library is a local-first, relocatable, offline-capable static library with 5,298 complete, usable public entries from 16 fixed-version sources. 2,380 entries expose complete prompt text for reading, copying, and download. The Atlas also provides title/body search, Related, Compare, sandboxed Preview, and manifest-bound Download. The public artifact is built from an explicit allowlist; personal imports, backups, test evidence, and material without a confirmed publication basis are not included.

- Original code: MIT, only to the extent copyright or related rights are held by **junru-norple**.
- Original prompts, documentation, descriptions, and presentation design: CC BY 4.0, subject to the same ownership limit.
- prompts.chat: all 2,082 prompt records are included from the pinned CC0-1.0 dataset; upstream source/site code is MIT. Third-party material is not relicensed as CC BY.
- Other fixed third-party sources remain under their applicable MIT, Apache-2.0, or CC BY 4.0 terms; every entry retains its source, commit, license, and file locator.
- Third-party dependencies remain under their own terms. Downloadable ZIPs carry the applicable notices, attribution, scope, and artifact manifest.
- All third-party names and marks belong to their owners. No affiliation, sponsorship, or endorsement is implied.

The published categories are Prompt, Live UI, Theme, Design System, Workflow, Artifact Example, Skill, and Template; see the actual counts below. Entries without sufficient pinned redistribution evidence are excluded. Local absolute paths in some third-party bodies have been replaced with neutral placeholders in public derivatives labeled **SANITIZED_LOCAL_ADAPTATION**. These derivatives do not claim byte identity with upstream originals; source, authorship, and license attribution remain intact.

**First publication**: follow **PUBLISHING.md** and start with an empty Private repository. Include hidden files and preserve **.gitattributes** with *** -text** so Git does not rewrite SHA-bound line endings. Independently verify the noreply author email. Make the repository Public only after a remote clean clone passes **npm test** and exactly matches the delivery receipt.

On Windows, double-click **00_OPEN_PROMPT_LIBRARY.cmd**, or open **prompt-library/visual-catalog/index.html** directly over file://. Production use requires no localhost server, CDN, remote API, account, or source-machine absolute path. Run **npm test** to recompute the public gates.

The project is provided as-is, without warranty. This documentation is not professional legal advice. See **LICENSE_SCOPE.md** and **THIRD_PARTY_NOTICES.md** for scope.

## 公開類別統計 / Public Category Counts

| 類別 / Category | 數量 / Count |
|---|---:|
| artifact-example | 901 |
| design-system | 297 |
| live-ui | 451 |
| prompt | 2370 |
| skill | 218 |
| template | 392 |
| theme | 2 |
| workflow | 667 |
