# mallorychen.github.io

個人作品集網站，用於應徵 PM / SA 職位。中英雙語，部署於 GitHub Pages。

網址：https://mallorychen.github.io/

---

## 檔案結構

```
/
├── index.html                              中文首頁
├── en/index.html                           English home
├── projects/
│   ├── ehsn-booking/index.html             東森栢馥預約管理系統
│   ├── fju-admissions/index.html           輔大 招生戰情室
│   └── fju-intl-portal/index.html          輔大 外國學生資訊入口網
├── en/projects/                            以上三頁的英文版
├── assets/
│   ├── css/main.css                        全站唯一樣式表（設計 token 在最上方）
│   ├── js/main.js                          深色模式、捲動淡入、header 邊線
│   └── favicon.svg
├── .nojekyll                               關閉 GitHub Pages 的 Jekyll 處理
└── README.md
```

## 部署

沒有建置步驟。`git push` 到 `main` 後約 30 秒內生效。

```bash
git add -A
git commit -m "Update content"
git push
```

## 本機預覽

```bash
python -m http.server 8000
# 開啟 http://localhost:8000
```

> 直接用檔案總管點開 `index.html` 也能看，但根路徑連結（`/en/`、`/projects/…`）會失效，請用上面的本機伺服器。

---

## 設計系統

| 項目 | 值 |
|---|---|
| 風格 | 編輯排版風（Editorial / Swiss） |
| 強調色 | 磚紅 `#8C3A2B`（深色模式 `#E08A76`） |
| 中性色 | 編輯黑 `#18181B` / 米白 `#FAFAFA` |
| 標題字 | Newsreader + Noto Serif TC |
| 內文字 | Inter + Noto Sans TC |
| 標籤/數據 | JetBrains Mono |

所有顏色與間距都定義為 CSS 變數，集中在 `assets/css/main.css` 最上方的 `:root`。要換色只需要改那裡。

---

## 待補內容

頁面上所有虛線紅框標記的 `TODO` 都是待填欄位。填完後把整個 `<span class="todo">…</span>` 換成實際文字即可。

盤點待補項目：

```bash
grep -rc "class=\"todo\"" --include="*.html" .
```

### 優先順序

1. **`/resume.pdf` 與 `/resume-en.pdf`** — 放到 repo 根目錄，首頁的下載按鈕才不會 404
2. **聯絡方式** — ⚠️ 請使用個人信箱，不要使用公司信箱
3. **三個案例的「關鍵決策」** — 這是整個網站最重要的區塊，也是招募方判斷你是決策者還是執行者的依據
4. **案例的一句話描述與成果數字**
5. **流程圖 / 介面示意圖** — 建議重繪為 SVG 並標註「示意圖，已脫敏」，不放真實系統截圖

---

## 注意事項

- **中英雙語**：兩個語言是獨立的 HTML，改中文版時記得同步改 `/en/`
- **`.nojekyll` 不要刪**：刪了之後 GitHub Pages 會用 Jekyll 處理檔案
- **深色模式**：預設跟隨系統，使用者按右上角切換後會存進 `localStorage`
