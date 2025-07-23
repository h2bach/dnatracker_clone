"use strict";

// Danh sách 34 tỉnh/thành phố mới với mảng mã ISO cũ
const Provinces34 = [
  { name: "Hà Nội", codes: ["VN-01"] },
  { name: "Hồ Chí Minh", codes: ["VN-79", "VN-43", "VN-57"] },
  { name: "Huế", codes: ["VN-26"] },
  { name: "Đà Nẵng", codes: ["VN-48", "VN-27"] },
  { name: "Cần Thơ", codes: ["VN-92", "VN-52", "VN-93"] },
  { name: "Hải Phòng", codes: ["VN-31", "VN-30"] },
  { name: "Lai Châu", codes: ["VN-12"] },
  { name: "Điện Biên", codes: ["VN-14"] },
  { name: "Sơn La", codes: ["VN-05"] },
  { name: "Lạng Sơn", codes: ["VN-09"] },
  { name: "Quảng Ninh", codes: ["VN-13"] },
  { name: "Thanh Hoá", codes: ["VN-21"] },
  { name: "Nghệ An", codes: ["VN-22"] },
  { name: "Hà Tĩnh", codes: ["VN-23"] },
  { name: "Cao Bằng", codes: ["VN-04"] },
  { name: "Tuyên Quang", codes: ["VN-07", "VN-03"] },
  { name: "Lào Cai", codes: ["VN-02", "VN-06"] },
  { name: "Thái Nguyên", codes: ["VN-19", "VN-09"] },
  { name: "Phú Thọ", codes: ["VN-25", "VN-26", "VN-15"] },
  { name: "Bắc Ninh", codes: ["VN-27", "VN-24"] },
  { name: "Hưng Yên", codes: ["VN-66", "VN-20"] },
  { name: "Ninh Bình", codes: ["VN-18", "VN-35", "VN-37"] },
  { name: "Quảng Trị", codes: ["VN-45", "VN-44"] },
  { name: "Quảng Ngãi", codes: ["VN-51", "VN-49"] },
  { name: "Gia Lai", codes: ["VN-30", "VN-31"] },
  { name: "Khánh Hòa", codes: ["VN-34", "VN-58"] },
  { name: "Lâm Đồng", codes: ["VN-35", "VN-72", "VN-40"] },
  { name: "Đắk Lắk", codes: ["VN-33", "VN-32"] },
  { name: "Đồng Nai", codes: ["VN-39", "VN-37"] },
  { name: "Tây Ninh", codes: ["VN-37", "VN-41"] },
  { name: "Vĩnh Long", codes: ["VN-49", "VN-50", "VN-51"] },
  { name: "Đồng Tháp", codes: ["VN-45", "VN-46"] },
  { name: "Cà Mau", codes: ["VN-59", "VN-55"] },
  { name: "An Giang", codes: ["VN-44", "VN-47"] }
];

// Tạo mapping mã ISO cũ sang tên tỉnh mới
const isoToNewProvince = {};
Provinces34.forEach(province => {
  province.codes.forEach(code => {
    isoToNewProvince[code] = province.name;
  });
});

// Hàm tra cứu tên tỉnh mới từ mã ISO cũ
function getNewProvinceNameFromISO(oldIso) {
  return isoToNewProvince[oldIso] || null;
}

// Hàm lấy danh sách mã ISO từ tên tỉnh mới
function getISOCodesFromNewProvince(newName) {
  const found = Provinces34.find(p => p.name === newName);
  return found ? found.codes : [];
}

module.exports = {
  Provinces34,
  isoToNewProvince,
  getNewProvinceNameFromISO,
  getISOCodesFromNewProvince
};