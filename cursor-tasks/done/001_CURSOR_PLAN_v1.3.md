# WALLET CENTER v1.3 — MASTER PLAN CHO CURSOR

> Đây là toàn bộ spec triển khai. Cursor đọc file `wallet-center-v12.html` làm base,
> sau đó build lại thành `wallet-center-v13.html` theo đúng plan này.
> Toàn bộ giao diện, nhãn, thông báo, placeholder phải là **Tiếng Việt**.

---

## 0. QUY TẮC BẮT BUỘC (KHÔNG ĐƯỢC VI PHẠM)

```
❌ TUYỆT ĐỐI KHÔNG dùng template literals (backtick `)
❌ TUYỆT ĐỐI KHÔNG dùng spread operator ([...arr] hoặc {...obj})
✅ String nối bằng + duy nhất
✅ Array copy bằng .slice() hoặc push loop
✅ 1 file HTML duy nhất, không external deps
✅ localStorage key: 'wc_v13'
✅ Mọi text UI: Tiếng Việt
✅ ES5-compatible syntax xuyên suốt
```

---

## 1. TỔNG QUAN THAY ĐỔI LỚN

### 1.1 Từ 2–6 lên **2–20 người chơi**
- Setup screen: bộ chọn số người chơi từ 2 đến 20 (hiển thị dạng grid hoặc +/- stepper)
- Khi ≤ 8 người: layout card như hiện tại (full height)
- Khi 9–14 người: card compact (thu nhỏ, bỏ animation blink)
- Khi 15–20 người: card mini (chỉ avatar + tên + số dư + delta, bỏ quick action buttons — dùng tap để mở modal)
- Action modal: target list scroll được, không limit

### 1.2 Adaptive layout (Mobile / Tablet / Webapp)
```
Mobile  < 640px : layout hiện tại, modal bottom-sheet
Tablet  640–1024px: 2-column player grid, modal centered (không bottom-sheet)
Desktop > 1024px: 3-column player grid, modal centered, sidebar có thể mở
```
Breakpoint bằng CSS:
```css
@media (min-width: 640px) { /* tablet+ */ }
@media (min-width: 1024px) { /* desktop */ }
```

### 1.3 Toggle "Bỏ chọn tất cả" trong Action Modal
Khi đã chọn tất cả (hoặc dùng quick button), nút **"Gửi cho TẤT CẢ"** hoạt động như toggle:
- Lần 1 bấm → chọn tất cả (trạng thái: active/on, icon ✓)
- Lần 2 bấm → bỏ chọn tất cả (trạng thái: off)
Logic hiện tại đã đúng nhưng cần visual rõ hơn: nút on = viền vàng + text "✓ Đã chọn tất cả → Bỏ chọn", nút off = text thường.

---

## 2. CẤU TRÚC STATE (thêm fields mới)

```javascript
// Kế thừa từ v1.2, bổ sung:
S = {
  // ... tất cả fields v1.2 ...

  // MỚI:
  pot: 0,              // số dư quỹ chung (pot/kitty), 0 = tắt
  potEnabled: false,   // có bật quỹ chung không
  timer: {
    startMs: 0,        // Date.now() khi bắt đầu game
    elapsed: 0,        // tổng ms đã chơi (tích lũy qua các lần pause)
    running: false     // đang đếm hay đang pause
  },
  pinnedNote: '',      // ghi chú ghim trên màn hình chính (max 80 ký tự)
  theme: 'auto',       // 'auto' | 'light' | 'dark' (auto = theo OS)
  compact: false,      // true = force compact cards dù ít người
  txTemplates: [],     // [{name, tab, amt, selectAll}] max 5 template
}
```

LocalStorage key: `wc_v13`

---

## 3. FEATURES CHI TIẾT

---

### 3.1 SETUP SCREEN — Nâng cấp toàn diện

**Số người chơi (2–20):**
```
Dùng 2 nút: [−] [SỐ] [+]
Bấm giữ [−] / [+] để tăng/giảm nhanh (long press repeat sau 500ms)
Range: 2–20, hiển thị số hiện tại ở giữa to rõ
```

**Danh sách người chơi:**
- Khi > 8 người: list scroll được, mỗi row compact hơn (height 44px thay vì 56px)
- Nút "Đặt tất cả về mặc định" (reset tên + màu về Player 1..N)
- Nút "Chia đều từ tổng" — nhập tổng tiền, tự chia đều cho tất cả

**Cài đặt nhanh — section dưới cùng trước nút Bắt đầu:**
```
[ ] Bật Quỹ chung (Pot) — khi bật, hiển thị input "Số tiền quỹ ban đầu"
[ ] Bắt đầu đếm giờ ngay khi bắt đầu tran
Mức tiền nhanh: [___] [___] [___] [___] (4 inputs, x1000đ)
Ghi chú trận: [________________________] (max 80 ký tự, hiện trên header)
```

---

### 3.2 HEADER PLAY SCREEN — Tối ưu

**Layout mobile (< 640px) — 5 nút icon:**
```
[WALLET CENTER] [Vòng N]  |  [↺N] [⇅] [☀] [📋] [⊙]
```

**Layout tablet+ (≥ 640px) — nút có label:**
```
[WALLET CENTER] [Vòng N] [⏱ 01:23]  |  [↺ Hoàn tác] [Sắp xếp] [Lịch sử] [⊙]
```

**Đồng hồ đếm giờ:**
- Hiển thị `MM:SS` hoặc `H:MM:SS` nếu > 1 giờ
- Bấm vào để pause/resume
- Màu: dim khi pause, grn khi chạy

**Ghi chú ghim (nếu có):**
- Hiện 1 dòng nhỏ dưới header, giữa header và checksum bar
- Có nút × để ẩn tạm

---

### 3.3 PLAYER CARDS — 3 chế độ hiển thị

**Chế độ đầy đủ (≤ 8 người hoặc compact=false):**
```
[STRIPE][AVATAR][TÊN + TAG][SỐ DƯ]   [DELTA] [→] [←]
```
Giống v1.2, avatar 38px, balance font-size 19px.

**Chế độ compact (9–14 người hoặc compact=true):**
```
[STRIPE][AVATAR 30px][TÊN][SỐ DƯ 16px]  [DELTA]  [→][←]
```
Card height ~52px. Bỏ animation blink. Tag "HẾT TIỀN"/"SẮP HẾT" thu nhỏ.

**Chế độ mini (15–20 người):**
```
[STRIPE 3px][AVATAR 26px][TÊN trunc][SỐ DƯ 14px]  [DELTA]
```
Card height ~44px. Bỏ hoàn toàn quick action buttons [→][←]. Chỉ tap để mở modal.
2 cột trên tablet+.

**Logic chọn chế độ:**
```javascript
function cardMode() {
  var n = S.players.length;
  if (S.compact || n >= 15) return 'mini';
  if (n >= 9) return 'compact';
  return 'full';
}
```

**Thêm nút toggle compact trong header** (icon ⊞ / ≡) để user tự chọn.

---

### 3.4 ACTION MODAL — Cải tiến quan trọng

**Nút "Tất cả" — Toggle rõ ràng:**
```
Trạng thái OFF: [ ▶ Gửi cho TẤT CẢ ]   (viền mờ, màu dim)
Trạng thái ON:  [ ✓ Đã chọn TẤT CẢ — Bỏ chọn ]  (viền vàng, màu vàng)
```
Bấm khi ON → tắt hết (S.atgt = []).
Bấm khi OFF → chọn hết (S.atgt = all others).

**Quỹ chung (Pot) — nếu potEnabled:**
Thêm 1 row đặc biệt trong danh sách target với icon 💰 và "Quỹ chung (hiện tại: Xk)".
Khi chọn quỹ chung làm target: tiền gửi vào/nhận từ quỹ (không phải người chơi).

**Quick row cải tiến:**
- 4 nút quick từ `S.quickDenoms` (giữ nguyên)
- Bên cạnh 4 nút, thêm 1 nút nhỏ **"Khác..."** mở sub-panel nhập số tùy ý
- Mỗi quick button: bấm 1 lần = chọn tiền + chọn tất cả người chơi, sau đó user confirm

**Template giao dịch — icon ★:**
- Nút nhỏ "★ Lưu mẫu" ở góc sau khi đã chọn amt + target
- Tối đa 5 template: `[name, tab, amt, selectAll]`
- Hiển thị template list ở đầu modal (nếu có template): bấm = apply ngay

**Inline error cải tiến:**
- Khi lỗi thiếu tiền: hiện rõ tên người thiếu + số tiền thiếu
- Lỗi fade out sau 4 giây, có nút × để đóng ngay

---

### 3.5 QUỸ CHUNG (POT/KITTY)

Khi `S.potEnabled = true`:
- Hiển thị card đặc biệt đầu tiên trong danh sách (hoặc cuối cùng, config được)
- Card có màu vàng/gold khác biệt, icon 💰
- Số dư quỹ hiển thị
- Người chơi có thể:
  - Nộp vào quỹ: chọn quỹ làm target trong tab GUI
  - Nhận từ quỹ: chọn quỹ làm target trong tab NHẬN (quỹ pay for player)
- Kiểm tra số dư quỹ trước khi cho nhận
- Quỹ không có "initial" → delta không hiển thị, chỉ số dư hiện tại

---

### 3.6 ĐỒNG HỒ ĐẾM GIỜ

```javascript
// State:
S.timer = { startMs: 0, elapsed: 0, running: false }

