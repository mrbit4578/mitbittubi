# Kết nối GitHub → Vercel và Supabase

## 1. Tạo Supabase

1. Tạo project trong tài khoản Supabase của doanh nghiệp. Chọn khu vực phù hợp với yêu cầu lưu trữ dữ liệu.
2. Trong SQL Editor, chạy các file `supabase/migrations/*.sql` theo thứ tự tên. Migration tạo bảng, kiểm tra dữ liệu, RLS, RPC và kho bằng chứng riêng. Đừng chỉ tạo bảng mà bỏ policies/functions.
3. Bật Email/Password và xác nhận email trong Authentication. Trong URL Configuration đặt Site URL bằng domain production Vercel, rồi thêm URL preview cần thử vào Redirect URLs. Chỉ thêm domain do bạn kiểm soát.
4. Lấy Project URL và khóa **anon/public** từ API settings. Tuyệt đối không dùng service-role key ở frontend.
5. Đăng ký và xác nhận email; tạo doanh nghiệp trên ứng dụng. Owner mời thành viên theo email và vai trò. Thành viên đăng nhập bằng email đã xác minh rồi nhận lời mời. Dữ liệu giữa hai doanh nghiệp phải tách biệt.

## 2. Import GitHub repo vào Vercel

1. Trong Vercel, chọn Add New → Project → Import Git Repository: `mrbit4578/mitbittubi`.
2. Framework: Vite. Root Directory: gốc repo. Node.js: 24.x. Install: `npm ci`; Build: `npm run build`; Output: `dist` (đã có trong `vercel.json`).
3. Trong Environment Variables thêm:

| Tên | Giá trị |
| --- | --- |
| `VITE_SUPABASE_URL` | URL HTTPS của project Supabase |
| `VITE_SUPABASE_ANON_KEY` | khóa anon/public của cùng project |

4. Chọn môi trường Production; cấu hình Preview chỉ với backend thử nghiệm phù hợp. Giá trị `VITE_*` được nhúng lúc build nên cần Redeploy sau khi thay đổi.
5. Deploy. Trong Git settings chọn Production Branch = `main`, bật deployment cho push. Vercel tự nhận commit mới thông qua Git integration; không cần đưa Vercel token vào repo.
6. Dùng domain đã cấp để cập nhật Supabase Site URL/Redirect URLs. Không cần hardcode domain Vercel trong source.

Chưa thêm hai biến trên: Vercel vẫn build và phục vụ sandbox. Chế độ này không đồng bộ dữ liệu giữa người dùng.

## 3. Nghiệm thu trước khi dùng dữ liệu thật

- Đăng ký, xác minh email, đăng nhập/đăng xuất, tạo hai doanh nghiệp, mời editor/reviewer/viewer.
- Người ngoài hoặc thành viên doanh nghiệp A không đọc/sửa bản ghi hay mở tệp của B.
- Viewer không ghi; editor không tự phê duyệt dữ liệu của mình; reviewer phê duyệt có danh tính và dấu thời gian.
- Tạo bằng chứng, nhập dữ liệu, duyệt, khóa kỳ. Thử sửa/xóa/import/thêm vào kỳ khóa phải bị từ chối ở server.
- Mở khóa có lý do và lịch sử. Thay đổi đồng thời dùng version để phát hiện xung đột.
- Báo cáo chính thức dùng dữ liệu đúng kỳ, đúng đơn vị, đã duyệt/khóa; tỷ lệ dùng tử số/mẫu số. Kiểm tra snapshot đã phát hành bất biến.
- Thử tải tệp nguồn bằng signed URL; URL hết hạn và người không có quyền không tải được.
- Lập chính sách retention, backup, khôi phục và quyền truy cập cho từng doanh nghiệp.

Các kiểm tra này trong project Supabase/Vercel thật vẫn cần chạy sau khi bạn tạo và kết nối tài khoản. Build trong cloud không chứng minh deployment production đã hoạt động.

## 4. Phát triển trong Codex cloud

Sử dụng `/workspace/mitbittubi`, không tạo Git worktree nếu không có yêu cầu. Chạy `npm ci`, `npm test`, `npm run build`, sau đó `npm run dev -- --port 5173`. Kiểm tra bằng request nội bộ và browser; không dùng link localhost làm link xuất bản.

Dependency installation dùng registry npm; Git dùng proxy HTTPS có sẵn. Khi dùng Supabase trong cloud cần cho phép hostname project tương ứng (`<project-ref>.supabase.co`) trong network settings; giữ các domain đã có. Cấu hình URL/anon key trong settings hoặc `.env.local` được ignore; không commit giá trị.
