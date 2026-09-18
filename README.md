# yuwen9012.github.io

個人作品集網站，用於應徵 PM / SA 職位。中英雙語，部署於 GitHub Pages。

網址：https://yuwen9012.github.io/

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
│   ├── js/main.js                          深色模式、捲動淡入、Mermaid 渲染
│   ├── img/                                系統畫面截圖放這裡
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

## 架構圖（Mermaid）

每個案例頁有兩張 Mermaid 圖：一張放在「背景與問題」（導入前流程／資料來源／使用者旅程），一張放在「交付與落地」（系統架構／資訊層級）。

圖是在瀏覽器渲染的，程式碼直接寫在 HTML 裡：

```html
<figure class="figure figure--diagram reveal">
  <p class="todo">這是骨架範例，請改成實際流程後刪掉這行</p>
  <div class="diagram">
<pre class="mermaid">
flowchart LR
    A["來源"] --> B["處理"]
    B --> C[("資料庫")]
</pre>
  </div>
  <figcaption>圖 2 — 系統架構（示意圖，已脫敏）</figcaption>
</figure>
```

### 分層顏色

節點只有**框線**帶顏色，填色維持中性——這讓圖看起來像技術製圖，不像彩色圖表。每張圖下方的 `<ul class="legend">` 會說明該圖的顏色代表什麼。

| class | 顏色 | 慣用意義 |
|---|---|---|
| `lPeople` | 磚紅 | 人：使用者、承辦、主管 |
| `lEntry` | 墨藍 | 入口：介面、首頁、判斷點 |
| `lLogic` | 苔綠 | 中介：服務、整合、主分類 |
| `lData` | 赭 | 資料：資料庫、指標、內容頁 |
| `lPain` | 磚紅虛線 | 痛點：導入前流程裡卡住的步驟 |

指定方式寫在 Mermaid 原始碼最後：

```
class U1,U2,U3 lPeople
class W lEntry
```

改了顏色記得同步改下方 `<ul class="legend">` 的項目，否則圖例會對不上。顏色本身不承載獨立資訊（每個節點都有文字、圖例也有文字標籤），所以色盲使用者不會漏掉任何內容。

### 互動

滑鼠滑過或手機點擊任一節點，會高亮它與**直接相連**的節點和連線，其餘淡出。手機沒有 hover，所以點擊會「釘住」高亮，再點一次或點空白處取消，按 Esc 也可以。

這只是視覺強調，**沒有任何資訊藏在互動後面**——不碰它也能讀完整張圖。

> ⚠️ **節點 id 不可以含底線。** 互動是靠 Mermaid 的邊線識別碼 `L_來源_目標_序號` 反推連線關係的，節點 id 若含底線會讓拆解出錯。用 `U1`、`API`、`DB` 這種寫法，不要用 `user_1`。

### 常用語法

| 寫法 | 產生 |
|---|---|
| `flowchart LR` / `flowchart TD` | 由左到右 / 由上到下 |
| `A["方框"]` | 一般節點 |
| `A{"菱形？"}` | 判斷節點 |
| `A[("圓柱")]` | 資料庫 |
| `A --> B` | 箭頭 |
| `A -- 是 --> B` | 帶標籤的箭頭 |

中文節點文字**一定要加引號**（`A["櫃檯人員"]`），否則某些標點會讓 Mermaid 解析失敗。

要先試語法可以用 [Mermaid Live Editor](https://mermaid.live/) 畫好再貼回來。

**注意事項**

- Mermaid 從 jsDelivr CDN 載入，**版本鎖在 11.17.2**。互動程式依賴它產生的 DOM 結構，放任自動更新等於把網站交給別人的 release notes。要升版請先在本機確認互動仍正常。
- 只在有圖的頁面載入。CDN 不通時會退回顯示原始碼，不會破版。
- 顏色自動跟著設計 token 走，深色模式切換時會重新渲染，不需要另外設定。
- 語法錯誤時原始碼會留在畫面上，方便你看出哪裡寫錯。

---

## 系統畫面截圖

每個案例頁的「交付與落地」有三個畫面欄位，目前是虛線佔位框，框內直接寫著該放哪個檔名。

放圖步驟：

1. 截圖後**脫敏**（個資、真實金額、客戶名稱都要處理掉），輸出成 PNG 或 WebP
2. 存到 `assets/img/`，檔名照佔位框上寫的來，例如 `ehsn-booking-01.png`
3. 把 HTML 裡的佔位 `<div class="shot shot--empty">…</div>` 換成上方註解裡那段 `<img>`

```html
<div class="shot">
  <img src="../../assets/img/ehsn-booking-01.png"
       alt="畫面說明" width="1600" height="1000" loading="lazy" decoding="async">
</div>
```

**點擊放大**是自動的：只要 `.shot` 裡面是一張 `<img>`，JS 就會把它包成按鈕並接上燈箱，不需要額外標記。版面與未加燈箱前完全相同，沒有任何圖示或提示標籤，游標變成放大鏡是唯一的提示。燈箱用原生 `<dialog>`，Escape、點背景關閉、焦點鎖定都是瀏覽器內建行為。沒有 JS 時圖片照常顯示，只是不能放大。

手機上放大後受限於螢幕寬度，主要靠雙指縮放看細節——所以**原圖請維持 1600px 寬**，縮太小會失去放大的意義。

`width` 與 `height` 請填**圖片實際像素尺寸**——這是用來預留版面空間的，少了會造成載入時畫面跳動。建議寬度 1600px 左右，太大會拖慢載入。

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
5. **架構圖與系統畫面** — 六張 Mermaid 圖的節點文字，以及每個案例三張脫敏截圖（作法見上方兩節）

---

## 注意事項

- **中英雙語**：兩個語言是獨立的 HTML，改中文版時記得同步改 `/en/`
- **`.nojekyll` 不要刪**：刪了之後 GitHub Pages 會用 Jekyll 處理檔案
- **深色模式**：預設跟隨系統，使用者按右上角切換後會存進 `localStorage`
- **`docs/` 不會進版控**：裡面放的是履歷原稿與截圖原檔，含個資，只留在本機
