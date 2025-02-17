var vi = vi || {};

vi.reduceCharMap = {
    "à": "a",
    "á": "a",
    "ã": "a",
    "ả": "a",
    "ạ": "a",
    "ă": "a",
    "â": "a",
    "ằ": "a",
    "ắ": "a",
    "ẵ": "a",
    "ẳ": "a",
    "ặ": "a",
    "ầ": "a",
    "ấ": "a",
    "ẫ": "a",
    "ẩ": "a",
    "ậ": "a",
    "è": "e",
    "é": "e",
    "ẽ": "e",
    "ẻ": "e",
    "ẹ": "e",
    "ê": "e",
    "ề": "e",
    "ế": "e",
    "ễ": "e",
    "ể": "e",
    "ệ": "e",
    "ì": "i",
    "í": "i",
    "ĩ": "i",
    "ỉ": "i",
    "ị": "i",
    "ò": "o",
    "ó": "o",
    "õ": "o",
    "ỏ": "o",
    "ọ": "o",
    "ơ": "o",
    "ô": "o",
    "ồ": "o",
    "ố": "o",
    "ỗ": "o",
    "ổ": "o",
    "ộ": "o",
    "ờ": "o",
    "ớ": "o",
    "ỡ": "o",
    "ở": "o",
    "ợ": "o",
    "ù": "u",
    "ú": "u",
    "ũ": "u",
    "ủ": "u",
    "ụ": "u",
    "ư": "u",
    "ừ": "u",
    "ứ": "u",
    "ữ": "u",
    "ử": "u",
    "ự": "u",
    "ỳ": "y",
    "ý": "y",
    "ỹ": "y",
    "ỷ": "y",
    "ỵ": "y",
    "đ": "d"
};

vi.removeMark = function (str) {
    var _str = str.toLowerCase();
    var returnStr = "";
    for (var i = 0; i < _str.length; i++) {
        var char = _str[i];
        returnStr += vi.reduceCharMap[char] ? vi.reduceCharMap[char] : char;
    }
    return returnStr;
};
vi.hasMark = function (str) {
    var _str = str.toLowerCase();
    for (var i = 0; i < _str.length; i++) {
        var char = _str[i];
        if(vi.reduceCharMap[char]) {
            return true
        }
    }
    return false;
};

module.exports = vi;