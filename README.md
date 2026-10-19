# 備料簿：員工私人網站

這是可上傳到 GitHub 的獨立部署版本。保留講義上傳、材料明細、原量 ×6、紅字另列、每週採購、採購分類、Excel 匯出、人工確認與處理紀錄。字體已在原版基礎加大 2pt。

**GitHub 放程式；Cloudflare Workers 執行網站，D1 存材料，R2 存講義，Access 管理員工登入。GitHub Pages 無法執行這套資料庫與後端功能。**

## 最短上架流程

1. 在自己的 GitHub 建立 **Private** 儲存庫。將本資料夾內容（包含 `.github`）推送到該儲存庫；不要上傳父資料夾、原始講義、`.env`、金鑰或資料庫備份。
2. 在 Cloudflare 帳號建立一個 D1 資料庫與一個私有 R2 bucket，記下資料庫 ID 及 bucket 名稱。R2 不要開啟公開存取。
3. 在 Cloudflare Zero Trust 建立 Self-hosted Access application，網址設成預定的員工網站完整網域（涵蓋所有路徑，包括 `/api/*`）。Allow policy 只加入授權員工的 Email，可選 Email 一次性驗證碼或公司 SSO。不要使用 Everyone 或 Bypass policy。記下 Team domain 及 Application Audience (AUD)。
4. 在 GitHub Settings → Environments 建立 `production`，依公司需要設定部署審核者。於該 Environment 建立下表 Secrets / Variables。
5. GitHub Actions → **Deploy private employee website** → Run workflow。第一次會建立資料表，之後只套用尚未執行的 migration；不會清空資料。
6. 將 Access application 綁定部署回傳的實際網址。測試授權員工可登入、非授權 Email 被拒絕，再提供網址給員工。

|種類|名稱|內容|
|---|---|---|
|Secret|CLOUDFLARE_API_TOKEN|限本帳號部署所需權限：Workers Scripts Edit、D1 Edit、Workers R2 Storage Edit，及 Cloudflare 要求的帳號讀取權限|
|Secret|CLOUDFLARE_ACCOUNT_ID|自己的 Cloudflare account ID|
|Variable|WORKER_NAME|例如 `qingcan-materials`|
|Variable|D1_DATABASE_ID|步驟2的真實資料庫UUID|
|Variable|R2_BUCKET_NAME|步驟2的 bucket 名稱|
|Variable|ACCESS_TEAM_DOMAIN|例如 `your-team.cloudflareaccess.com`，不含 `https://`|
|Variable|ACCESS_AUD|步驟3的 Application Audience tag|

若 Access application 的網域與 Worker 實際網域不同，請先調整為一致。本版本會驗證 Access JWT 的簽章、發行者、對象與效期；未設定時回傳401，不會自動開放。網站舊有維護端點在獨立部署中固定關閉。

## GitHub 推送

安裝 Git 後，在此資料夾開啟終端機；將網址替換成自己的 Private repository：

```sh
git init
git add .
git commit -m "Initial private employee materials website"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

尚未取得你的 GitHub 儲存庫與 Cloudflare 帳號設定，因此這份套件**尚未推送到你的 GitHub，也尚未部署到你的 Cloudflare**。原 Sites 網站仍獨立運作。

## 既有資料

本套件不含目前540筆材料、講義、人工確認、採購草稿或處理紀錄，首次登入為空白班級。這些資料不應放進 Git。

- 若重新上傳原始講義，系統會重新讀取，但不會還原舊網站的人工確認或歷史紀錄；首次啟用須重新驗收。
- 若要完整搬遷，需另做原網站 D1 資料與 R2 原件的受控備份／還原；**本次尚未進行資料搬遷**。既有網站及資料沒有被刪除。
- 所有授權員工目前共用網站內的班級，均可上傳、確認與匯出；本版本沒有新增角色權限，也沒有更改原操作功能。跨班資料以班級識別分開，不等於員工之間的權限隔離。

## 員工日常操作

1. 登入並選擇正確班級。
2. 「上傳講義」選取 DOCX、ODT、XLSX 或文字型 PDF。
3. 「材料明細」查看原量與六倍用量；「待確認事項」處理真正的疑義。
4. 「每週採購」選上課日期／老師，核對合計後匯出 Excel。
5. 「採購分類」沿用原本的類別、Excel 工作表及保存操作。已換算量不再次乘6。

## 本機建置與維護

Node.js 24，`npm ci` 後複製 `wrangler.example.json` 為 `wrangler.json`，填入自己的設定；或設定上述五個非秘密環境變數後執行 `npm run configure`。

```sh
npm run typecheck
npm test
npm run build
```

`npm run db:migrate` 與 `npm run deploy` 會寫入設定指向的 Cloudflare 帳號，僅在確認目標後執行。資料應透過 Cloudflare 的備份／匯出工具保存，勿提交到程式儲存庫。更新程式前保留資料庫與講義備份。

本機無 Access JWT 時預覽會回傳401，這是預設保護，不是資料遺失。登入驗證測試使用自建測試簽章，不使用或儲存員工密碼。

## 驗證與限制

交付時的驗證結果見 `驗收結果.md`。只有完成實際測試才標示通過；你的 Cloudflare 實際部署、Email 驗證碼、員工權限與完整資料搬遷仍需完成帳號設定後驗收。

官方參考：[GitHub Pages僅靜態託管](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)、[Cloudflare Access JWT驗證](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)。
