<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# 首次私人發布 / First Private Publication

## 繁體中文

1. 使用者自行建立新的 GitHub Repository，先選 **Private**。
2. 不自動加入 README、LICENSE 或 .gitignore，保持空白。
3. 將交付的 Repository 資料夾**內部全部內容**複製至新工作目錄。
4. 不複製父資料夾，避免出現 Repository/Repository 的巢狀結構。
5. 確認隱藏檔 .gitattributes 與 .gitignore 也已複製；保留 `* -text`。
6. 交付資料夾不含 .git；不要帶入舊 .git、commit 或舊倉庫內容。
7. 第一次 Commit 前，自行確認作者及提交者名稱與 Email。
8. Email 使用 GitHub 提供的 noreply；不需要將實際值提供給 Codex。
9. Commit 後、Push 前，在自己的工作目錄執行：`git log -1 --format="%an <%ae>%n%cn <%ce>"`。
10. 若出現私人 Gmail，停止 Push，自行修正該新倉庫的 repository-local 身分，再重新建立尚未 Push 的 commit。
11. 自行 Push 後先維持 Private。
12. 從 GitHub clean clone 到乾淨資料夾，執行 `npm test`。
13. 排除 .git 後，檔案數、總 bytes 與 Tree Hash 必須與最終交付收據完全一致。
14. 遠端 clean clone 驗證通過後，才自行改為 Public。

Codex 僅執行工作區內虛構身分的臨時 Git 往返測試，沒有操作 GitHub、索取 Email 或外部工作目錄。實際 Commit、Push 及公開均由使用者完成。

## English

1. Create a new GitHub repository yourself and select **Private** initially.
2. Do not initialize it with README, LICENSE, or .gitignore; keep it empty.
3. Copy **all contents inside** the delivered Repository folder into the new working directory.
4. Do not copy its parent folder or create Repository/Repository nesting.
5. Include hidden .gitattributes and .gitignore files; preserve `* -text`.
6. The delivered folder contains no .git. Do not import old .git directories, commits, or old repository contents.
7. Before the first commit, independently check the author and committer names and emails.
8. Use a GitHub-provided noreply email; Codex does not need its value.
9. After committing and before pushing, run `git log -1 --format="%an <%ae>%n%cn <%ce>"` in your own working directory.
10. If a private Gmail address appears, stop before pushing, correct this new repository's local identity, and recreate the unpushed commit yourself.
11. Push yourself and keep the repository Private.
12. Clean clone from GitHub into an empty directory and run `npm test`.
13. Excluding .git, the file count, total bytes, and tree hash must exactly match the final delivery receipt.
14. Make the repository Public only after this remote clean-clone verification passes.

Codex performs only a temporary local Git round-trip with a fictional identity inside the project workspace. It does not operate GitHub or request an email or external worktree. The user performs all actual commits, pushes, and visibility changes.