// Logic:
function startTimer()   { S.timer.startMs = Date.now(); S.timer.running = true; }
function pauseTimer()   { S.timer.elapsed += Date.now() - S.timer.startMs; S.timer.running = false; }
function resumeTimer()  { S.timer.startMs = Date.now(); S.timer.running = true; }
function getElapsed()   { 
  var e = S.timer.elapsed;
  if (S.timer.running) e += Date.now() - S.timer.startMs;
  return e;
}
function fmtTime(ms) {
  var s = Math.floor(ms / 1000);
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  var sec = s % 60;
  if (h > 0) return h + ':' + pad(m) + ':' + pad(sec);
  return pad(m) + ':' + pad(sec);
}
```

- Update mỗi giây bằng `setInterval` (lưu interval ID, clear khi phase='setup')
- Khi saveState: lưu elapsed hiện tại (không lưu running=true, pause trước khi save)
- Hiển thị trên header (tablet+) hoặc dưới round counter (mobile)
- **Bấm vào đồng hồ → pause/resume** với visual feedback (icon ⏸/▶)

---

### 3.7 LỊCH SỬ & THỐNG KÊ — Nâng cấp

**Tab "Giao dịch":**
- Hiển thị **tất cả** giao dịch (không giới hạn 10), scroll được
- Filter theo người chơi: dropdown "Lọc: Tất cả | Tên1 | Tên2..."
- Mỗi row: hiện rõ hơn — màu người gửi ở cạnh trái (giống stripe), format đẹp
- Nút "Hoàn tác" chỉ active cho GD gần nhất (1 nút, không phải mỗi row)

**Tab "Thống kê":**
- Overview cards: Tổng GD | Vòng | Thời gian chơi | Tổng tiền lưu thông
- Bảng per-player: Avatar | Tên | Đã trải | Đã nhận | Lãi/Lỗ | Số GD
- Sort bảng theo cột: bấm header cột để sort
- Bar chart đơn giản (CSS width %) cho delta của từng người

**Tab "Kết quả":**
- Hiển thị bảng xếp hạng cuối trận
- Tính "Ai nợ ai bao nhiêu" — minimum transactions to settle debts
  ```javascript
  function calcDebts() {
    // Tính net position mỗi người
    // Greedy algorithm: người dương nhất thu từ người âm nhất
    // Return: [{from: idx, to: idx, amount: n}]
  }
  ```
- Hiển thị danh sách "Thanh toán cuối trận": "An trả Bình 15k"
- Nút "Copy để chia sẻ" — text + kết quả đẹp

---

### 3.8 RESET MODAL — Bổ sung tùy chọn

Thêm option thứ 4:
```
[⏱ Chỉ reset vòng và đồng hồ]
  Giữ nguyên số dư. Reset vòng về 1 và đồng hồ về 0. KHÔNG lưu lịch sử.
