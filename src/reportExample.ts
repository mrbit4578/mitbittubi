import type { Sheet } from "./xlsx";
export const SAMPLE_WARNING = "MẪU GIẢ ĐỊNH — không phải dữ liệu, chữ ký hoặc chứng nhận của doanh nghiệp thật.";
export const exampleYears = [
  { year: 2024, pairs: 2000000, electricityKwh: 7200000, dieselLitres: 60000, lpgKg: 40000, waterM3: 100000, dischargeM3: 80000, wasteRecycledT: 260, wasteDisposedT: 80, wasteHazardousT: 40, materialsT: 5400, recycledMaterialsT: 1080, employees: 1100, women: 715, men: 385, trainingHours: 22000, workHours: 2200000, injuries: 5, suppliers: 90, assessedSuppliers: 54, revenue: 800, distributed: 756 },
  { year: 2025, pairs: 2400000, electricityKwh: 6000000, dieselLitres: 48000, lpgKg: 36000, waterM3: 90000, dischargeM3: 72000, wasteRecycledT: 300, wasteDisposedT: 60, wasteHazardousT: 40, materialsT: 6000, recycledMaterialsT: 1440, employees: 1200, women: 780, men: 420, trainingHours: 28800, workHours: 2400000, injuries: 3, suppliers: 100, assessedSuppliers: 80, revenue: 960, distributed: 905 },
] as const;
export type ExampleYear = typeof exampleYears[number];
export const illustrativeFactors = { electricity: 0.5, diesel: 2.68, lpg: 3, dieselGJ: 0.036, lpgGJ: 0.046 };
export function sampleMetrics(data: ExampleYear) {
  const scope1 = (data.dieselLitres * illustrativeFactors.diesel + data.lpgKg * illustrativeFactors.lpg) / 1000;
  const scope2Location = data.electricityKwh * illustrativeFactors.electricity / 1000;
  const wasteTotal = data.wasteRecycledT + data.wasteDisposedT + data.wasteHazardousT;
  return { scope1, scope2Location, ghgTotal: scope1 + scope2Location, ghgKgPerPair: (scope1 + scope2Location) * 1000 / data.pairs, electricityPerPair: data.electricityKwh / data.pairs,
    energyGJ: data.electricityKwh * 0.0036 + data.dieselLitres * illustrativeFactors.dieselGJ + data.lpgKg * illustrativeFactors.lpgGJ,
    waterLitresPerPair: data.waterM3 * 1000 / data.pairs, waterConsumedM3: data.waterM3 - data.dischargeM3,
    wasteTotal, wasteKgPerPair: wasteTotal * 1000 / data.pairs, recoveryPct: data.wasteRecycledT / wasteTotal * 100, recycledMaterialsPct: data.recycledMaterialsT / data.materialsT * 100,
    womenPct: data.women / data.employees * 100, trainingHoursPerEmployee: data.trainingHours / data.employees, injuryRate: data.injuries * 1000000 / data.workHours, supplierCoveragePct: data.assessedSuppliers / data.suppliers * 100, retainedValue: data.revenue - data.distributed };
}
// All monthly data is illustrative. A fixed monthly production denominator makes weighted intensities auditable.
export const sampleMonths = [480000, 420000, 510000, 490000, 520000, 530000, 540000, 520000, 510000, 500000, 490000, 490000].map((electricityKwh, index) => ({ period: `2025-${String(index + 1).padStart(2, "0")}`, pairs: 200000, electricityKwh, dieselLitres: 4000, lpgKg: 3000, waterM3: 7500, dischargeM3: 6000 }));
export const evidenceRegistry = [
  ["DEMO-PROD", "Sản lượng thành phẩm 12 tháng", "Sản xuất / QA", "Đối chiếu nhập kho; loại hàng lỗi, quy tắc đôi giày"],
  ["DEMO-ELEC", "Hóa đơn điện + chỉ số đồng hồ 12 tháng", "Cơ điện / tài chính", "Đối chiếu mua điện, tránh cộng đồng hồ nhánh hai lần"],
  ["DEMO-FUEL", "Phiếu nhiên liệu diesel và LPG", "Kho / cơ điện", "Tồn đầu + mua − tồn cuối; nhiên liệu dùng trong ranh giới"],
  ["DEMO-FACTOR", "Sổ hệ số minh họa", "EHS", "Hệ số GIẢ ĐỊNH, không dùng cho kiểm kê thực"],
  ["DEMO-WATER", "Đồng hồ nước / nước thải 12 tháng", "EHS / cơ điện", "Kiểm phạm vi đồng hồ, cân bằng nước"],
  ["DEMO-WASTE", "Phiếu cân và chứng từ xử lý", "EHS", "Phân loại nguy hại, cân bằng phát sinh/xử lý/tồn"],
  ["DEMO-MAT", "Sổ mua vật liệu và xác nhận tái chế", "Mua hàng / kho", "Khối lượng vật liệu đầu vào, cùng phạm vi"],
  ["DEMO-HR", "Tổng hợp nhân sự, giờ làm và đào tạo", "Nhân sự", "Ẩn danh; danh sách cuối kỳ, không cộng headcount tháng"],
  ["DEMO-OHS", "Nhật ký tai nạn và điều tra", "EHS / nhân sự", "Số sự kiện và giờ làm cùng phạm vi; không bỏ tai nạn nhẹ"],
  ["DEMO-SUP", "Sổ nhà cung cấp và CAPA", "Mua hàng", "Nhà cung cấp hoạt động và hồ sơ được đánh giá"],
  ["DEMO-FIN", "Tổng hợp phân phối giá trị kinh tế", "Tài chính", "Đối chiếu sổ cái, tránh cộng lại chi phí"],
  ["DEMO-GOV", "Biên bản Ban ESG / chính sách", "Thư ký / pháp chế", "Hồ sơ phê duyệt và công khai giới hạn"],
] as const;
const fmt = (value: number, digits = 2) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value);
const table = (headers: string[], rows: (string | number)[][]) => `| ${headers.join(" | ")} |\n| ${headers.map(() => "---").join(" | ")} |\n${rows.map(row => `| ${row.join(" | ")} |`).join("\n")}`;
const old = exampleYears[0], current = exampleYears[1], previous = sampleMetrics(old), metrics = sampleMetrics(current);
const change = (a: number, b: number) => `${fmt((b / a - 1) * 100)}%`;
export const exampleKpis = [
  ["PROD", "Sản lượng", "đôi", old.pairs, current.pairs, "Cộng", "DEMO-PROD"],
  ["ELEC", "Điện mua", "kWh", old.electricityKwh, current.electricityKwh, "Cộng", "DEMO-ELEC"],
  ["ELEC-I", "Cường độ điện", "kWh/đôi", previous.electricityPerPair, metrics.electricityPerPair, "Tổng điện / tổng đôi", "DEMO-ELEC + DEMO-PROD"],
  ["ENERGY", "Năng lượng trong tổ chức", "GJ", previous.energyGJ, metrics.energyGJ, "Quy đổi rồi cộng", "DEMO-ELEC + DEMO-FUEL + DEMO-FACTOR"],
  ["GHG-1", "Scope 1", "tCO2e", previous.scope1, metrics.scope1, "Cộng nguồn", "DEMO-FUEL + DEMO-FACTOR"],
  ["GHG-2L", "Scope 2 địa điểm", "tCO2e", previous.scope2Location, metrics.scope2Location, "Cộng nguồn", "DEMO-ELEC + DEMO-FACTOR"],
  ["GHG-I", "Cường độ Scope 1 + 2 địa điểm", "kgCO2e/đôi", previous.ghgKgPerPair, metrics.ghgKgPerPair, "Tổng KNK × 1000 / tổng đôi", "DEMO-PROD + DEMO-FACTOR"],
  ["WATER", "Nước lấy", "m³", old.waterM3, current.waterM3, "Cộng", "DEMO-WATER"],
  ["WATER-I", "Cường độ nước lấy", "lít/đôi", previous.waterLitresPerPair, metrics.waterLitresPerPair, "Tổng m³ × 1000 / tổng đôi", "DEMO-WATER + DEMO-PROD"],
  ["WASTE", "Chất thải phát sinh", "tấn", previous.wasteTotal, metrics.wasteTotal, "Cộng", "DEMO-WASTE"],
  ["RECOVERY", "Chất thải chuyển tái chế", "%", previous.recoveryPct, metrics.recoveryPct, "Tấn tái chế / tổng phát sinh × 100", "DEMO-WASTE"],
  ["MAT-R", "Vật liệu đầu vào tái chế", "%", previous.recycledMaterialsPct, metrics.recycledMaterialsPct, "Khối lượng tái chế / tổng vật liệu × 100", "DEMO-MAT"],
  ["HEADCOUNT", "Nhân viên cuối kỳ", "người", old.employees, current.employees, "Cuối kỳ", "DEMO-HR"],
  ["FEMALE", "Tỷ lệ nữ cuối kỳ", "%", previous.womenPct, metrics.womenPct, "Nữ / nhân viên cuối kỳ × 100", "DEMO-HR"],
  ["TRAIN", "Giờ đào tạo / người cuối kỳ", "giờ/người", previous.trainingHoursPerEmployee, metrics.trainingHoursPerEmployee, "Tổng giờ / nhân viên cuối kỳ", "DEMO-HR"],
  ["INJURY", "Tỷ suất chấn thương ghi nhận", "ca/triệu giờ", previous.injuryRate, metrics.injuryRate, "Ca × 1.000.000 / giờ làm", "DEMO-OHS + DEMO-HR"],
  ["SUP-COVER", "Nhà cung cấp được đánh giá", "%", previous.supplierCoveragePct, metrics.supplierCoveragePct, "Số đánh giá / tổng hoạt động × 100", "DEMO-SUP"],
] as const;
export function exampleSheets(): Sheet[] {
  return [
    { name: "DOC_TRUOC", rows: [[SAMPLE_WARNING], ["Doanh nghiệp", "Công ty Giày Minh Họa (giả định)"], ["Kỳ", 2025], ["Hệ số", "Chỉ để minh họa tính toán; không dùng kiểm kê thực"], ["Bằng chứng", "Mã DEMO là hồ sơ giả định, không có tài liệu nguồn thật"], ["Scope 2 thị trường", "THIẾU — không phải số 0"], ["Scope 3", "Ước tính một phần; không phải toàn bộ Scope 3"]] },
    { name: "KPI_mau", rows: [["Mã", "Tên", "Đơn vị", 2024, 2025, "Tổng hợp", "Mã bằng chứng GIẢ ĐỊNH"], ...exampleKpis.map(row => [...row])] },
    { name: "Du_lieu_thang", rows: [["Kỳ", "Sản lượng đôi", "Điện kWh", "Diesel lít", "LPG kg", "Nước lấy m³", "Nước thải m³"], ...sampleMonths.map(row => [row.period, row.pairs, row.electricityKwh, row.dieselLitres, row.lpgKg, row.waterM3, row.dischargeM3])] },
    { name: "Bang_chung_GIA_DINH", rows: [["Mã", "Tài liệu cần có", "Chủ dữ liệu", "Kiểm tra"], ...evidenceRegistry.map(row => [...row])] },
    { name: "He_so_GIA_DINH", rows: [["Nguồn", "Hệ số", "Đơn vị", "Trạng thái"], ["Điện", illustrativeFactors.electricity, "kgCO2e/kWh", "GIẢ ĐỊNH"], ["Diesel", illustrativeFactors.diesel, "kgCO2e/lít", "GIẢ ĐỊNH"], ["LPG", illustrativeFactors.lpg, "kgCO2e/kg", "GIẢ ĐỊNH"], ["Diesel nhiệt trị", illustrativeFactors.dieselGJ, "GJ/lít", "GIẢ ĐỊNH"], ["LPG nhiệt trị", illustrativeFactors.lpgGJ, "GJ/kg", "GIẢ ĐỊNH"]] },
  ];
}
export function buildExampleReport(): string {
  return `# Báo cáo ESG 2025 — Công ty Giày Minh Họa

**${SAMPLE_WARNING}** Tất cả số liệu, chính sách, khảo sát, tình huống, bằng chứng và quyết định dưới đây được tạo để hướng dẫn biên soạn. Không sao chép thành báo cáo thực tế. Không nhập phụ lục mẫu vào kho dữ liệu thật. Bản 1.0, biên soạn ngày 08/10/2026.

## 01. Hồ sơ báo cáo và quản lý phiên bản

Công ty Giày Minh Họa là pháp nhân hư cấu sản xuất giày tại một nhà máy CS01 trong một khu công nghiệp giả định ở Việt Nam. Không có mã số doanh nghiệp, địa chỉ hoặc chữ ký thật. Kỳ minh họa: 01/01/2025–31/12/2025; năm cơ sở 2024; tần suất hằng năm; đơn vị tiền tệ tỷ đồng nếu không ghi khác. Mọi dẫn chiếu chương là vị trí nội dung, không phải xác nhận đáp ứng tiêu chuẩn.

Mã báo cáo DEMO-ESG-2025-v1.0. Trạng thái: tài liệu đào tạo, không có phê duyệt thật. Vai trò dự kiến: Ban ESG lập, kiểm soát nội bộ soát xét, giám đốc phê duyệt. Khi áp dụng, thay bằng tài khoản, ngày, biên bản và phiên bản dữ liệu thực. Đầu mối phản hồi trong mẫu là vai trò Thư ký Ban ESG, không có email thật.

Mẫu tham khảo cấu trúc GRI và cách kiểm kê của GHG Protocol, không tuyên bố “in accordance with GRI”. Không có assurance độc lập, chứng nhận, kiểm toán báo cáo tài chính hay xác nhận pháp lý. Mẫu này không lấy số liệu của Eclat; bản tham chiếu Eclat 2024 ở cùng màn hình được biên soạn riêng từ nguồn có số trang.

## 02. Thông điệp lãnh đạo và tổng quan kết quả

Trong tình huống giả định năm 2025, ưu tiên của doanh nghiệp là giảm tài nguyên trên mỗi đôi giày, giảm nguy cơ chấn thương và tăng khả năng truy xuất nhà cung cấp. Sản lượng tăng 20%, trong khi điện mua giảm 16,67% và nước lấy giảm 10%. Đây là chênh lệch số liệu giả định, chưa phải kết quả đo lường tác động của riêng một dự án.

Doanh nghiệp vẫn còn thiếu dữ liệu Scope 2 theo thị trường, phần lớn chuỗi giá trị Scope 3, một số chỉ tiêu nhân quyền và quản trị. Lãnh đạo trong kịch bản lựa chọn công khai khoảng trống và giao trách nhiệm bổ sung, thay vì biến dữ liệu chưa có thành số 0. Không có tuyên bố Net Zero hay trung hòa carbon.

${table(["Chỉ tiêu", "2024", "2025", "Nhận xét"], [
 ["Sản lượng (đôi)", fmt(old.pairs), fmt(current.pairs), "Tăng 20%"],
 ["Điện (kWh/đôi)", fmt(previous.electricityPerPair), fmt(metrics.electricityPerPair), `Biến động ${change(previous.electricityPerPair, metrics.electricityPerPair)}`],
 ["Nước lấy (lít/đôi)", fmt(previous.waterLitresPerPair), fmt(metrics.waterLitresPerPair), "Giảm 25%"],
 ["Scope 1 + 2 địa điểm (tCO2e)", fmt(previous.ghgTotal), fmt(metrics.ghgTotal), `Biến động ${change(previous.ghgTotal, metrics.ghgTotal)}; hệ số giả định`],
 ["Tỷ suất chấn thương (ca/triệu giờ)", fmt(previous.injuryRate), fmt(metrics.injuryRate), "3 ca / 2,4 triệu giờ trong năm 2025"],
 ["Nhà cung cấp được đánh giá", "60%", "80%", "Chưa phủ 20 nhà cung cấp"],
])}

## 03. Doanh nghiệp, cơ sở và chuỗi giá trị

Nhà máy CS01 cắt, may, dán và hoàn thiện giày. Sản lượng 2025 là 2.400.000 đôi thành phẩm đạt chuẩn, không tính bán thành phẩm hay đôi bị loại. Có 1.200 nhân viên tại 31/12/2025 và 40 lao động dịch vụ nhà thầu; hai nhóm được báo cáo tách biệt. Không có công ty con hoặc cơ sở khác trong tình huống.

Chuỗi giá trị gồm nhà cung cấp vải/cao su/keo/bao bì → nhà máy → vận tải thuê ngoài → khách hàng → sử dụng và cuối vòng đời. Mua hàng từ 100 nhà cung cấp hoạt động trong năm; sản lượng của bên gia công ngoài không nằm trong mẫu số sản xuất CS01. Tác động chuỗi cung ứng được nhận diện nhưng dữ liệu ngoài nhà máy chưa đầy đủ.

Vật liệu đầu vào 2025 là 6.000 tấn, trong đó 1.440 tấn có hàm lượng tái chế theo giả định xác nhận vật liệu. Tỷ lệ theo khối lượng là 24%, so với 20% năm 2024. Chỉ tiêu này không chứng minh 24% mỗi sản phẩm được tái chế; chưa có phân bổ cấp mã hàng hoặc hồ sơ nguồn gốc thật.

## 04. Phương pháp, ranh giới và chất lượng dữ liệu

Ranh giới tổ chức dùng cách tiếp cận kiểm soát vận hành cho CS01. Mọi bảng so sánh nhà máy dùng cùng kỳ, phạm vi và năm cơ sở. Dữ liệu 2024 được tạo theo cùng phương pháp; không có điều chỉnh số liệu nền trong kịch bản. Khi áp dụng thực tế cần chính sách tính lại năm cơ sở và công bố điều chỉnh theo mức độ ảnh hưởng.

Điện, nhiên liệu, nước, sản lượng là bộ dữ liệu tháng giả định đủ 12/12 tháng. Nhân viên là số cuối kỳ, không cộng 12 tháng. Cường độ dùng tổng tử chia tổng mẫu. Tổng chất thải có phân loại; nước tiêu thụ là ước tính từ cân bằng. Mỗi mã DEMO chỉ minh họa tài liệu cần thu, không có tệp bằng chứng thật.

Các hệ số sau hoàn toàn giả định, không gắn với lưới điện Việt Nam hoặc bộ hệ số chính thức. Trong dữ liệu thật phải xác lập địa lý, năm, công nghệ, khí bao gồm, GWP và nguồn phiên bản.

${table(["Nguồn", "Hệ số giả định", "Đơn vị", "Công thức"], [
 ["Điện mua", "0,5", "kgCO2e/kWh", "kWh × hệ số / 1.000 → tCO2e"],
 ["Diesel", "2,68", "kgCO2e/lít", "Lít × hệ số / 1.000"],
 ["LPG", "3", "kgCO2e/kg", "kg × hệ số / 1.000"],
 ["Diesel — nhiệt trị", "0,036", "GJ/lít", "Lít × nhiệt trị"],
 ["LPG — nhiệt trị", "0,046", "GJ/kg", "kg × nhiệt trị"],
 ["Điện — quy đổi", "0,0036", "GJ/kWh", "kWh × 0,0036"],
])}

Giá trị không được làm tròn từng dòng trước khi tổng hợp. Số trên bảng hiển thị tối đa hai chữ số thập phân; Excel giữ số gốc để tính lại. Thiếu, không áp dụng và số 0 là các trạng thái khác nhau.

## 05. Tham vấn bên liên quan

Kịch bản giả định gồm khảo sát 240 nhân viên ở các ca, 10 khách hàng, 20 nhà cung cấp và một cuộc họp cộng đồng với 15 đại diện. Các con số này minh họa quy mô tham vấn, không phải khảo sát đã thực hiện. Tỷ lệ đại diện nhân viên khảo sát là 20% nhân viên cuối kỳ, chưa chứng minh mẫu ngẫu nhiên hay đại diện thống kê.

Nhân viên ưu tiên an toàn, nhiệt tại xưởng và tính minh bạch giờ làm; khách hàng ưu tiên hóa chất, truy xuất và phát thải; cộng đồng ưu tiên nước thải. Ban ESG trong kịch bản ghi nhận nội dung, phản hồi bằng kế hoạch và rà lại hằng quý. Nhóm lao động nhà thầu và người ở ca đêm chưa được tham vấn đầy đủ, được đưa vào kế hoạch 2026.

Kênh phản ánh gồm hộp thư nội bộ, đại diện người lao động và đầu mối nhân sự. Chính sách giả định yêu cầu bảo mật, không trả đũa, phản hồi ban đầu trong 5 ngày làm việc và theo dõi kết quả. Không công khai thông tin người phản ánh trong báo cáo.

## 06. Chủ đề trọng yếu và cách quản lý

Thang ưu tiên nội bộ 1–5 xét mức nghiêm trọng, phạm vi, khả năng khắc phục và khả năng xảy ra đối với tác động tiềm tàng. Nhóm ESG dùng hồ sơ vận hành và ý kiến tham vấn, sau đó lãnh đạo phê duyệt danh sách trong tình huống. Không áp dụng một phép cộng điểm như điều kiện bắt buộc của GRI; tác động nhân quyền nghiêm trọng được ưu tiên ngay cả khi khó đo.

${table(["Chủ đề", "Tác động / đối tượng", "Quản lý và trách nhiệm", "Hiệu lực / khoảng trống"], [
 ["Năng lượng và khí hậu", "Phát thải và phụ thuộc điện của nhà máy/chuỗi giá trị", "Cơ điện: tối ưu máy nén, đo điện; EHS: kiểm kê", "Điện/đôi giảm; Scope 3 còn thiếu"],
 ["Nước và nước thải", "Sử dụng tài nguyên, ảnh hưởng nơi nhận nước", "EHS: theo dõi đồng hồ, quan trắc và sự cố", "Nước/đôi giảm; stress nước chưa xác minh"],
 ["Chất thải và hóa chất", "Sức khỏe nhân viên, chất thải tới bên nhận", "Kho/EHS: SDS, phân loại, đối chiếu chứng từ", "75% khối lượng chuyển tái chế; tồn kho hóa chất cần rà soát"],
 ["An toàn lao động", "Chấn thương thực tế ở nhân viên", "EHS/nhân sự: điều tra, che chắn, đào tạo", "3 ca; chưa đủ dữ liệu nhà thầu"],
 ["Điều kiện lao động và nhân quyền", "Giờ làm, đối xử, tự do hiệp hội ở nhân viên/nhà cung cấp", "Nhân sự/mua hàng: kiểm hồ sơ, phản ánh, đánh giá rủi ro", "Chưa có đánh giá lương đủ sống và rủi ro toàn chuỗi"],
 ["Chuỗi cung ứng có trách nhiệm", "Tác động E/S ở nhà cung cấp", "Mua hàng: đánh giá 80/100, theo CAPA", "20 nhà cung cấp chưa đánh giá, 4 CAPA còn mở"],
 ["Đạo đức và dữ liệu", "Rủi ro khai sai, hối lộ và lộ dữ liệu", "Pháp chế/kiểm soát: chính sách, phân quyền, duyệt độc lập", "Thiếu một số công bố quản trị và thẩm định độc lập"],
])}

Các chủ đề trên liên kết mục tiêu chương 08, kết quả chương 09–14 và CAPA chương 16. Rà soát hiệu lực bằng KPI và phản hồi, không chỉ đếm số chính sách được ban hành. Đa dạng sinh học và cuối vòng đời sản phẩm đang sàng lọc; thiếu dữ liệu không có nghĩa là không trọng yếu.

## 07. Quản trị, đạo đức và trách nhiệm ESG

Cơ cấu hư cấu gồm giám đốc điều hành và Ban ESG 7 vai trò: lãnh đạo, EHS, nhân sự, mua hàng, sản xuất, tài chính và kiểm soát nội bộ. Ban họp mỗi quý, chủ dữ liệu kiểm tra tháng, kiểm soát nội bộ soát xét độc lập, giám đốc duyệt báo cáo. Chưa công bố danh tính, giới, tính độc lập, cơ chế đề cử, đánh giá hiệu quả hoặc thù lao của cơ quan quản trị; không coi mô tả này đáp ứng toàn bộ GRI 2.

Chính sách giả định có chống hối lộ, khai báo lợi ích, an toàn, nhân quyền, bảo vệ dữ liệu và cơ chế phản ánh. Trong kịch bản, 12 phản ánh lao động được tiếp nhận, 10 xử lý xong và 2 còn mở liên quan giờ làm. “Đã xử lý” chỉ có nghĩa hồ sơ có phản hồi và hành động, chưa thay thế đánh giá mức hài lòng hay hiệu lực dài hạn.

Có 0 vụ hối lộ được xác nhận trong sổ tình huống, nhưng phạm vi tra soát chỉ là các hồ sơ tiếp nhận và đánh giá của Ban ESG. Không suy ra doanh nghiệp hoàn toàn không có hối lộ. 100% cán bộ mua hàng trong nhóm giả định 20 người hoàn thành đào tạo chống hối lộ; chưa có dữ liệu về tổng nhân viên hoặc nhà cung cấp được truyền đạt chính sách.

## 08. Nghĩa vụ, rủi ro và mục tiêu

Sổ nghĩa vụ minh họa gồm quản lý môi trường, lao động, an toàn, hóa chất và yêu cầu nhãn hàng. Không có tên văn bản, giấy phép hay kết luận pháp lý thật. Pháp chế phải xác định văn bản đang hiệu lực, căn cứ áp dụng, hạn và bằng chứng trước khi công bố tuân thủ. Không có đủ cơ sở để tuyên bố “không vi phạm pháp luật”. Chưa giả định tư cách thành viên hiệp hội.

Rủi ro ưu tiên: tăng giá điện, nắng nóng ảnh hưởng người lao động, gián đoạn nước và thiếu thông tin nguyên liệu. Tình huống dùng biện pháp tối ưu thiết bị, quản lý nhiệt, theo dõi nước, đa nguồn cung và lấy dữ liệu nhà cung cấp; chưa có mô hình kịch bản khí hậu hay định lượng rủi ro tài chính.

${table(["Mục tiêu nội bộ", "Nền 2024", "Đích 2025", "Kết quả 2025", "Kết luận"], [
 ["Điện kWh/đôi", "3,6", "≤ 3,0", fmt(metrics.electricityPerPair), "Đạt trong dữ liệu giả định"],
 ["Nước lấy lít/đôi", "50", "≤ 40", fmt(metrics.waterLitresPerPair), "Đạt"],
 ["Chất thải chuyển tái chế", fmt(previous.recoveryPct) + "%", "≥ 75%", "75%", "Đạt, cần chứng từ xử lý thật"],
 ["Nhà cung cấp được đánh giá", "60%", "≥ 90%", "80%", "Chưa đạt, thiếu 10 điểm phần trăm"],
 ["Số chấn thương ghi nhận", "5", "≤ 2", "3", "Chưa đạt, không che giấu ca"],
])}

Các mục tiêu là quyết định minh họa, không được tổ chức thẩm định khí hậu. Không dùng mục tiêu cường độ để tuyên bố giảm tuyệt đối nếu tổng phát thải tăng.

## 09. Môi trường — năng lượng và khí nhà kính

Điện mua năm 2025 là 6.000.000 kWh, diesel 48.000 lít và LPG 36.000 kg. Không có năng lượng tự sản xuất hoặc bán trong kịch bản. Nguồn điện chưa có hồ sơ xác nhận tái tạo; không tuyên bố tỷ lệ điện tái tạo. Tổng năng lượng quy đổi là ${fmt(metrics.energyGJ)} GJ, so với ${fmt(previous.energyGJ)} GJ năm 2024; chỉ phản ánh năng lượng trong CS01.

${table(["Kiểm kê minh họa", "2024 tCO2e", "2025 tCO2e", "Cách tính 2025"], [
 ["Diesel — Scope 1", "160,8", "128,64", "48.000 × 2,68 / 1.000"],
 ["LPG — Scope 1", "120", "108", "36.000 × 3 / 1.000"],
 ["Tổng Scope 1", fmt(previous.scope1), fmt(metrics.scope1), "Cộng hai nguồn trên"],
 ["Scope 2 địa điểm", fmt(previous.scope2Location), fmt(metrics.scope2Location), "6.000.000 × 0,5 / 1.000"],
 ["Scope 1 + Scope 2 địa điểm", fmt(previous.ghgTotal), fmt(metrics.ghgTotal), "236,64 + 3.000"],
 ["Scope 2 thị trường", "Thiếu", "Thiếu", "Chưa có thông tin hợp đồng/công cụ đáp ứng chất lượng"],
])}

Không có rò rỉ môi chất trong kịch bản tạo dữ liệu; đây là giả định, không phải kết quả kiểm tra thiết bị. Kiểm kê thật phải có danh mục thiết bị và kiểm tra toàn bộ nguồn. Cường độ Scope 1 + 2 địa điểm là ${fmt(metrics.ghgKgPerPair)} kgCO2e/đôi; phép tính chưa làm tròn là 3.236,64 × 1.000 / 2.400.000. Không cộng Scope 2 thị trường vào tổng này.

Sàng lọc Scope 3 dưới đây chỉ là minh họa. Ước tính vật liệu 9.000 tCO2e và vận tải đầu vào 400 tCO2e dùng giả định riêng cho đào tạo, chưa có phương pháp, hệ số hoặc dữ liệu nhà cung cấp đủ để làm kiểm kê thực. Tổng phần đã ước tính là 9.400 tCO2e, KHÔNG phải tổng Scope 3; không cộng nó thành “tổng phát thải toàn doanh nghiệp”.

${table(["Nhóm Scope 3", "Trạng thái mẫu", "Giới hạn / việc cần làm"], [
 ["1. Hàng hóa và dịch vụ mua", "Ước tính một phần: 9.000", "Chỉ vật liệu; thiếu dịch vụ, cần dữ liệu/sổ hệ số"],
 ["2. Hàng hóa vốn", "Thiếu", "Thu sổ tài sản, kiểm mua máy"],
 ["3. Nhiên liệu/năng lượng ngoài Scope 1/2", "Thiếu", "Thu dữ liệu upstream và tổn thất"],
 ["4. Vận tải/phân phối đầu vào", "Ước tính một phần: 400", "Thiếu một số tuyến và nhà vận tải"],
 ["5. Chất thải vận hành", "Thiếu", "Cần phương pháp xử lý, hệ số"],
 ["6. Công tác", "Thiếu", "Thu quãng đường, phương tiện"],
 ["7. Đi lại của nhân viên", "Thiếu", "Khảo sát ẩn danh phương tiện/tần suất"],
 ["8. Tài sản thuê đầu nguồn", "Chưa xác định", "Kiểm hợp đồng, tránh trùng Scope 1/2"],
 ["9. Vận tải/phân phối đầu ra", "Thiếu", "Xác lập bên trả phí và ranh giới"],
 ["10. Gia công sản phẩm bán", "Chưa xác định", "Kiểm sản phẩm bán và công đoạn sau"],
 ["11. Sử dụng sản phẩm bán", "Chưa xác định", "Xác định kịch bản/phạm vi sử dụng"],
 ["12. Xử lý cuối vòng đời", "Thiếu", "Vật liệu và kịch bản xử lý theo thị trường"],
 ["13. Tài sản thuê cuối nguồn", "Chưa xác định", "Kiểm danh sách hợp đồng"],
 ["14. Nhượng quyền", "Không áp dụng trong kịch bản", "Giả định không có hợp đồng nhượng quyền"],
 ["15. Đầu tư", "Chưa xác định", "Rà soát khoản đầu tư và ranh giới"],
])}

Không mua bù trừ, không trừ avoided emissions trong kịch bản. Tối ưu máy nén được giả định là một hành động, nhưng chưa có đo trước/sau hoặc phương pháp cô lập biến sản lượng; báo cáo không quy toàn bộ mức giảm cho dự án đó.

## 10. Môi trường — nước, chất thải, hóa chất và thiên nhiên

Nước lấy từ mạng cấp nước giả định là 90.000 m³; nước xả sau xử lý 72.000 m³. Nước tiêu thụ ước tính 18.000 m³ theo nước lấy trừ nước xả, với giả định không có thay đổi lưu trữ/chuyển giao khác. Không có nguồn nước ngầm/mặt trong kịch bản. Phân loại khu vực căng thẳng nước và thông tin nơi nhận chưa được xác minh; không kết luận nhà máy nằm ngoài vùng rủi ro.

Cường độ nước lấy là 37,5 lít/đôi, so với 50 lít/đôi năm 2024. Không có kết quả quan trắc thật, vì vậy không tuyên bố nước thải đạt quy chuẩn. Báo cáo thực phải đính kèm kỳ quan trắc, thông số, nơi lấy mẫu, đơn vị và căn cứ so sánh.

${table(["Chất thải (tấn)", "2024", "2025", "Phân loại/kết quả giả định"], [
 ["Không nguy hại — chuyển tái chế", 260, 300, "Có chứng từ hoàn tất theo giả định"],
 ["Không nguy hại — xử lý khác", 80, 60, "Không coi là tái chế"],
 ["Nguy hại — xử lý", 40, 40, "Chuyển đơn vị có chức năng theo giả định"],
 ["Tổng phát sinh", previous.wasteTotal, metrics.wasteTotal, "Tồn đầu = tồn cuối = 0 trong kịch bản"],
])}

300 + 60 + 40 = 400 tấn. Tỷ lệ chuyển tái chế trên TOÀN BỘ chất thải là 75%; nếu chỉ tính 360 tấn không nguy hại thì tỷ lệ là 83,33%, phải ghi đúng mẫu số. Tổng chất thải tăng ${change(previous.wasteTotal, metrics.wasteTotal)}, trong khi cường độ giảm từ ${fmt(previous.wasteKgPerPair, 4)} xuống ${fmt(metrics.wasteKgPerPair, 4)} kg/đôi. Hai kết quả được công bố song song.

Danh mục hóa chất giả định có 120 loại, 108 loại có SDS còn phù hợp và 12 loại chờ rà soát. Tỷ lệ hoàn chỉnh hồ sơ là 90%; không chứng minh tất cả hóa chất đáp ứng MRSL/RSL hoặc an toàn sản phẩm. Chưa có số liệu VOC, kiểm nghiệm dư lượng và sự cố tràn đổ được xác minh. Mục chất thải không phải cân bằng khối lượng toàn bộ nguyên liệu/sản phẩm vì còn thiếu tồn kho và khối lượng sản phẩm.

Chưa có khảo sát đa dạng sinh học hoặc bản đồ khu vực nhạy cảm. Đưa vào kế hoạch sàng lọc tác động; không ghi “không áp dụng” chỉ từ giả định nhà máy ở khu công nghiệp.

## 11. Xã hội — nhân viên và phát triển

${table(["Nhân sự", "2024", "2025", "Phạm vi / phương pháp"], [
 ["Nhân viên cuối kỳ", 1100, 1200, "Headcount tại 31/12, không cộng theo tháng"],
 ["Nữ", 715, 780, "65% nhân viên cuối kỳ"],
 ["Nam", 385, 420, "35% nhân viên cuối kỳ"],
 ["Hợp đồng không xác định thời hạn", 880, 960, "Phân loại giả định"],
 ["Hợp đồng xác định thời hạn", 220, 240, "Cộng với nhóm trên khớp tổng"],
 ["Lao động nhà thầu cuối kỳ", 30, 40, "Không nằm trong tổng nhân viên"],
 ["Giờ đào tạo", fmt(old.trainingHours), fmt(current.trainingHours), "Tổng người tham gia × giờ; cùng phạm vi nhân viên"],
 ["Giờ đào tạo / người cuối kỳ", 20, 24, "Không thay thế mẫu số bình quân nếu chọn phương pháp khác"],
])}

Trong 2025, nữ được 18.720 giờ và nam 10.080 giờ đào tạo: tổng 28.800 giờ; mỗi nhóm 24 giờ/người cuối kỳ. Chưa phân tích theo nhóm nghề, hiệu quả đào tạo hoặc tỷ lệ đánh giá phát triển nghề nghiệp. Tuyển 220 người, nghỉ 120 người: 1.100 + 220 − 120 = 1.200, giả định không có chuyển cơ sở. Dùng nhân viên bình quân 1.150 làm mẫu số nội bộ, tỷ lệ nghỉ là 10,43%; chưa phân tách tuổi/vùng/giới nên không coi đáp ứng đầy đủ disclosure về nghỉ việc.

Giả định toàn bộ 1.200 nhân viên nằm trong phạm vi thỏa ước lao động tập thể; báo cáo thực cần văn bản hiệu lực và kiểm phạm vi. Chưa có đánh giá lương đủ sống, chênh lệch lương theo giới, nghỉ thai sản/quay lại làm việc, làm thêm giờ hoặc sàng lọc đầy đủ lao động trẻ em/cưỡng bức. Việc thiếu các dữ liệu này được ghi vào kế hoạch, không thay bằng cam kết chung hoặc số 0.

## 12. Xã hội — sức khỏe và an toàn

Kịch bản có 3 chấn thương ghi nhận của nhân viên trên 2.400.000 giờ làm; tỷ suất là 3 × 1.000.000 / 2.400.000 = 1,25 ca/triệu giờ. Năm 2024 có 5 ca/2.200.000 giờ = 2,27 ca/triệu giờ. Chuẩn hóa dùng một triệu giờ; không so trực tiếp với chỉ số dùng 200.000 giờ nếu chưa quy đổi.

Giả định 0 ca tử vong và 0 chấn thương hậu quả nghiêm trọng trong sổ nhân viên; chưa có thống kê bệnh nghề nghiệp xác minh. Số tai nạn/giờ làm của nhà thầu chưa có, không được gộp với nhân viên hoặc báo bằng 0. Không tuyên bố an toàn cho toàn bộ lao động trong ranh giới nhà máy.

Ba ca trong kịch bản: hai ca kẹp tay và một ca trượt ngã. EHS giả định điều tra, bổ sung che chắn máy, chỉnh lối đi và hướng dẫn ca; kiểm soát nội bộ kiểm hành động. Không đạt mục tiêu ≤ 2 ca; kiểm hiệu lực sau 90 ngày còn đang theo dõi. Hệ thống quản lý bao phủ nhân viên theo giả định nội bộ, chưa có đánh giá/chứng nhận độc lập hoặc bằng chứng đủ về mức bao phủ nhà thầu.

## 13. Chuỗi cung ứng, sản phẩm và cộng đồng

80/100 nhà cung cấp hoạt động được đánh giá E/S, tăng từ 54/90 năm 2024. 10 nhà cung cấp mới đều được sàng lọc ban đầu, nhưng 100% nhóm mới khác với mức bao phủ 80% toàn bộ. Có 12 nhà cung cấp có phát hiện và 12 CAPA tương ứng trong mẫu: 8 đã kiểm hiệu lực/đóng, 4 đang xử lý. Không chấm dứt hợp đồng trong kịch bản; không chứng minh toàn chuỗi không có tác động tiêu cực.

Mua địa phương được định nghĩa nội bộ là nhà cung cấp có cơ sở giao hàng trong cùng tỉnh giả định. Chi tiêu 120/600 tỷ đồng thuộc nhóm này, tương ứng 20%; chưa kiểm sở hữu hoặc nguồn nguyên liệu upstream. Định nghĩa phải giữ nhất quán khi so sánh.

Kịch bản có 6 khiếu nại chất lượng sản phẩm, 5 đã xử lý và 1 chờ xác định nguyên nhân. Chưa có kiểm nghiệm an toàn sản phẩm đầy đủ, phân loại vi phạm nhãn hoặc hồ sơ quyền riêng tư để tuyên bố tuân thủ. Chương trình cộng đồng giả định trị giá 1 tỷ đồng hỗ trợ đào tạo nghề; thiếu đánh giá kết quả dài hạn và tham vấn nhóm dễ bị tổn thương. Đóng góp này không bù trừ tác động nước thải hoặc lao động.

## 14. Giá trị kinh tế và nguồn lực ESG

Giá trị kinh tế trực tiếp tạo ra giả định là 960 tỷ đồng. Phân phối 905 tỷ gồm chi phí vận hành 650, lương/phúc lợi 180, chi trả bên cung cấp vốn 40, nộp chính phủ 34 và cộng đồng 1. Giá trị giữ lại 55 tỷ đồng: 960 − 905. Đây là mô hình đơn giản, không phải lợi nhuận kế toán hoặc báo cáo tài chính đã kiểm toán; các khoản không được cộng lại vào chi phí vận hành.

Đối chiếu năm 2024: tạo ra 800, phân phối 756, giữ lại 44 tỷ. Phân phối gồm vận hành 550, nhân viên 145, vốn 32, chính phủ 28 và cộng đồng 1. Nguồn DEMO-FIN phải được thay bằng sổ cái và quy tắc phân loại thực. Chưa có dữ liệu về hỗ trợ chính phủ hoặc chính sách/chiến lược thuế.

Nguồn lực ESG 2025 trong tình huống: đầu tư thiết bị 2 tỷ và chi phí đào tạo/đánh giá 0,5 tỷ. Khoản đầu tư vốn và chi phí vận hành khác nhau, không cộng lại vào bảng phân phối nếu đã nằm trong các khoản tương ứng. Chưa tính thời gian hoàn vốn hoặc tiết kiệm tiền xác minh.

## 15. Chất lượng, khoảng trống và soát xét

Bộ tháng minh họa bao phủ 12/12 tháng cho sản lượng, điện, nhiên liệu và nước; chỉ áp dụng CS01. Nhân sự và chất thải dùng tổng hợp giả định có đối chiếu phép tính. Không công bố tỷ lệ “100% dữ liệu được kiểm chứng” vì toàn bộ nguồn và phê duyệt là hư cấu. Số liệu tham chiếu được kiểm tra tính nhất quán toán học, không được kiểm chứng thực địa.

${table(["Khoảng trống", "Ảnh hưởng", "Phụ trách", "Hạn kế hoạch giả định"], [
 ["Hệ số/GWP/địa lý thật", "Không dùng KNK mẫu làm kiểm kê thực", "EHS", "31/03/2026"],
 ["Scope 2 thị trường", "Không có tổng theo thị trường", "Mua hàng / EHS", "30/06/2026"],
 ["Scope 3 chưa đầy đủ", "Không có tổng chuỗi giá trị", "Mua hàng / logistics", "30/09/2026"],
 ["Nhà thầu và bệnh nghề nghiệp", "Chưa đủ chỉ số an toàn toàn bộ lao động", "EHS / nhân sự", "30/06/2026"],
 ["Quản trị/thù lao và quyền lao động", "Chỉ mục GRI còn nhiều mục thiếu", "Pháp chế / nhân sự", "30/09/2026"],
 ["Stress nước, đa dạng sinh học, quan trắc", "Chưa kết luận rủi ro/tuân thủ", "EHS", "30/06/2026"],
])}

Các hạn 2026 ở đây là mốc kế hoạch của tình huống lập báo cáo sau năm 2025, không phải hành động đã hoàn thành hoặc nghĩa vụ pháp định. Nếu dùng mẫu sau các mốc này, phải đánh giá tình trạng và cập nhật ngày, không giữ nguyên như cam kết hiện tại.

Không có assurance độc lập. Quy trình áp dụng thực tế: chủ dữ liệu nộp nguồn → người khác soát xét → duyệt và khóa kỳ → lập báo cáo → kiểm tra nội dung/khung → lãnh đạo duyệt và phát hành. ESG Hub chốt dữ liệu khi duyệt; nội dung đầy đủ từ khung này cần được biên soạn thêm, không tự sinh đầy đủ từ một bảng KPI.

Khi sửa sau phát hành: giữ bản cũ, lập CAPA/lý do, mở kỳ, sửa có phiên bản, soát xét lại, phát hành báo cáo thay thế và giải thích ảnh hưởng. Không ghi đè kết quả bản đã duyệt bằng số liệu hiện tại.

## 16. Kế hoạch 2026 và Kaizen

${table(["Ưu tiên", "Mục tiêu / nghiệm thu", "Hành động / nguồn lực giả định", "Chủ trì / hạn"], [
 ["Điện", "≤ 2,4 kWh/đôi với cùng phạm vi", "Đo nhánh và điều khiển máy nén; 1,2 tỷ đầu tư", "Cơ điện / 31/12/2026"],
 ["Nước", "≤ 35 lít/đôi; xác lập stress nước", "Phát hiện rò rỉ/đồng hồ; 0,3 tỷ đầu tư", "EHS / 31/12/2026"],
 ["An toàn", "≤ 2 ca; kiểm che chắn và hiệu lực 90 ngày", "Nguyên nhân gốc 3 ca, kiểm tra độc lập; 0,2 tỷ chi phí", "EHS / 30/06/2026"],
 ["Nhà cung cấp", "Đánh giá 100/100, xử lý 4 CAPA mở", "Ưu tiên rủi ro, bằng chứng đóng; 0,2 tỷ chi phí", "Mua hàng / 30/09/2026"],
 ["Dữ liệu và báo cáo", "Hệ số thật; kế hoạch 15 nhóm Scope 3; chỉ mục có trạng thái", "Chủ dữ liệu, rà soát khung; 0,1 tỷ chi phí", "Ban ESG / 30/09/2026"],
])}

Tổng ngân sách dự kiến 2 tỷ đồng, gồm 1,5 tỷ đầu tư và 0,5 tỷ chi phí, là kế hoạch giả định chưa được phê duyệt thật. Mỗi CAPA cần người kiểm hiệu lực khác người thực hiện, kết quả và nguồn. Chọn “đóng” trên web chỉ là ghi trạng thái; bằng chứng kiểm hiệu lực phải đính kèm để tổ chức nghiệm thu.

## 17. Phụ lục A — bảng KPI đối chiếu

**${SAMPLE_WARNING}** Các mã KPI dưới đây là mã của báo cáo minh họa, không tự động trùng bộ 24 KPI mặc định của ứng dụng. Phải tạo hoặc ánh xạ từ điển trước khi nhập dữ liệu thực.

${table(["Mã", "Chỉ tiêu", "Đơn vị", "2024", "2025", "Cách tổng hợp", "Bằng chứng giả định"], exampleKpis.map(row => [row[0], row[1], row[2], fmt(row[3]), fmt(row[4]), row[5], row[6]]))}

Scope 2 thị trường: thiếu; Scope 3: mới ước tính một phần; không có giá trị 0 đại diện cho hai mục này. Chưa có mục tiêu hoặc tình trạng được đảm bảo độc lập cho mọi KPI.

## 18. Phụ lục B — dữ liệu tháng và sổ bằng chứng

${table(["Kỳ", "Sản lượng đôi", "Điện kWh", "Diesel lít", "LPG kg", "Nước lấy m³", "Nước thải m³"], sampleMonths.map(row => [row.period, fmt(row.pairs), fmt(row.electricityKwh), fmt(row.dieselLitres), fmt(row.lpgKg), fmt(row.waterM3), fmt(row.dischargeM3)]))}

Tổng năm: 2.400.000 đôi; 6.000.000 kWh; 48.000 lít diesel; 36.000 kg LPG; 90.000 m³ nước lấy; 72.000 m³ nước thải. Bảng này cho phép kiểm tổng và cường độ, không phải hồ sơ đo lường thật.

${table(["Mã giả định", "Tài liệu cần có", "Chủ dữ liệu", "Điểm kiểm tra"], evidenceRegistry.map(row => [...row]))}

Ví dụ chuyển dữ liệu thật lên web: đặt mã theo kỳ/cơ sở/KPI/nguồn/phiên bản như 2025-01_CS01_E01_DONGHO01_v01, đăng ký tài liệu nguồn, rồi nhập bản ghi có cùng mã bằng chứng. Không tạo SHA-256, chữ ký hoặc biên bản giả cho mã DEMO.

## 19. Phụ lục C — chỉ mục nội dung tham khảo

Bảng là chỉ mục học cách truy xuất, không phải tuyên bố đáp ứng. “Minh họa một phần” nghĩa là có nội dung liên quan nhưng còn thiếu yêu cầu/bằng chứng. Mẫu không sử dụng lý do thiếu này để tự nhận đáp ứng quy định về omissions của GRI.

${table(["Mã / nhóm", "Vị trí", "Trạng thái và giới hạn"], [
 ["2-1, 2-2, 2-3", "01, 03–04", "Minh họa phạm vi; không có pháp nhân/đầu mối thật"],
 ["2-4, 2-5", "04, 15", "Nêu không điều chỉnh trong kịch bản và không assurance"],
 ["2-6, 2-7, 2-8", "03, 11", "Minh họa một phần; thiếu phân tổ/vùng/nhà thầu đầy đủ"],
 ["2-9 đến 2-14", "07", "Minh họa trách nhiệm; thiếu thành phần, đề cử, độc lập, bằng chứng duyệt"],
 ["2-15 đến 2-21", "07, 15", "Thiếu công bố xung đột, năng lực, đánh giá, thù lao và tỷ lệ"],
 ["2-22 đến 2-26", "02, 05, 07–08", "Minh họa chiến lược/chính sách/kênh; thiếu triển khai và bằng chứng"],
 ["2-27, 2-28", "08", "Chưa có tra soát pháp luật hoặc thành viên hiệp hội thật"],
 ["2-29, 2-30", "05, 11", "Tham vấn và thỏa ước giả định; chưa chứng minh đầy đủ"],
 ["3-1, 3-2, 3-3", "06, 08–16", "Minh họa quy trình/danh sách/quản lý; chưa có hồ sơ phê duyệt thật"],
 ["301-1, 301-2", "03, 17", "Có khối lượng/tỷ lệ; thiếu phân loại và truy xuất thật"],
 ["302-1, 302-3, 305-1, 305-2, 305-3, 305-4", "04, 09, 17", "Có phép tính; hệ số giả định, Scope 2 thị trường và Scope 3 thiếu"],
 ["303-3, 303-4, 303-5", "10", "Có cân bằng; thiếu stress nước, nơi nhận và chất lượng"],
 ["306-3, 306-4, 306-5", "10", "Có phân loại sơ bộ; thiếu chi tiết phương pháp/on-site/off-site và nguồn"],
 ["401-1, 404-1, 405-1", "11", "Minh họa tổng; chưa đủ phân tổ, tuổi, nhóm nghề, quản trị"],
 ["403-1 đến 403-10", "12", "Một số chỉ số nhân viên; thiếu quản lý chi tiết/nhà thầu/bệnh nghề nghiệp"],
 ["308-1, 308-2, 414-1, 414-2", "13", "Minh họa đánh giá nhà cung cấp; thiếu chi tiết tác động và bằng chứng"],
 ["201-1, 204-1, 413-1", "13–14", "Có bảng giả định; thiếu hồ sơ kế toán/cộng đồng thật"],
 ["Các topic khác trọng yếu", "06, 15", "Cần chọn và đối chiếu từng disclosure từ tiêu chuẩn hiện hành"],
])}

Khi lập báo cáo thật, tách từng mã thành một dòng có chương/trang, nội dung đáp ứng, bằng chứng, trạng thái và lý do thiếu hợp lệ. Rà soát phiên bản tiêu chuẩn ngành/khí hậu/năng lượng/đa dạng sinh học và thời điểm áp dụng trước khi công bố.

## 20. Cách dùng mẫu và nguồn

1. Dùng [Khung báo cáo ESG](#report-kit) để xác định nội dung cần thu, giữ cả các phần còn thiếu.
2. Xác lập pháp nhân, phạm vi, chủ đề trọng yếu và từ điển KPI thật; không nhập số liệu DEMO vào dữ liệu chung.
3. Thu bằng chứng, nhập từng kỳ và nguồn, ghi đúng đo/ước tính/thiếu/không áp dụng.
4. Soát xét độc lập, khóa kỳ, chốt báo cáo, rồi biên soạn các chương và đối chiếu yêu cầu.
5. Phê duyệt, công bố phạm vi/giới hạn/assurance và lưu phiên bản; theo CAPA để cải tiến.

Nguồn để đối chiếu: [GRI Standards](https://www.globalreporting.org/standards/), [GHG Protocol Corporate Standard](https://ghgprotocol.org/corporate-standard), [Scope 2 Guidance](https://ghgprotocol.org/scope-2-guidance), [Scope 3 Standard](https://ghgprotocol.org/corporate-value-chain-scope-3-standard). Các liên kết là nguồn tham chiếu cần đọc bản hiện hành; không có xác nhận rằng mẫu đã được các tổ chức này thẩm định.

**${SAMPLE_WARNING}**
`;
}
