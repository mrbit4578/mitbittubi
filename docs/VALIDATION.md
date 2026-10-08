# Kết quả xác minh — 08/10/2026

Môi trường hiện tại: Node.js 24.19.0, npm 11.9.0, Python 3.12.14, Git 2.52.0. Checkout `/workspace/mitbittubi`.

| Kiểm tra | Kết quả |
| --- | --- |
| Git HTTPS proxy đọc repo | Đạt; repo ban đầu chưa có commit hoặc nhánh main |
| Cài lại từ lockfile `npm ci` | Đạt |
| Vitest | 63 test đạt: 26 ESG, 19 import/XLSX/CRUD, 13 giao dịch sandbox, 5 runtime/context |
| TypeScript và Vite production build | Đạt |
| Playwright Chromium | 5 test đạt; toàn bộ màn hình, seed/lưu/export, workspace tách biệt, bằng chứng–duyệt–khóa, mobile/desktop, snapshot báo cáo bất biến sau hiệu chỉnh live data |
| PostgreSQL 17 integration | 110 assertion đạt; migration thật, RPC/RLS, tenant isolation, vai trò, storage policies, transaction rollback, versions, chống tự duyệt, evidence, locks, immutable audit/report, KPI quality gates và coverage tháng/quý |
| Supabase production | Chưa chạy: người dùng chưa tạo project |
| Vercel production và auto-deploy | Chưa chạy: người dùng chưa tạo/import project |
| PDF Eclat | Chưa đọc: file vượt giới hạn tải 32 MiB |

Các lệnh có thể chạy lại:

```sh
npm ci
npm test
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
bash tests/backend-sql.integration.sh
```

SQL integration sử dụng container PostgreSQL dùng một lần, không mở port và không lưu volume. `auth`/`storage` schemas là stub mô phỏng cấu trúc Supabase cho kiểm tra quyền và migration; không kiểm tra dịch vụ gửi email, SDK Storage qua mạng, Auth production hay cấu hình dashboard thực. Container được dọn sau test. CI có job frontend và database riêng.

Build ban đầu bị kẹt với Rollup 4.64.2, CPU cao và bộ nhớ tăng. Thử có kiểm soát cho thấy tắt tree shaking build được, nhưng bản chính thức **giữ tree shaking** và pin Rollup 4.63.6 tương thích Vite (`^4.34.9`). Sau pin, build hoàn tất khoảng 1–2 giây. Dependency có lockfile/integrity bình thường; không tắt TLS, checksum hoặc kiểm tra chữ ký. Bundle tách React, Supabase và Excel để mỗi JS chunk dưới 250 kB trong lần build này.

Kết quả trên xác minh mã và môi trường hiện tại. Việc lưu draft môi trường không tự publish; push GitHub không tự tạo dự án Vercel/Supabase. Nghiệm thu project thật theo `DEPLOYMENT.md` sau khi cấu hình.
