# ESG Hub

Ứng dụng React/TypeScript dành cho doanh nghiệp học ESG, tổ chức công việc, thu thập dữ liệu có bằng chứng và lập báo cáo theo kỳ. Triển khai frontend trên Vercel; Supabase cung cấp đăng nhập, dữ liệu theo doanh nghiệp và phân quyền.

## Audit, báo cáo mẫu và sơ đồ thao tác

Mở trên web sau deployment mới:

- [Audit & Kaizen](https://mitbittubi.vercel.app/#project-audit): phát hiện mã nguồn ZIP, biện pháp cải tiến và các điểm cần làm rõ trong PDF Eclat.
- [Khung báo cáo ESG](https://mitbittubi.vercel.app/#report-kit): 19 phần, trách nhiệm, bằng chứng, checklist và chỉ mục GRI.
- [Báo cáo tham chiếu](https://mitbittubi.vercel.app/#report-example): mặc định là mẫu tiếng Việt bám Eclat 2024, 21 phần và 25 KPI có trang nguồn. Nút riêng mở mẫu giả định 20 chương để luyện nhập liệu.
- [Hướng dẫn & sơ đồ](https://mitbittubi.vercel.app/#guide): mindmap sáu nhóm công việc, lưu trình tám bước, hướng dẫn theo vai trò và đường trả sửa.

Các tài liệu đọc trên web, tải Markdown/HTML, in PDF; KPI mẫu tải Excel và mindmap tải SVG. Số liệu Eclat và giả định chỉ để tham khảo, không được tự nhập vào dữ liệu của doanh nghiệp. Màn Nhật ký thay đổi vẫn ghi thao tác; báo cáo audit có mục menu riêng.

Tài liệu nguồn trong GitHub: [khung](docs/ESG_REPORT_OUTLINE.md), [mẫu Eclat](docs/ESG_REPORT_ECLAT_REFERENCE.md), [sổ trích nguồn](docs/eclat-source-register.json), [mẫu giả định](docs/ESG_REPORT_EXAMPLE.md), [hướng dẫn](docs/WORKFLOW_GUIDE.md). Mẫu bám PDF người dùng cung cấp, giữ phạm vi và các chênh lệch trong báo cáo; không chuyển assurance của Eclat thành xác nhận cho hệ thống hoặc doanh nghiệp khác.

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