```

---

### 3.9 SETTINGS MODAL — MỚI

Nút ⚙ (thay hoặc bổ sung vào menu):
```
📱 HIỂN THỊ
  [ ] Chế độ compact cards
  [ ] Luôn hiển thị đồng hồ
  [ ] Hiển thị thứ hạng trên card (Hạng 1, 2, 3...)

🔊 ÂM THANH & RUNG
  [x] Âm thanh giao dịch
  [x] Rung khi thực hiện

💰 QUỸ CHUNG
  [ ] Bật quỹ chung
  Số dư quỹ: [_______]

🎯 MỨC TIỀN NHANH
  [___] [___] [___] [___]
```

---

### 3.10 THÊM TÍNH NĂNG XỊN KHÁC

**A. Huy hiệu thứ hạng trên card (khi bật):**
Hiển thị badge nhỏ 🥇🥈🥉 hoặc số thứ tự khi sort theo số dư.

**B. Giao dịch 1-1 nhanh (peer-to-peer quick):**
Khi bấm icon → trên card người A, nếu chỉ có 2 người (hoặc long press):
- Mở bottom sheet nhỏ với chỉ 4 nút amount và input — không cần chọn target (A→B tự động)
- UX: 2 tap thay vì 4–5 tap

**C. Thông báo inline khi sự kiện quan trọng:**
- Ai đó vừa phá sản → hiện toast "💥 An vừa HẾT TIỀN!"
- Ai đó vừa vươn lên dẫn đầu → "🏆 Bình đang dẫn đầu!"
- Tự tắt sau 3s, không dùng alert()

**D. Bộ lọc lịch sử theo người chơi trong play screen:**
Bên dưới "Giao dịch gần đây", thêm row filter nhỏ: [Tất cả] [An] [Bình] [Cường]...
Bấm để lọc lịch sử chỉ hiện GD liên quan đến người đó.

**E. Rank badge trên avatar:**
```
🥇 rank 1 (số dư cao nhất)
🥈 rank 2
🥉 rank 3
(không có badge cho rank 4+)
```
Hiện ở góc trên-phải của avatar. Toggle on/off trong settings.

---

## 4. CSS / RESPONSIVE SPEC

### 4.1 CSS Variables (giữ v1.2, bổ sung)
```css
:root {
  /* ... v1.2 vars ... */
  --radius-card: 14px;   /* compact: 10px, mini: 8px */
  --gap-list: 8px;       /* compact: 5px, mini: 4px */
}
```

### 4.2 Modal trên Tablet/Desktop
```css
@media (min-width: 640px) {
  .mo { align-items: center; }
  .md {
    border-radius: 20px;     /* không phải 20 20 0 0 */
    max-width: 520px;
    max-height: 85vh;
    margin: auto;
  }
  /* Không có animation slideup, dùng fadeScale thay thế */
  @keyframes fadeScale {
    from { opacity: 0; transform: scale(.94); }
  }
  .md { animation: fadeScale .18s ease-out; }
}
```

### 4.3 Player grid trên tablet
```css
@media (min-width: 640px) {
  .pls { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
}
@media (min-width: 1024px) {
  .pls { grid-template-columns: 1fr 1fr 1fr; }
}
```

### 4.4 Header trên tablet
```css
@media (min-width: 640px) {
  .hd h1 { font-size: 16px; }
  .ib { width: auto; padding: 0 12px; gap: 5px; font-size: 12px; }
  /* Nút có label text + icon */
}
```

---

## 5. LOCALE / TIẾNG VIỆT REFERENCE

Thay **toàn bộ** text sau (không để sót tiếng Anh nào trong UI):

| English (cũ) | Tiếng Việt (v1.3) |
|---|---|
| Send / GUI | Gửi |
| Receive / NHAN | Nhận |
| Send to ALL | Gửi cho Tất Cả |
| Receive from ALL | Nhận từ Tất Cả |
| QUICK — SELECT ALL | Nhanh — Chọn Luôn Tất Cả |
| Amount | Số Tiền |
| Player N | Người chơi N |
| Round | Vòng |
| Undo | Hoàn Tác |
| Reset | Đặt Lại |
| History | Lịch Sử |
| Sort | Sắp Xếp |
| Stats / Thong ke | Thống Kê |
| Transactions | Giao Dịch |
| Results | Kết Quả |
| Settings | Cài Đặt |
| Save | Lưu |
| Cancel | Hủy |
| Confirm | Xác Nhận |
| Copy | Sao Chép |
| Theme | Giao Diện |
| Dark / Light | Tối / Sáng |
| Pot / Kitty | Quỹ Chung |
| Bankrupt | Hết Tiền |
| Low balance | Sắp Hết |
| Balance | Số Dư |
| Initial | Ban Đầu |
| Delta | Lãi/Lỗ |
| Session | Trận Đấu |
| Template | Mẫu Giao Dịch |
| Timer | Đồng Hồ |
| Note | Ghi Chú |
| Compact | Gọn |
| Players | Người Chơi |
| Start Game | Bắt Đầu Trận Đấu |
| End Game | Kết Thúc Trận |
| New Game | Trận Mới |
| Hard Reset | Xóa Tất Cả |
| Quick amounts | Mức Tiền Nhanh |
| Color | Màu Sắc |
| Emoji | Biểu Tượng |
| Remove emoji | Xóa Biểu Tượng |
| Invalid | Không Hợp Lệ |
| Insufficient funds | Không Đủ Tiền |
| Checksum OK | ✓ Hợp Lệ |
| Checksum ERR | ✗ Sai Lệch |

---

## 6. DATA FLOW & LOGIC CHỜ CURSOR

### 6.1 Debt Settlement Algorithm
```javascript
function calcDebts() {
  var balances = [];
  for (var i = 0; i < S.players.length; i++) {
    var net = S.players[i].balance - S.players[i].initial;
    if (Math.abs(net) > 0) balances.push({ idx: i, net: net });
  }
  // Sort: debtors (net < 0) và creditors (net > 0)
  var debtors = [], creditors = [];
  for (var i = 0; i < balances.length; i++) {
    if (balances[i].net < 0) debtors.push({ idx: balances[i].idx, amt: -balances[i].net });
    else if (balances[i].net > 0) creditors.push({ idx: balances[i].idx, amt: balances[i].net });
  }
  var txs = [];
  var di = 0, ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    var d = debtors[di], c = creditors[ci];
    var amt = Math.min(d.amt, c.amt);
    txs.push({ from: d.idx, to: c.idx, amount: amt });
    d.amt -= amt; c.amt -= amt;
    if (d.amt === 0) di++;
    if (c.amt === 0) ci++;
  }
  return txs;
}
```

### 6.2 Auto Theme (khi theme='auto')
```javascript
function applyTheme() {
  if (S.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (S.theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else { // auto
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }
}
// Listen for OS theme change:
window.matchMedia('(prefers-color-scheme: dark)').addListener(function() {
  if (S.theme === 'auto') applyTheme();
});
```

### 6.3 Timer setInterval
```javascript
var timerInterval = null;
function startTimerTick() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(function() {
    if (S.timer.running && S.phase === 'playing') {
      updateTimerDisplay(); // targeted DOM update chỉ cập nhật #timerEl, không re-render
    }
  }, 1000);
}
function updateTimerDisplay() {
  var el = document.getElementById('timerEl');
  if (el) el.textContent = fmtTime(getElapsed());
}
```

### 6.4 Long Press để tăng/giảm số người chơi
```javascript
var pcPressTimer = null;
var pcPressInterval = null;
function pcPressStart(dir) {
  adjustPC(dir); // ngay lập tức
  pcPressTimer = setTimeout(function() {
    pcPressInterval = setInterval(function() { adjustPC(dir); }, 100);
  }, 500);
}
function pcPressEnd() {
  clearTimeout(pcPressTimer);
  clearInterval(pcPressInterval);
}
function adjustPC(dir) {
  var n = S.players.length + dir;
  if (n < 2 || n > 20) return;
  setPC(n);
}
```

---

## 7. THỨ TỰ TRIỂN KHAI (CURSOR LÀM THEO ĐÂY)

1. **Copy v1.2 làm base**, đổi tên file thành `wallet-center-v13.html`
2. **Đổi localStorage key** sang `wc_v13`, thêm migration logic từ `wc_v12`
3. **Cập nhật state schema** — thêm pot, timer, pinnedNote, theme, compact, txTemplates
4. **Viết lại `rSetup()`** — 2–20 người, long press stepper, quick settings section
5. **Viết lại `rPlay()`** — header mới (timer, ghi chú), compact/mini card modes
6. **Viết lại `rActModal()`** — toggle all button, pot target, template quick access
7. **Thêm `calcDebts()`** và tab Kết Quả trong modal lịch sử
8. **Thêm Timer logic** — state, tick, display, pause/resume
9. **Thêm Pot/Kitty** — card + logic execAct
10. **Thêm Settings modal** 
11. **Responsive CSS** — media queries cho tablet/desktop
12. **Toast notifications** — inline toasts (phá sản, dẫn đầu)
13. **Debt settlement display** trong tab Kết Quả
14. **Final pass**: kiểm tra tất cả text là Tiếng Việt, không có backtick, checksum logic đúng

---

## 8. CÁC HÀM KHÔNG ĐƯỢC THAY ĐỔI LOGIC (CHỈ ENHANCE)

Những hàm này đã test đúng, chỉ mở rộng, không rewrite:
- `execAct()` — thêm pot handling nhưng giữ balance validation logic
- `doUndo()` — giữ nguyên, không thay đổi
- `calcStats()` — giữ nguyên, có thể thêm field
- `saveState()` — thêm fields mới vào object được lưu
- `setTab()` — giữ nguyên targeted DOM update (không gọi re-render)
- `updAmt()`, `updTgt()`, `updBtn()` — giữ nguyên pattern targeted DOM

---

## 9. KIỂM TRA CHẤT LƯỢNG SAU KHI CODE

Cursor tự chạy các check sau trước khi deliver:

```bash
# 1. Không có backtick
grep -n '`' wallet-center-v13.html | grep -v "grid-template\|backdrop\|webkit"
# → phải empty

# 2. Không có spread operator  
grep -n '\.\.\.' wallet-center-v13.html
# → phải empty

# 3. Có đủ hàm quan trọng
grep -c "function " wallet-center-v13.html
# → phải >= 65

# 4. Không có text tiếng Anh lộ ra UI (check các string phổ biến)
grep -n '"Send\|"Receive\|"Reset\|"Undo\|"History\|"Player\|"Round\|"Sort\|"Stats\|"Settings\|"Cancel\|"Confirm"' wallet-center-v13.html
# → phải empty

# 5. localStorage key đúng
grep -c "wc_v13" wallet-center-v13.html
# → phải >= 3
```

---

## 10. DELIVERABLE

- File: `wallet-center-v13.html`
- Kích thước: khoảng 600–800 dòng (acceptable)
- 1 file duy nhất, self-contained
- Chạy được offline, không cần server
- Test trên: Chrome mobile, Safari iOS, Chrome desktop

---

*Plan này được tạo bởi Claude dựa trên codebase v1.2. Cursor đọc file `wallet-center-v12.html` để hiểu đầy đủ context trước khi bắt đầu.*
