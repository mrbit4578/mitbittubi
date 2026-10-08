# ESG Hub

Ứng dụng React/TypeScript dành cho doanh nghiệp học ESG, tổ chức công việc, thu thập dữ liệu có bằng chứng và lập báo cáo theo kỳ. Triển khai frontend trên Vercel; Supabase cung cấp đăng nhập, dữ liệu theo doanh nghiệp và phân quyền.

## Chạy trên máy phát triển

Yêu cầu Node.js 24 và npm. Dùng checkout hiện tại; mỗi tác vụ Codex đã có môi trường riêng, không cần tạo Git worktree.

```sh
cd /workspace/mitbittubi
npm ci
npm run dev
```

Không cấu hình Supabase: ứng dụng chạy **sandbox**, lưu dữ liệu thử nghiệm trên trình duyệt. Không dùng chế độ này để cộng tác hoặc lưu dữ liệu doanh nghiệp thật. Tệp bằng chứng tải lên trong sandbox chỉ tồn tại trong phiên hiện tại; metadata và liên kết ngoài được lưu trên trình duyệt. Xuất JSON để lưu bản sao dữ liệu; đây chưa phải quy trình khôi phục backup production.

Cấu hình một trong hai biến Supabase mà thiếu biến còn lại là lỗi cấu hình, không phải lý do tự động chuyển sang sandbox. Chỉ dùng URL dự án và khóa public/anon của Supabase trong frontend; không đưa `service_role`, mật khẩu DB hoặc Vercel token vào biến `VITE_*`.

```sh
npm test
npm run build
npm run test:e2e
```

Các kiểm thử trình duyệt dùng Playwright Chromium. Trên máy chưa có browser: `npx playwright install chromium`. Trong môi trường cloud đã có Chromium: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`.

## Kết nối dữ liệu và đưa web lên mạng

Làm theo [hướng dẫn Supabase và Vercel](docs/DEPLOYMENT.md). `vercel.json` đã thiết lập build Vite, thư mục `dist` và SPA routing. Sau khi import GitHub repo vào Vercel, push vào `main` sẽ tự động tạo production deployment theo cấu hình Git integration của Vercel.

Chưa cấu hình Supabase thì deployment chỉ cung cấp sandbox. Tạo dự án Supabase, chạy migration, bật xác minh email và cấu hình URL trước khi dùng dữ liệu thật. Không có dự án Vercel hoặc Supabase được tự tạo trong quá trình chuẩn bị mã nguồn này.

## Phạm vi

- Học, hỏi đáp từ tài liệu, đánh giá sẵn sàng, lộ trình và giao việc.
- Từ điển KPI, dữ liệu tháng, bằng chứng, phê duyệt và khóa kỳ.
- Kiểm kê KNK theo kỳ, chủ đề trọng yếu, CAPA và sổ nghĩa vụ.
- Báo cáo, xuất Excel, xuất JSON và lịch sử thay đổi.
- Doanh nghiệp có dữ liệu riêng; vai trò owner/editor/reviewer/viewer trong chế độ Supabase.

Đây là công cụ quản lý và chuẩn bị báo cáo. Điểm tự đánh giá không phải chứng nhận ESG; nội dung thư viện không thay thế nguồn pháp luật hiện hành hoặc thẩm định độc lập. Phương pháp, ranh giới, bằng chứng và kết quả duyệt phải được doanh nghiệp xác lập.

Xem [audit và kế hoạch kaizen](docs/AUDIT.md), [quy tắc chất lượng dữ liệu](docs/DATA_QUALITY.md) và [kết quả xác minh](docs/VALIDATION.md). Inventory ZIP gốc: [archive-inventory.json](docs/archive-inventory.json).
