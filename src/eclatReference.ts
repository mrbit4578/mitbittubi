import type { Sheet } from "./xlsx";
export const ECLAT_SOURCE = "https://eclatglobal.s3.amazonaws.com/uploads/2025/10/2024_eclat_ESG-Report_en.pdf";
export const ECLAT_WARNING = "THAM CHIẾU ECLAT 2024 — dữ liệu công bố của Eclat, không phải kết quả ESG của doanh nghiệp bạn.";
export const eclatSource = { url: ECLAT_SOURCE, filename: "2024_eclat_ESG-Report_en.pdf", bytes: 39637351, pdfPages: 85, sha256: "11eeb02e9051c77f694ffb268db713b6051524c032d289281bc0bd1365bae833", reviewedAt: "2026-10-08", period: "2024-01-01/2024-12-31", note: "Đọc các chương, bảng và phụ lục được dẫn; đối chiếu ảnh các bảng có chênh lệch. Không tái kiểm chứng dữ liệu vận hành hoặc tổ chức assurance mới." };
export type SourceMetric = { code: string; label: string; unit: string; value2023: number | null; value2024: number; scope: string; printedPage: number; quality: string; method: string; evidence: string };
export const eclatMetrics: SourceMetric[] = [
  { code: "FIN-REV", label: "Doanh thu hoạt động", unit: "nghìn NTD", value2023: 30790462, value2024: 36828499, scope: "Tập đoàn, thông tin tài chính hợp nhất", printedPage: 35, quality: "Số công bố", method: "Giữ đơn vị NTD thousand của bảng nguồn", evidence: "Báo cáo tài chính / sổ cái hợp nhất" },
  { code: "FIN-NET", label: "Lợi nhuận sau thuế", unit: "nghìn NTD", value2023: 5176467, value2024: 6640852, scope: "Tập đoàn", printedPage: 35, quality: "Số công bố", method: "Không đồng nhất với giá trị kinh tế giữ lại", evidence: "Báo cáo tài chính" },
  { code: "HR-END", label: "Nhân viên cuối kỳ", unit: "người", value2023: 18615, value2024: 20668, scope: "Toàn cầu; 31/12/2024", printedPage: 10, quality: "Số công bố; xem thêm tr.53", method: "Headcount cuối kỳ, không cộng tháng", evidence: "HR tổng hợp theo cơ sở và hợp đồng" },
  { code: "HR-TRAIN", label: "Tổng giờ đào tạo theo thuyết minh", unit: "giờ", value2023: null, value2024: 365369, scope: "Theo thuyết minh đào tạo Eclat; con số xấp xỉ", printedPage: 57, quality: "Cần làm rõ với biểu đồ tr.58", method: "Giữ số nguồn, chưa lấy làm tổng đã đối chiếu", evidence: "Nhật ký đào tạo từng khóa, người tham gia, giờ" },
  { code: "HR-TURN-TW", label: "Tỷ lệ nghỉ việc Đài Loan", unit: "%", value2023: 14.9, value2024: 13.92, scope: "Các cơ sở Đài Loan theo overview", printedPage: 10, quality: "Số công bố", method: "Giữ tỷ lệ nguồn; mẫu số phải xác lập khi áp dụng", evidence: "HR tuyển/nghỉ và phương pháp mẫu số" },
  { code: "HR-FM-TW", label: "Nữ trong vị trí quản lý Đài Loan", unit: "%", value2023: 53.6, value2024: 57.94, scope: "Vị trí quản lý tại Đài Loan theo overview", printedPage: 10, quality: "Số công bố", method: "Không áp tỷ lệ này cho nhân viên toàn tập đoàn", evidence: "Danh sách cấp quản lý theo định nghĩa" },
  { code: "OHS-CASES", label: "Sự kiện chấn thương nơi làm việc", unit: "sự kiện", value2023: null, value2024: 36, scope: "Theo thuyết minh an toàn Eclat", printedPage: 82, quality: "Số công bố", method: "Không tự suy tỷ suất nếu thiếu giờ làm tương ứng", evidence: "Sổ tai nạn và điều tra" },
  { code: "OHS-DAYS", label: "Ngày công mất do chấn thương", unit: "ngày", value2023: null, value2024: 431, scope: "Theo thuyết minh an toàn Eclat", printedPage: 82, quality: "Số công bố", method: "Không dùng như số ca", evidence: "Theo dõi nghỉ và hồ sơ điều tra" },
  { code: "GHG-1", label: "Scope 1", unit: "tCO2e", value2023: 28225.17, value2024: 31029.99, scope: "Tập đoàn gồm trụ sở và công ty con hợp nhất", printedPage: 136, quality: "Số công bố; cần làm rõ bảng loại khí tr.138", method: "Giữ bảng kiểm kê; không thay bằng tổng khác ở tr.138", evidence: "Kiểm kê theo nguồn, hệ số/GWP, xác minh KNK" },
  { code: "GHG-2", label: "Scope 2 theo bảng nguồn", unit: "tCO2e", value2023: 90560.75, value2024: 94968.69, scope: "Tập đoàn theo bảng kiểm kê", printedPage: 136, quality: "Số công bố; chưa có cặp location/market tách đủ", method: "Không tự gắn kết quả thứ hai; tham khảo hệ số tr.138", evidence: "Điện/hơi, phương pháp và công cụ hợp đồng nếu áp dụng" },
  { code: "GHG-12", label: "Scope 1 + 2", unit: "tCO2e", value2023: 118785.91, value2024: 125998.68, scope: "Tập đoàn gồm trụ sở", printedPage: 136, quality: "Số công bố", method: "31.029,99 + 94.968,69 = 125.998,68", evidence: "Tổng kiểm kê theo ranh giới" },
  { code: "GHG-3", label: "Scope 3 được Eclat kiểm kê", unit: "tCO2e", value2023: 9881.73, value2024: 10535.73, scope: "Các nguồn/nhóm được Eclat chọn; không suy đủ 15 nhóm", printedPage: 136, quality: "Số công bố; xem tr.137,161", method: "Giữ giới hạn các nhóm và mở rộng vận tải biển năm 2023", evidence: "Dữ liệu và phương pháp theo từng category" },
  { code: "GHG-ALL", label: "Scope 1 + 2 + 3 trong phạm vi nguồn", unit: "tCO2e", value2023: 128667.64, value2024: 136534.41, scope: "Tổng trong bảng kiểm kê công bố", printedPage: 136, quality: "Số công bố", method: "125.998,68 + 10.535,73 = 136.534,41", evidence: "Bảng kiểm kê/xác minh cùng phạm vi" },
  { code: "GHG-I-FAB", label: "Cường độ KNK khối vải", unit: "tCO2e/tấn sản xuất", value2023: 4.04, value2024: 3.89, scope: "Fabric Division, Scope 1 + 2", printedPage: 136, quality: "Số công bố, đã làm tròn", method: "100.415,67 / 25.783 ≈ 3,89; không dùng sản lượng bán", evidence: "Sản lượng sản xuất cùng ranh giới kiểm kê" },
  { code: "GHG-I-GAR", label: "Cường độ KNK khối may", unit: "tCO2e/nghìn tá sản xuất", value2023: 4.39, value2024: 3.85, scope: "Garment Division, Scope 1 + 2", printedPage: 136, quality: "Số công bố, đã làm tròn", method: "23.011,03 / (5.964.852/1.000) ≈ 3,86; giữ 3,85 như nguồn và cần đối chiếu số gốc", evidence: "Sản lượng/tính cường độ chưa làm tròn" },
  { code: "ENERGY-KJ", label: "Tổng năng lượng", unit: "kJ", value2023: 1166745915765, value2024: 1254171385073, scope: "Tập đoàn, gồm trụ sở", printedPage: 140, quality: "Số công bố; đơn vị chi tiết tr.141", method: "1.254.171.385.073 kJ / 1.000.000 = 1.254.171,385073 GJ", evidence: "Đồng hồ/hóa đơn/nhiệt trị, năng lượng mua/tự tạo" },
  { code: "SOLAR-TW", label: "Năng lượng tái tạo dùng ở Đài Loan", unit: "kWh", value2023: null, value2024: 3199244, scope: "Cơ sở sản xuất Đài Loan, bảng renewable", printedPage: 140, quality: "Số công bố", method: "Giữ bảng theo vùng; không suy tỷ lệ tái tạo toàn cầu", evidence: "Đo phát điện, điện dùng/bán và chứng từ" },
  { code: "SOLAR-VN", label: "Năng lượng tái tạo dùng ở Việt Nam", unit: "kWh", value2023: null, value2024: 3441958, scope: "Cơ sở sản xuất Việt Nam, bảng renewable", printedPage: 140, quality: "Số công bố", method: "Tỷ lệ nguồn 5,9%; không coi mọi cơ sở đạt 10%", evidence: "Đo điện và ranh giới cơ sở" },
  { code: "WATER-GROUP", label: "Tổng nước theo bảng tổng hợp", unit: "m³", value2023: 2431033, value2024: 2685208, scope: "Tập đoàn; nguồn gọi Total water consumption", printedPage: 143, quality: "Cần làm rõ tổng và định nghĩa nước", method: "Không đồng nhất nước lấy, sử dụng gồm tái dùng và tiêu thụ GRI", evidence: "Cân bằng nguồn nước, tái dùng, lưu trữ và xả" },
  { code: "WATER-DIS", label: "Tổng nước xả", unit: "m³", value2023: null, value2024: 1750588, scope: "Các cơ sở trong bảng nước thải", printedPage: 146, quality: "Số công bố", method: "Không trừ khỏi tổng nước tr.143 khi phạm vi/định nghĩa chưa chốt", evidence: "Đo xả, nơi nhận, chất lượng, phương pháp xử lý" },
  { code: "WASTE-TOTAL", label: "Tổng chất thải", unit: "kg", value2023: 14291989, value2024: 14616916, scope: "Tập đoàn trong bảng chất thải", printedPage: 148, quality: "Số công bố; một dòng khối may có chênh lệch", method: "14.347.015 không nguy hại + 269.901 nguy hại", evidence: "Phiếu cân, phân loại và chứng từ xử lý" },
  { code: "YARN-R", label: "Tỷ lệ sợi tái chế mua", unit: "%", value2023: 21.14, value2024: 25.81, scope: "Sợi mua theo bảng nguồn; không phải mọi vật liệu/sản phẩm", printedPage: 119, quality: "Số công bố", method: "Mua sợi tái chế / tổng mua sợi; lưu ý cập nhật cách tính từ 2023", evidence: "Sổ mua sợi và hồ sơ GRS theo phạm vi" },
  { code: "LOCAL-TW", label: "Mua nguyên liệu địa phương Đài Loan", unit: "%", value2023: 91.97, value2024: 92.74, scope: "Các nhà máy được liệt kê tr.118", printedPage: 118, quality: "Số công bố", method: "Không gộp với Việt Nam hoặc tính toàn bộ chuỗi", evidence: "Chi tiêu và định nghĩa địa phương" },
  { code: "LOCAL-VN", label: "Mua nguyên liệu địa phương Việt Nam", unit: "%", value2023: 44.71, value2024: 33.9, scope: "Nhà máy vải Việt Nam; loại các cơ sở bị nhãn hàng chỉ định nguồn", printedPage: 118, quality: "Số công bố", method: "Không diễn giải là tỷ lệ mọi cơ sở Việt Nam", evidence: "Sổ mua, cơ sở được bao gồm/loại trừ" },
  { code: "SUP-FEM", label: "Nhà cung cấp chính cấp 1 có FEM hoặc tương đương", unit: "%", value2023: 66.67, value2024: 69.57, scope: "Key Tier 1 theo định nghĩa/loại trừ tr.120–121", printedPage: 120, quality: "Số công bố", method: "Không coi là 69,57% tất cả nhà cung cấp hoặc chứng nhận toàn chuỗi", evidence: "Danh sách mẫu số, đánh giá, tiêu chí tương đương" },
];
export const eclatIssues = [
  { code: "SRC-01", title: "Chất thải khối may không khớp", pages: [12, 148, 150], finding: "Tr.148 ghi 10.329.559 kg ở dòng khối may 2024. Tr.12 ghi 4.029.218 kg; tr.150 có 4.023.337 + 5.881 = 4.029.218 kg. Không tự sửa số nguồn; giữ bảng chi tiết và báo ngoại lệ.", action: "Chủ dữ liệu đối chiếu phiếu cân/tổng hợp khối may, xác nhận số gốc và phát hành điều chỉnh nếu cần." },
  { code: "SRC-02", title: "Giờ đào tạo tổng và theo vùng khác nhau", pages: [57, 58], finding: "Tr.57 nêu khoảng 365.369 giờ. Biểu đồ tr.58 là 139.444,46 + 238.381 + 9.163 + 8.065,28 = 395.053,74 giờ. Chênh 29.684,74 giờ; cần làm rõ phạm vi/cách tính.", action: "HR đối chiếu người-lượt tham gia, khóa đào tạo, giờ và kỳ; không chuyển 188.465 lượt thành số nhân viên duy nhất." },
  { code: "SRC-03", title: "Tổng theo loại khí khác Scope 1", pages: [136, 138, 161], finding: "Tr.136 Scope 1 là 31.029,99 tCO2e; tr.138 bảng theo khí ghi tổng 30.999,99. Tr.161 ghi Scope 1 31.029,9857. Cần giải thích chênh lệch khoảng 30 tCO2e và phạm vi của bảng theo khí.", action: "EHS đối chiếu nguồn, khí, ranh giới và dữ liệu chưa làm tròn; không chọn số nhỏ hơn để thay tổng." },
  { code: "SRC-04", title: "Nước tổng và cộng cơ sở chưa khớp", pages: [143, 144, 167], finding: "Tr.143 tổng là 2.685.208 m³, nhưng 34.464 trụ sở + 2.028.198 khối vải + 650.460 khối may = 2.713.122 m³. Chênh 27.914 m³. Khối vải gồm 520.275 m³ tái dùng, nên định nghĩa nước cần kiểm trước khi dùng như nước lấy/tiêu thụ.", action: "Đối chiếu nguồn nước, tái dùng và phạm vi; không tính water consumption theo phép trừ đơn giản từ hai bảng chưa cùng định nghĩa." },
  { code: "SRC-05", title: "Đơn vị năng lượng ở overview gây nhầm", pages: [11, 140, 141], finding: "Tr.11 biểu đồ Total Energy Use ghi Unit: ton CO2e. Bảng chi tiết tr.140–141 là kJ. Mẫu dùng số kJ chi tiết, quy đổi GJ được đánh dấu là phép tính.", action: "Chốt đơn vị trong từ điển KPI và kiểm chéo overview với phụ lục trước phát hành." },
  { code: "SRC-06", title: "Tổng giảm phát thải dự án cần đối chiếu", pages: [142], finding: "8 dòng kết quả dự án tr.142 cộng thành 6.125,96 tCO2e/năm, trong khi dòng Total ghi 4.974,15. Chênh 1.151,81; chưa rõ chồng lấn hoặc lỗi tổng. Không khấu trừ tổng dự án khỏi kiểm kê gross.", action: "Đối chiếu phạm vi từng dự án, hệ số riêng, khoảng thời gian và loại bỏ đếm trùng với nguồn vận hành." },
];
export const pdfPageForPrinted = (page: number) => Math.floor(page / 2) + 1;
const fmt = (value: number, digits = 2) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value);
const cite = (page: number) => `[tr. in ${page}; PDF ${pdfPageForPrinted(page)}](${ECLAT_SOURCE}#page=${pdfPageForPrinted(page)})`;
const table = (headers: string[], rows: (string | number)[][]) => `| ${headers.join(" | ")} |\n| ${headers.map(() => "---").join(" | ")} |\n${rows.map(row => `| ${row.join(" | ")} |`).join("\n")}`;
export function eclatSheets(): Sheet[] {
  return [
    { name: "DOC_TRUOC", rows: [[ECLAT_WARNING], ["Nguồn", ECLAT_SOURCE], ["Kỳ", eclatSource.period], ["PDF SHA-256", eclatSource.sha256], ["Đối chiếu", eclatSource.reviewedAt], ["Trạng thái", "Số do Eclat công bố; không được ESG Hub assurance lại"], ["Lưu ý", "Có các chênh lệch nguồn cần làm rõ; không nhập vào kho dữ liệu doanh nghiệp bạn"]] },
    { name: "KPI_Eclat_nguon", rows: [["Mã tham chiếu", "Tên", "Đơn vị", 2023, 2024, "Phạm vi", "Trang in", "Trang PDF", "Chất lượng", "Phương pháp/lưu ý", "Bằng chứng cần có"], ...eclatMetrics.map(row => [row.code, row.label, row.unit, row.value2023, row.value2024, row.scope, row.printedPage, pdfPageForPrinted(row.printedPage), row.quality, row.method, row.evidence])] },
    { name: "Ngoai_le_nguon", rows: [["Mã", "Vấn đề", "Trang in", "Phát hiện", "Cách xử lý"], ...eclatIssues.map(row => [row.code, row.title, row.pages.join(", "), row.finding, row.action])] },
    { name: "Quy_doi_DANH_DAU", rows: [["Chỉ tiêu", "Giá trị", "Đơn vị", "Cách tính / trạng thái"], ["Năng lượng 2024", 1254171.385073, "GJ", "Tự quy đổi từ tr.140: kJ / 1.000.000"], ["Năng lượng tái tạo TW+VN", 6641202, "kWh", "Tự cộng hai vùng tr.140, không suy tỷ lệ tái tạo toàn tập đoàn"], ["Chất thải khối may theo chi tiết", 4029218, "kg", "Tự cộng tr.150; có xung đột tr.148"], ["Cường độ khối may tính lại", 23011.03 / (5964852 / 1000), "tCO2e/nghìn tá", "Tự tính từ tr.136, khác làm tròn 3,85 trong nguồn; cần số gốc"]] },
  ];
}
export function buildEclatReport(): string {
  return `# Mẫu báo cáo ESG tham chiếu — Eclat 2024

**${ECLAT_WARNING}** Đây là bản biên soạn tiếng Việt để học cấu trúc và cách ghi nhận, bám các chương và số liệu trong PDF người dùng cung cấp. Không phải bản dịch chính thức, không thay thế báo cáo gốc và không chuyển chữ ký/assurance của Eclat sang doanh nghiệp khác. Phiên bản 1.0, đối chiếu ngày 08/10/2026.

## 01. Bìa, kỳ báo cáo và thông tin nguồn

Tên tổ chức nguồn: Eclat Textile Co., Ltd.; năm báo cáo 2024, kỳ 01/01/2024–31/12/2024. Theo báo cáo, đơn vị tiền tệ mặc định là NTD và ranh giới tổng thể tương ứng các đơn vị hợp nhất; từng chỉ tiêu có thể có phạm vi riêng. Báo cáo ghi phát hành tháng 08/2025 và chu kỳ hằng năm. Các thông tin này được giữ theo nguồn lịch sử, không cập nhật suy đoán đến năm 2026. Nguồn: ${cite(4)}, ${cite(5)}.

PDF nguồn có 85 trang, phần lớn là trang đôi: trang PDF 3 chứa trang in 4–5. Các dẫn chiếu dưới đây ghi cả hai số. Tệp tải từ [URL do người dùng cung cấp](${ECLAT_SOURCE}) có SHA-256 ${eclatSource.sha256}, kích thước ${fmt(eclatSource.bytes)} byte. Hash nhận diện bản tài liệu đã đối chiếu, không xác minh tính đúng của số liệu bên trong.

Mã nội bộ của tài liệu học: REF-ECLAT-2024-v1.0. Người biên soạn khung: ESG Hub; không có người ký/phê duyệt của doanh nghiệp bạn. Khi lập bản thật phải thay tên pháp nhân, kỳ, phạm vi, nguồn và hồ sơ phê duyệt bằng dữ liệu của mình.

## 02. Thông điệp và tóm tắt điều hành

Thông điệp Eclat nhấn mạnh đổi mới sản phẩm, hợp tác chuỗi cung ứng, phát triển nhân tài, quản trị bền vững và bảo vệ tài nguyên. Bối cảnh kinh doanh 2024 là đơn hàng phục hồi cùng nhu cầu nghiên cứu sản phẩm có giá trị cao. Bài học cho báo cáo doanh nghiệp: nối bối cảnh kinh doanh với tác động, hành động và kết quả đo được, đồng thời công khai giới hạn. Nguồn: ${cite(6)}, ${cite(7)}.

Năm 2024, Eclat công bố doanh thu hoạt động 36.828.499 nghìn NTD, 20.668 nhân viên cuối kỳ, Scope 1 + 2 là 125.998,68 tCO2e và tỷ lệ sợi tái chế mua 25,81%. Tổng KNK tăng so với 2023 trong khi cường độ sản xuất của hai khối giảm theo báo cáo. Không diễn giải giảm cường độ thành giảm tổng phát thải. Nguồn: ${cite(35)}, ${cite(53)}, ${cite(136)}, ${cite(119)}.

## 03. Hồ sơ tổ chức, hoạt động và chuỗi giá trị

Eclat thành lập ngày 28/11/1977, mã cổ phiếu 1476, gồm khối vải và khối may. Cơ sở ở Đài Loan, Việt Nam, Campuchia và Indonesia được mô tả trong báo cáo. Hoạt động chính là dệt/vải và quần áo; không phải doanh nghiệp sản xuất giày như đối tượng thiết kế ESG Hub. Mẫu này học cách tổ chức báo cáo, không áp benchmark ngành một cách trực tiếp. Nguồn: ${cite(16)}, ${cite(17)}, ${cite(18)}.

Trang hồ sơ công ty ghi lượng bán 21.253 tấn vải và 8.557.622 tá quần áo. Bảng cường độ KNK dùng SẢN LƯỢNG SẢN XUẤT 25.783 tấn và 5.964.852 tá. Hai loại mẫu số khác nhau; không thay thế cho nhau để tạo cường độ mới. Nguồn: ${cite(16)}, ${cite(136)}.

Chuỗi giá trị được mô tả từ sợi/nguyên liệu, nhà cung cấp và bên gia công tới sản xuất, thương hiệu/khách hàng và thị trường. Các nguyên liệu bị thương hiệu chỉ định được loại khỏi một số tỷ lệ mua địa phương/đánh giá; phải giữ giới hạn này khi tham chiếu. Nguồn: ${cite(118)}, ${cite(120)}, ${cite(121)}.

## 04. Cơ sở lập báo cáo và phương pháp

Eclat trình bày GRI Standards 2021, TCFD, SASB ngành apparel/accessories/footwear và quy định báo cáo doanh nghiệp niêm yết Đài Loan. Chỉ mục nguồn tr.154 có tuyên bố sử dụng GRI của Eclat; tài liệu tham chiếu này không đưa ra tuyên bố tuân thủ riêng. Doanh nghiệp Việt Nam phải xác lập khung/pháp luật áp dụng cho mình. Nguồn: ${cite(4)}, ${cite(154)}, ${cite(162)}, ${cite(163)}.

Kiểm kê KNK nguồn dùng phương pháp kiểm soát vận hành, ISO 14064-1:2018; nguồn ghi GWP từ IPCC AR6 và các hệ số theo nguồn/địa lý. Dữ liệu sản xuất, điện, nhiên liệu, nước và nhân sự cần giữ ranh giới riêng. Không áp hệ số Đài Loan/Việt Nam trong báo cáo này cho năm/cơ sở khác mà chưa kiểm phiên bản. Nguồn: ${cite(136)}, ${cite(138)}.

Bảng nguồn có một số chênh lệch được công bố ở chương 16 của mẫu. Nhãn “số công bố” chỉ có nghĩa đã đọc thấy trong PDF, không có nghĩa đã kiểm chứng tại nhà máy. Phép tính do ESG Hub thực hiện được đánh dấu riêng; số mâu thuẫn không bị sửa âm thầm.

## 05. Tham vấn các bên liên quan

Eclat xác định sáu nhóm: khách hàng/nhãn hàng, nhân viên, cổ đông/nhà đầu tư, nhà cung cấp/bên thứ ba, cơ quan nhà nước và cư dân cộng đồng. Nguồn mô tả khảo sát từ kỳ trước để xác lập trọng yếu, với 185 phiếu bên liên quan, tỷ lệ hợp lệ 71,4%, và 19 phiếu lãnh đạo/thành viên ESG, tỷ lệ hợp lệ 79%. Không gọi toàn bộ 185 phiếu là hợp lệ hoặc giả định khảo sát mới được thực hiện năm 2024. Nguồn: ${cite(39)}, ${cite(40)}.

Báo cáo dùng họp, email, điện thoại, kênh phản ánh và các nhịp trao đổi theo nhóm. Khi áp dụng trên ESG Hub: lưu phương pháp, thời điểm, nhóm được tham vấn, kết quả và phản hồi ở Chủ đề trọng yếu/Hỏi đáp; lưu biên bản có quyền truy cập trong Sổ bằng chứng. Nguồn: ${cite(48)}.

## 06. Chủ đề trọng yếu và quản lý tác động

Eclat sàng lọc 23 vấn đề và xác định sáu chủ đề trọng yếu: quản trị doanh nghiệp; tuân thủ pháp luật; thù lao và phúc lợi nhân viên; sản phẩm/công nghệ đổi mới; sức khỏe và an toàn nghề nghiệp; quản lý năng lượng và KNK. Nguồn mô tả khảo sát trước đó năm 2023 và kế hoạch khảo sát tiếp 2026; đây là kế hoạch lịch sử, chưa được mẫu xác minh đã thực hiện. Nguồn: ${cite(39)}, ${cite(40)}, ${cite(41)}.

Cách trình bày đáng tham khảo là mỗi chủ đề có tác động, vị trí chuỗi giá trị, chính sách/cam kết, mục tiêu, hành động/nguồn lực và đánh giá kết quả. Doanh nghiệp giày phải tự đánh giá tác động của mình, không sao chép sáu chủ đề như kết luận bắt buộc. Nguồn: ${cite(43)}, ${cite(44)}, ${cite(45)}, ${cite(46)}, ${cite(47)}.

## 07. Quản trị ESG, đạo đức và trách nhiệm

Ủy ban ESG của Eclat có năm nhóm về môi trường, nhân sự, quản trị, sản phẩm/dịch vụ và tham gia xã hội. Trang 29 mô tả 4 thành viên ủy ban, gồm 2 giám đốc độc lập, chủ tịch và tổng giám đốc; trong 2024 có 2 cuộc họp ủy ban và 16 cuộc họp nhóm theo quý. Hội đồng quản trị giám sát, nhóm thực thi thu dữ liệu và đội biên soạn tổng hợp. Nguồn: ${cite(29)}, ${cite(30)}.

Nguồn mô tả bộ quy tắc đạo đức, đào tạo, kênh khiếu nại, kiểm toán nội bộ và chống tham nhũng; tr.37 ghi không có vụ tham nhũng được xác nhận trong năm 2024. Đây là công bố của Eclat trong phạm vi báo cáo, không phải xác nhận của ESG Hub rằng rủi ro tham nhũng bằng 0. Nguồn: ${cite(36)}, ${cite(37)}, ${cite(38)}.

Trên web, chuyển trách nhiệm này thành owner/editor/reviewer/viewer. Vai trò và biên bản thật phải do doanh nghiệp xác lập; người nhập không tự duyệt trong cloud. Hướng dẫn theo vai trò không tự tạo cơ cấu Hội đồng quản trị hoặc chữ ký pháp lý.

## 08. Rủi ro, chiến lược và mục tiêu

Nguồn chia các rủi ro về khách hàng, tài chính, cung ứng, nhân tài và khí hậu; khung TCFD thể hiện giám sát, rủi ro/cơ hội và tác động tài chính dự kiến. Ví dụ một số giá trị là ước tính rủi ro/cơ hội, không phải chi phí hoặc tiết kiệm đã xảy ra. Nguồn: ${cite(32)}, ${cite(129)}, ${cite(133)}, ${cite(135)}.

Eclat ghi mục tiêu giảm cường độ KNK 20% đến 2030 so với năm cơ sở; cần đối chiếu năm cơ sở/ranh giới của từng khối trước khi dùng. Trang 138 mô tả cam kết thiết lập mục tiêu SBTi từ tháng 12/2024 và dự kiến nộp mục tiêu trong hai năm. Không chuyển “committed” thành mục tiêu đã được SBTi xác nhận, và không suy trạng thái hiện tại năm 2026 từ tài liệu 2024. Nguồn: ${cite(136)}, ${cite(138)}.

Trang 133/135 nêu mục tiêu tỷ lệ năng lượng tái tạo năm 2025: Đài Loan 10%, cơ sở ngoài nước 15%. Mục tiêu và kết quả 2024 là hai thông tin riêng; bảng renewable 2024 ghi Đài Loan 9,3%, Việt Nam 5,9%. Nguồn: ${cite(133)}, ${cite(135)}, ${cite(140)}.

## 09. Môi trường — năng lượng và tái tạo

Tổng năng lượng 2024 ở bảng chi tiết là 1.254.171.385.073 kJ. ESG Hub tự quy đổi thành 1.254.171,385073 GJ bằng chia 1.000.000; đây là quy đổi đơn vị, không phải kết quả đo mới. Bảng nguồn gồm năng lượng không tái tạo và tái tạo, cùng trụ sở. Nhãn ton CO2e ở biểu đồ năng lượng overview tr.11 không được dùng làm đơn vị nhập KPI. Nguồn: ${cite(140)}, ${cite(141)}.

Bảng theo vùng ghi năng lượng tái tạo dùng Đài Loan 3.199.244 kWh và Việt Nam 3.441.958 kWh, với tỷ lệ lần lượt 9,3% và 5,9%. Tự cộng hai vùng được 6.641.202 kWh, phù hợp cách làm tròn 6,64 triệu kWh ở thuyết minh. Không suy rằng hai tỷ lệ này là tỷ lệ toàn tập đoàn. Nguồn: ${cite(139)}, ${cite(140)}.

Mục cải tiến gồm thiết bị nhuộm, biến tần, điện mặt trời, LED và thay nhiên liệu. Tổng dự án carbon reduction có chênh lệch giữa cộng từng dòng và dòng Total, ghi tại chương 16; không trừ tổng dự án khỏi kiểm kê gross. Nguồn: ${cite(142)}.

## 10. Môi trường — kiểm kê khí nhà kính

${table(["Chỉ tiêu theo bảng nguồn", "2023 tCO2e", "2024 tCO2e", "Nguồn"], eclatMetrics.filter(row => ["GHG-1","GHG-2","GHG-12","GHG-3","GHG-ALL"].includes(row.code)).map(row => [row.label, fmt(row.value2023!), fmt(row.value2024), cite(row.printedPage)]))}

Scope 1 + 2 năm 2024: 31.029,99 + 94.968,69 = 125.998,68. Cộng Scope 3 được công bố: 125.998,68 + 10.535,73 = 136.534,41 tCO2e. Hai tổng có ranh giới khác nhau và phải được đặt tên đúng. Báo cáo mô tả lựa chọn Scope 3 theo dữ liệu có sẵn, gồm một số nhóm mua hàng/dịch vụ, nhiên liệu/năng lượng liên quan, vận tải đầu vào/đầu ra, công tác và chất thải. Không suy rằng đã đầy đủ 15 category. Nguồn: ${cite(136)}, ${cite(137)}, ${cite(161)}.

Cường độ nguồn là 3,89 tCO2e/tấn vải và 3,85 tCO2e/nghìn tá hàng may. Khi tính lại từ tổng công bố, giá trị may xấp xỉ 3,86; cần đối chiếu số gốc/cách làm tròn, không tự sửa 3,85. Không cộng hoặc so trực tiếp hai cường độ khác mẫu số. Nguồn: ${cite(136)}.

Bảng kiểm kê hiện được trích chưa tách đầy đủ cặp kết quả Scope 2 location-based/market-based. Mẫu không tự điền một kết quả còn thiếu hoặc cộng hai cách tính vào nhau. Hệ số điện được nguồn ghi là Đài Loan 0,474 kgCO2e/kWh và Việt Nam 0,6592 kgCO2e/kWh; hệ số dự án tiết kiệm tr.142 khác nên phải giữ hồ sơ phiên bản/mục đích, không dùng lẫn. Nguồn: ${cite(138)}, ${cite(142)}.

## 11. Môi trường — nước và nước thải

Bảng tổng hợp nguồn ghi 2.685.208 m³ nước năm 2024, dùng nhãn Total water consumption; khối vải 2.028.198 m³, khối may 650.460 m³. Phụ lục theo nguồn còn có 34.464 m³ tại trụ sở và 520.275 m³ nước tái dùng trong khối vải. Tổng/cách gọi này cần làm rõ; không chuyển trực tiếp thành nước lấy hoặc lượng tiêu thụ theo GRI. Nguồn: ${cite(143)}, ${cite(144)}, ${cite(167)}.

Tổng xả trong bảng nước thải là 1.750.588 m³, có nơi nhận và phương pháp xử lý theo cơ sở. Vì phạm vi/định nghĩa của bảng tổng nước còn chênh lệch, mẫu không tính nước tiêu thụ bằng 2.685.208 trừ 1.750.588. Kết quả kiểm nước thải có bảng riêng, không suy toàn bộ quan trắc đạt quy chuẩn của một doanh nghiệp Việt Nam khác. Nguồn: ${cite(146)}, ${cite(147)}.

Bài học nhập liệu: tách nước lấy bên ngoài, tái dùng, nước mưa, lưu trữ và xả; dùng cùng cơ sở/kỳ. Lưu bản đo/quan trắc, nơi nhận và phương pháp trong Sổ bằng chứng, ghi KPI khác nhau thay vì một tổng chung.

## 12. Môi trường — chất thải, hóa chất và thiên nhiên

Tổng chất thải tập đoàn nguồn là 14.616.916 kg, gồm 14.347.015 kg thông thường và 269.901 kg nguy hại. Bảng chi tiết khối vải/khối may phân tái chế, đốt và chôn lấp. Nguồn có một dòng khối may tr.148 không khớp tr.12/tr.150; mẫu giữ ngoại lệ, không nhập dòng này như số đã kiểm tra. Nguồn: ${cite(148)}, ${cite(150)}.

Quản lý hóa chất nguồn bao gồm kiểm soát mua, MRSL/RSL, SDS, lưu kho, nhãn và đánh giá nhà cung cấp. Trang 88 nói trên 90% hóa chất tại Da-Yuan và nhà máy vải Việt Nam có chứng nhận ZDHC MRSL cấp 1–3. Đây là phạm vi hai cơ sở, không chứng minh mọi hóa chất/sản phẩm hoặc toàn bộ tập đoàn được chứng nhận. Nguồn: ${cite(88)}, ${cite(89)}.

Nguồn nêu chính sách đa dạng sinh học được Hội đồng quản trị phê duyệt năm 2024 và cam kết No Net Loss/Net Positive Impact. Cam kết chính sách không bằng bằng chứng đạt kết quả sinh thái; báo cáo thật cần khảo sát ranh giới/tác động và phương pháp đo. Nguồn: ${cite(153)}.

## 13. Xã hội — nhân sự, bình đẳng và phát triển

Cuối năm 2024, Eclat công bố 20.668 nhân viên và khoảng 396 lao động không phải nhân viên. Bảng theo giới có Đài Loan 639 nam + 1.063 nữ, Việt Nam 1.596 + 10.825, Campuchia 289 + 1.417, Indonesia 640 + 4.199; cộng đúng 20.668. Người lao động bên ngoài không được cộng vào tổng nhân viên. Nguồn: ${cite(53)}.

Trang overview ghi tỷ lệ nghỉ việc Đài Loan 13,92% và nữ quản lý Đài Loan 57,94%; giữ phạm vi vùng, không gắn thành tỷ lệ toàn cầu. Mức lương bình quân 1,103 triệu NTD áp dụng nhóm full-time non-supervisory ở Đài Loan theo tiêu chí ở tr.64–65, không phải lương bình quân 20.668 nhân viên. Nguồn: ${cite(10)}, ${cite(64)}, ${cite(65)}.

Nguồn mô tả đào tạo chuyên môn, kiến thức chung và lãnh đạo. Trang 57 ghi 188.465 lượt tham gia và khoảng 365.369 giờ; không coi lượt tham gia là số nhân viên duy nhất. Tổng giờ theo biểu đồ vùng tr.58 khác thuyết minh, được ghi ngoại lệ trước khi tính bình quân. Không tính 365.369/20.668 thành chỉ tiêu đã đối chiếu. Nguồn: ${cite(57)}, ${cite(58)}.

## 14. Xã hội — an toàn, nhân quyền và cộng đồng

Báo cáo nêu 36 sự kiện chấn thương và 431 ngày công mất. Quy trình nguồn mô tả phản ứng khẩn cấp, báo cáo, điều tra, cải tiến, theo dõi và lưu hồ sơ. Mẫu không tự tính TRIR hoặc LTIFR từ 36 ca nếu chưa xác định loại ca và số giờ đúng phạm vi. Nguồn: ${cite(81)}, ${cite(82)}.

Nguồn nêu chính sách nhân quyền, các vấn đề rủi ro, khảo sát nội bộ và biện pháp giảm thiểu/khắc phục. Các vấn đề bao gồm tranh chấp lao động, môi trường làm việc an toàn, sức khỏe, giờ làm, chống cưỡng bức/trẻ em và dữ liệu cá nhân. Bài học là gắn từng rủi ro với chỉ báo và hành động; không dùng một cam kết chung để kết luận không có vi phạm. Nguồn: ${cite(90)}, ${cite(91)}, ${cite(92)}.

Chương cộng đồng công bố khoảng 8,67 triệu NTD đầu tư, 87 lượt tình nguyện và 784 người hưởng lợi ước tính. Không đồng nhất khoản này với 5.277 nghìn NTD community investments ở bảng tài chính tr.35; cần làm rõ cách phân loại/phạm vi trước khi đối chiếu. Nguồn: ${cite(101)}, ${cite(35)}.

## 15. Chuỗi cung ứng, sản phẩm và tài chính

Tỷ lệ mua nguyên liệu địa phương năm 2024 là Đài Loan 92,74% và Việt Nam 33,90% trong phạm vi cơ sở được nguồn mô tả. Tỷ lệ sợi tái chế mua là 25,81%; nguồn nêu hồ sơ GRS và cập nhật phương pháp tính từ 2023. Không diễn giải thành 25,81% mọi nguyên liệu của doanh nghiệp giày. Nguồn: ${cite(118)}, ${cite(119)}, ${cite(8)}.

Tỷ lệ nhà cung cấp chính cấp 1 hoàn tất Higg FEM hoặc đánh giá môi trường tương đương là 69,57%; bảng dùng định nghĩa “key” theo giá trị giao dịch và có loại trừ. Tr.120 công bố tỷ lệ ký Supplier Code of Conduct 100% trong phạm vi nguồn. Ký cam kết, được đánh giá và đạt kết quả là ba trạng thái khác nhau. Nguồn: ${cite(120)}, ${cite(121)}.

Doanh thu 2024 là 36.828.499 nghìn NTD và lợi nhuận sau thuế 6.640.852 nghìn NTD. Bảng phân phối gồm vận hành 23.258.887; nhân viên 5.808.910; cổ tức 3.703.956; lãi 70.913; chính phủ 2.387.095; cộng đồng 5.277 (cùng nghìn NTD). Không đặt lợi nhuận sau thuế bằng doanh thu trừ tùy ý các khoản ESG, và không chuyển NTD thành VND mà không có tỷ giá/kỳ. Nguồn: ${cite(35)}.

## 16. Audit nguồn và các điểm cần làm rõ

Đây là kiểm tra nhất quán trong tài liệu công bố, không phải audit độc lập hoạt động Eclat hoặc kết luận gian lận. Đã xem ảnh các bảng đào tạo, KNK, nước và chất thải để phân biệt lỗi trích xuất với nội dung thực trên trang. Phát hiện được giữ với giá trị gốc và không tự thay thế số nguồn.

${table(["Mã", "Điểm cần làm rõ", "Chi tiết", "Nguồn", "Hành động cho quy trình doanh nghiệp"], eclatIssues.map(row => [row.code, row.title, row.finding, row.pages.map(cite).join("; "), row.action]))}

Ngoài ra, cường độ khối may từ số tr.136 tính lại xấp xỉ 3,86 thay vì 3,85 hiển thị; cộng đồng có số tiền khác phạm vi giữa tr.35/tr.101; một số chỉ mục dẫn trang cần kiểm lại, như mục assurance tr.154 dẫn 157 trong khi phần thư thực ở tr.164–167. Giữ ghi chú và đối chiếu nguồn khi tra cứu, không chỉ tin mục lục.

## 17. Phạm vi đảm bảo và giới hạn tham chiếu

Thư EY tại tr.164–165, ngày 18/07/2025, là LIMITED ASSURANCE cho thông tin bền vững được chọn, không phải reasonable assurance cho toàn bộ báo cáo. Phụ lục tr.166–167 liệt kê thông tin về tuyển/nghỉ việc, đa dạng nhân sự và nước với GRI 401-1, 405-1, 303-3. Thư nêu giới hạn và không đưa ý kiến về hiệu lực kiểm soát nội bộ. Không chuyển kết luận EY sang hệ thống ESG Hub hoặc dữ liệu của doanh nghiệp khác. Nguồn: ${cite(164)}, ${cite(165)}, ${cite(166)}, ${cite(167)}.

Các trang KNK nguồn ghi SGS xác minh kiểm kê, với mô tả reasonable assurance theo ISO 14064-3 trong phụ lục. Mẫu đã đọc mô tả trong PDF nhưng chưa tải riêng Greenhouse Gas Verification Statement trên website để thẩm tra phạm vi/chứng thư. Đây là lớp đảm bảo khác với thư EY và cần giữ rõ tên, phạm vi, chuẩn và mức đảm bảo. Nguồn: ${cite(137)}, ${cite(160)}, ${cite(161)}.

ESG Hub đối chiếu số và trang; không thực hiện assurance mới, không liên hệ EY/SGS/Eclat và không kiểm các hóa đơn/hồ sơ vận hành thật. Những ngoại lệ chương 16 cần được làm rõ trước khi dùng benchmark cho quyết định quan trọng.

## 18. Phụ lục KPI có truy xuất

Các mã tham chiếu sau chỉ phục vụ tham chiếu, không ghi vào kho dữ liệu doanh nghiệp và không mặc định là bộ 24 KPI của ứng dụng. Giá trị không có năm trước để trống “—”, không thay bằng 0.

${table(["Mã", "KPI", "Đơn vị", "2023", "2024", "Phạm vi", "Nguồn", "Chất lượng"], eclatMetrics.map(row => [row.code, row.label, row.unit, row.value2023 === null ? "—" : fmt(row.value2023), fmt(row.value2024), row.scope, cite(row.printedPage), row.quality]))}

Phụ lục Excel còn có phương pháp, bằng chứng cần có và bảng ngoại lệ. Dữ liệu tháng của Eclat không được tự tạo từ số năm; PDF không cung cấp đầy đủ dữ liệu gốc tháng để nhập thử. Muốn luyện thao tác, dùng bản MẪU GIẢ ĐỊNH riêng và không trộn với Eclat.

## 19. Chỉ mục khung và cách tham khảo

${table(["Nhóm nội dung", "Vị trí báo cáo Eclat", "Cách dùng trong mẫu doanh nghiệp"], [
 ["GRI 2: tổ chức, lao động, quản trị, chính sách", "Chỉ mục tr.154–155; các chương 1–3", "Tách từng disclosure, thêm trang và bằng chứng của chính doanh nghiệp"],
 ["GRI 3: trọng yếu và quản lý", "Tr.39–47, chỉ mục tr.156", "Tự xác định tác động; không sao chép danh sách Eclat"],
 ["Các topic disclosures", "Chỉ mục tr.156–158", "Chọn theo trọng yếu và chuẩn phiên bản/kỳ áp dụng"],
 ["Khí hậu TWSE/TPEx", "Tr.159–161", "Khung của đối tượng niêm yết nguồn; không mặc định là pháp luật Việt Nam"],
 ["SASB Apparel, Accessories & Footwear", "Tr.162", "Đối chiếu chủ đề chuỗi cung ứng/hóa chất và tiêu chí áp dụng"],
 ["TCFD", "Tr.163, 129–138", "Nối quản trị, chiến lược, rủi ro, chỉ số và mục tiêu"],
 ["Assurance", "Tr.164–167; KNK tr.137/160–161", "Chỉ công bố bằng chứng đảm bảo thực cho đúng tổ chức/phạm vi"],
])}

Tài liệu khung của ESG Hub có danh mục đầy đủ 30 disclosures GRI 2 và 3 disclosures GRI 3 để điền; chỉ mục nguồn Eclat cần đọc như một tham chiếu, không phải bản xác nhận mọi disclosure cho tổ chức khác. Với kỳ mới, rà tiêu chuẩn ngành, khí hậu/năng lượng, đa dạng sinh học và ngày hiệu lực.

## 20. Ánh xạ vào web và lưu trình nhân viên

1. [Học hỏi & tìm kiếm](#learn): học khái niệm trước, phân biệt số công bố, đo thực, ước tính và thiếu.
2. [Chủ đề trọng yếu](#topics): lập tác động và biên bản của doanh nghiệp; dùng Eclat để học cấu trúc quản lý chủ đề.
3. [Lộ trình & giao việc](#roadmap): giao chủ dữ liệu, hạn, bằng chứng và người thay thế.
4. [Sổ bằng chứng](#evidence): đăng ký tài liệu nguồn thật. Mã tham khảo nên kèm kỳ/cơ sở/KPI/phiên bản; không dùng trang Eclat làm hóa đơn doanh nghiệp mình.
5. [Thu thập dữ liệu](#data): tạo từ điển KPI đúng đơn vị/phạm vi/cách tổng hợp; nhập dữ liệu tháng của chính doanh nghiệp.
6. [Kiểm kê KNK](#ghg): dùng hoạt động/hệ số có nguồn đúng kỳ/cơ sở; tách phương pháp Scope 2 và phạm vi Scope 3.
7. Người khác soát xét, trả sửa khi cần, duyệt và khóa kỳ; xem [Nhật ký thay đổi](#audit).
8. [Báo cáo](#reports): chốt số liệu, biên soạn theo [khung nội dung](#report-kit), kiểm chỉ mục/giới hạn, phê duyệt và phát hành.
9. [CAPA & yêu cầu](#capa): xử lý phát hiện, kiểm hiệu lực độc lập; sửa sau phát hành phải giữ bản cũ và tạo phiên bản thay thế.

[Hướng dẫn & sơ đồ](#guide) chỉ cách thao tác từng bước với đầu vào và đầu ra. Bản MẪU GIẢ ĐỊNH riêng dùng để tập nhập; bản tham chiếu Eclat này dùng để học biên soạn và truy xuất.

## 21. Checklist trước khi chuyển thành báo cáo của doanh nghiệp

- Thay tên/kỳ/phạm vi bằng pháp nhân và cơ sở thực; không đổi tên Eclat trên số liệu của Eclat.
- Không dùng tấn vải/tá quần áo như đôi giày; chốt mẫu số sản lượng và đơn vị cùng phạm vi.
- Có nguồn gốc tháng/cơ sở, không chia số năm của Eclat thành 12 tháng giả.
- Giữ thiếu và ngoại lệ, không dùng số 0 hay số tự sửa để làm báo cáo đẹp hơn.
- Xác lập hệ số, phương pháp, soát xét độc lập, khóa kỳ và phiên bản dữ liệu.
- Biên soạn nội dung, chỉ mục, giới hạn/assurance và lấy phê duyệt thật trước công bố.

**${ECLAT_WARNING}** Nguồn gốc: [Eclat ESG Report 2024](${ECLAT_SOURCE}).
`;
}
