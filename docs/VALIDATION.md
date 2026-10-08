# Kết quả xác minh — 08/10/2026

Môi trường hiện tại: Node.js 24.19.0, npm 11.9.0, Python 3.12.14, Git 2.52.0. Checkout `/workspace/mitbittubi`.

| Kiểm tra | Kết quả |
| --- | --- |
| Git HTTPS proxy đọc repo | Đạt; repo ban đầu chưa có commit hoặc nhánh main |
| Cài lại từ lockfile `npm ci` | Đạt |
| Vitest | 72 test đạt: 26 ESG, 19 import/XLSX/CRUD, 13 giao dịch sandbox, 5 runtime/context, 9 tài liệu/báo cáo/truy xuất nguồn |
| TypeScript và Vite production build | Đạt |
| Playwright Chromium | 8 test đạt; toàn bộ màn hình, seed/lưu/export, workspace tách biệt, bằng chứng–duyệt–khóa, mobile/desktop, snapshot báo cáo bất biến sau hiệu chỉnh live data; audit truy cập/tải, mẫu Eclat/giả định, xuất HTML/XLSX/SVG, sơ đồ keyboard/mobile và CSS in |
| PostgreSQL 17 integration | 110 assertion đạt; migration thật, RPC/RLS, tenant isolation, vai trò, storage policies, transaction rollback, versions, chống tự duyệt, evidence, locks, immutable audit/report, KPI quality gates và coverage tháng/quý |
| Supabase production | Chưa chạy: người dùng chưa tạo project |
| Vercel production và auto-deploy | Đạt cho frontend bổ sung: push commit 9bd806a vào main; trang live trả HTTP 200, entry/report/guide assets trùng byte với build đã kiểm thử. Không kiểm tra Supabase production. |
| PDF Eclat | Đã tải từ URL công khai do người dùng cung cấp sau khi cấp quyền mạng: 39.637.351 byte, 85 trang PDF; đối chiếu các chương/bảng/phụ lục được dẫn, xem ảnh trang có chênh lệch. Số liệu vận hành và chứng thư SGS riêng chưa tái thẩm tra. |

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

## Báo cáo và hướng dẫn bổ sung

- Đối chiếu số tháng/năm, nước/chất thải, nhân sự, đào tạo, KNK và giá trị kinh tế của mẫu giả định; không nhập mẫu vào kho dữ liệu thực.
- Sổ trích nguồn Eclat có 25 KPI, kỳ, đơn vị, phạm vi và trang in/PDF. Giữ sáu ngoại lệ nguồn, phân biệt số công bố và phép tính tự thực hiện; không tạo dữ liệu tháng Eclat từ số năm. Kiểm ảnh trang 58,138,143,148 khi cần làm rõ bảng.
- Chromium tạo thử bản in tham chiếu Eclat 12 trang A4, giữ nhãn nguồn và nội dung cuối báo cáo; đã xem bảng KPI/ngoại lệ và giao diện desktop/mobile. Không có lỗi JavaScript trong kiểm tra trực quan.
- Các trang mới tải riêng bằng dynamic import; build hiện tại mỗi JS chunk dưới 250 kB, không thêm dependency. Các tài liệu HTML tải về giữ nội dung và liên kết dẫn về web; renderer không thực thi HTML hoặc javascript: từ Markdown.
- PostgreSQL 110 assertion là kết quả phiên bản nền đã chạy trước đó, không chạy lại ở đợt này vì không thay migration/RPC/quyền dữ liệu.

Phần chuẩn bị cloud đã lưu script và allowlist cần thiết vào draft; quyền mạng bổ sung được cấp theo turn đã cho phép đọc nguồn và site. Draft không tự publish hoặc bảo đảm quyền truy cập cho lượt làm việc sau.

## Xác minh Vercel sau push

Đã đối chiếu https://mitbittubi.vercel.app sau push commit tính năng `9bd806a555c4aeabc074a12e40a55c82525dea09`. Trang HTML trả HTTP 200, trỏ đúng entry `index-CDRlAwBb.js`. Các gói entry, `ReportLibrary-MU0HrUYr.js` và `WorkflowGuide-CS5-qOU1.js` trả HTTP 200 và trùng từng byte với build local đã kiểm thử. Điều này xác nhận Vercel phục vụ mã mới; các kiểm thử tương tác đầy đủ chạy trên bản production local tương ứng. Không tuyên bố đã kiểm tra Auth/Storage/Supabase thật hoặc kết quả GitHub Actions qua API.
