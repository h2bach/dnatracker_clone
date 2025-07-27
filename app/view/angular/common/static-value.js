"use strict";

(function ($) {

    angular.module('dna-tracker.common.static-value', [])
        .factory("Provinces", function () {
            var Vietnam = [
                { name: "An Giang", codes: ["VN-44", "VN-47"] },
                { name: "Bắc Ninh", codes: ["VN-54", "VN-56"] },
                { name: "Cao Bằng", codes: ["VN-04"] },
                { name: "Cà Mau", codes: ["VN-55", "VN-59"] },
                { name: "Gia Lai", codes: ["VN-31", "VN-30"] },
                { name: "Hà Nội", codes: ["VN-HN"] },
                { name: "Hà Tĩnh", codes: ["VN-23"] },
                { name: "Hưng Yên", codes: ["VN-66", "VN-20"] },
                { name: "Hải Phòng", codes: ["VN-61", "VN-HP"] },
                { name: "Hồ Chí Minh", codes: ["VN-43", "VN-57", "VN-SG"] },
                { name: "Khánh Hòa", codes: ["VN-34", "VN-36"] },
                { name: "Lai Châu", codes: ["VN-01"] },
                { name: "Lào Cai", codes: ["VN-02", "VN-06"] },
                { name: "Lâm Đồng", codes: ["VN-40", "VN-35", "VN-72"] },
                { name: "Lạng Sơn", codes: ["VN-09"] },
                { name: "Nghệ An", codes: ["VN-22"] },
                { name: "Ninh Bình", codes: ["VN-63", "VN-67", "VN-18"] },
                { name: "Phú Thọ", codes: ["VN-14", "VN-68", "VN-70"] },
                { name: "Quảng Ngãi", codes: ["VN-28", "VN-29"] },
                { name: "Quảng Ninh", codes: ["VN-13"] },
                { name: "Quảng Trị", codes: ["VN-24", "VN-25"] },
                { name: "Sơn La", codes: ["VN-05"] },
                { name: "Thanh Hóa", codes: ["VN-21"] },
                { name: "Thành phố Cần Thơ", codes: ["VN-CT", "VN-73", "VN-52"] },
                { name: "Thái Nguyên", codes: ["VN-53", "VN-69"] },
                { name: "Thừa Thiên-Huế", codes: ["VN-26"] },
                { name: "Tuyên Quang", codes: ["VN-03", "VN-07"] },
                { name: "Tây Ninh", codes: ["VN-41", "VN-37"] },
                { name: "Vĩnh Long", codes: ["VN-50", "VN-51", "VN-49"] },
                { name: "Điện Biên", codes: ["VN-71"] },
                { name: "Đà Nẵng", codes: ["VN-27", "VN-DN"] },
                { name: "Đắk Lắk", codes: ["VN-32", "VN-33"] },
                { name: "Đồng Nai", codes: ["VN-58", "VN-39"] },
                { name: "Đồng Tháp", codes: ["VN-46", "VN-45"] }
            ];
            return {
                Vietnam: Vietnam
            };
        })

    ;

})(jQuery);