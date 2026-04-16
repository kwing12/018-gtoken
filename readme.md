# 018-gtoken — Ví Trung Tâm v1.3

Ứng dụng web tĩnh 1 file HTML để ghi sổ giao dịch trong bàn chơi, hỗ trợ nhiều người chơi, quỹ chung, lịch sử, thống kê và kết quả chốt nợ cuối trận.

## Cấu trúc dự án

- `src/index.html`: file ứng dụng chính, self-contained, chạy offline.
- `cursor-tasks/done/001_CURSOR_PLAN_v1.3.md`: bản kế hoạch đã hoàn tất.

## Chạy local

Vì đây là ứng dụng tĩnh, chỉ cần mở trực tiếp:

- Cách nhanh: double-click `src/index.html`.
- Cách khuyến nghị: dùng Live Server hoặc static server để test giống môi trường web thực tế.

## Deploy Cloudflare Pages (khuyến nghị)

Thiết lập đúng cho repo này:

- Framework preset: `None`
- Build command: để trống
- Deploy command: để trống
- Build output directory: `src`
- Root directory: để mặc định (`/`)

Lý do: entrypoint deploy hiện tại nằm ở `src/index.html`.

## Hai cách deploy

### 1) Upload tĩnh trực tiếp (nhanh nhất)

1. Vào Cloudflare Dashboard -> Workers & Pages -> Create.
2. Chọn Pages -> Upload assets.
3. Upload thư mục `src`.
4. Deploy.

### 2) Kết nối GitHub (tự động deploy mỗi lần push)

1. Chọn Pages -> Connect to Git.
2. Chọn repo `kwing12/018-gtoken`.
3. Áp dụng đúng build settings như phần trên.
4. Save and Deploy.

## Lỗi thường gặp và cách xử lý

### Lỗi: `Could not detect a directory containing static files`

Nguyên nhân thường gặp:

- Đã đi vào flow của Workers thay vì Pages.
- Có cấu hình `Deploy command: npx wrangler deploy` cho project static.

Cách sửa:

- Xóa toàn bộ deploy/build command.
- Đảm bảo project là Pages.
- Đặt output directory là `src`.

## Quy ước cập nhật

1. Sửa `src/index.html`.
2. Kiểm tra nhanh giao diện và text.
3. Commit với message rõ mục đích.
4. Push lên `main` để Pages tự triển khai (nếu dùng GitHub Connect).
