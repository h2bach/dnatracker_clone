var StringUtil = StringUtil || {};
StringUtil.uppercaseFirstChar = function(str) {
    return str.substring(0, 1).toUpperCase() + str.substring(1, str.length);
};
StringUtil.uppercaseOnlyFirstChar = function(str) {
    return str.substring(0, 1).toUpperCase() + str.substring(1, str.length).toLowerCase();
};
StringUtil.isBlank = function(val) {
    if ((typeof val) == "string") {
        return val==null || val.replace(/\s/g, "").length == 0;
    } else {
        return val == null;
    }
};
StringUtil.isEmpty = function(val) {
    return val==null || val == '';
};

StringUtil.isNotEmpty = function(val) {
    return !StringUtil.isEmpty(val);
};
StringUtil.isNotBlank = function(val) {
    return !StringUtil.isBlank(val);
};

StringUtil.getLastWord = function(str) {
    return /\b\w+$/.exec(str)[0];
};
StringUtil.startsWith = function(target, str) {
    if (str == null || str.length < target.length) {
        return false;
    }
    return str.substring(0, target.length) == target;
};
StringUtil.endsWith = function(target, str) {
    if (str == null || str.length < target.length) {
        return false;
    }
    return str.substring(str.length - target.length) == target;
};

StringUtil.trim = function(val) {
    if (!val) {
        return null;
    }

    return val.replace(/^\s+/, "").replace(/\s+$/, "");
};

StringUtil.replaceAll = (function() {
    function escapeRegExp(string) {
        return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

    return function(from, to, src) {
        return src.replace(new RegExp(escapeRegExp(from), "g"), to);
    }
})();

StringUtil.equalsIgnoreCase = function(s1, s2) {
    if (s1 == null) {
        return s2 == null;
    }
    if (s2 == null) {
        return false;
    }

    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    return s1 == s2;
};

StringUtil.randomId = function(length) {
    var possible1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var possible2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    var text = possible1.charAt(Math.floor(Math.random() * possible1.length));
    for ( var i=0; i < length-1; i++ ) {
        text += possible2.charAt(Math.floor(Math.random() * possible2.length));
    }
    return text;
};


var DateUtil = DateUtil || {};

DateUtil.SECOND_LENGTH = 1000;
DateUtil.MINUTE_LENGTH = 60 * DateUtil.SECOND_LENGTH;
DateUtil.HOUR_LENGTH = 60 * DateUtil.MINUTE_LENGTH;
DateUtil.DAY_LENGTH = 24 * DateUtil.HOUR_LENGTH;
DateUtil.YEAR_LENGTH = 365 * DateUtil.DAY_LENGTH;

DateUtil.yesterday = function() {
    return DateUtil.addDays(new Date(), -1 );
};

DateUtil.DAY_LENGTH = 24*60*60*1000;

DateUtil.addDays = function(date1, days) {
    var date = new Date(date1.getTime());
    date.setDate(date.getDate() + days);
    return date;
};
DateUtil.addMonth = function(date1, month) {
    var date = new Date(date1.getTime());
    date.setMonth(date.getMonth() + month);
    return date;
};
DateUtil.addMinutes = function(date1, minutes) {
    var date = new Date(date1.getTime());
    date.setMinutes(date.getMinutes() + minutes);
    return date;
};
DateUtil.format2digits = function(num) {
    num = "" + num;
    if (num.length == 1) {
        return "0" + num;
    }
    return num;
};
DateUtil.format = function(date, format) {
    return format
        .replace(/yyyy/g, date.getFullYear())
        .replace(/MM/g, DateUtil.format2digits(date.getMonth()+1))
        .replace(/dd/g, DateUtil.format2digits(date.getDate()))
        .replace(/HH/g, DateUtil.format2digits(date.getHours()))
        .replace(/mm/g, DateUtil.format2digits(date.getMinutes()))
        ;
};

DateUtil.sameDay = function(d1, d2) {
    return DateUtil.truncate(d1).getTime() == DateUtil.truncate(d2).getTime();
};

DateUtil.parse = function(str, format) {
    if (format=="yyyy_MM_dd") {
        var m = /(\d+)_(\d+)_(\d+)/.exec(str);
        return new Date(m[1], m[2] - 1, m[3]);
    }
    if (format=="yyyy_MM") {
        var m = /(\d+)_(\d+)/.exec(str);
        return new Date(m[1], m[2] - 1);
    }
    if (format=="dd.mm.yy") {
        var m = /(\d+)\.(\d+)\.(\d+)/.exec(str);
        return new Date(m[3], m[2] - 1, m[1]);
    }
    if (format=="mm/dd/yy") {
        var m = /(\d+)\/(\d+)\/(\d+)/.exec(str);
        return new Date(m[3], m[1] - 1, m[2]);
    }
    if (format=="MM d") {
        var m = /(\w+) (\d+)/.exec(str);
        var months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ];
        return new Date(new Date().getYear(), months.indexOf(m[1]), m[2]);
    }
    throw "Unsupported format: " + format;
};

DateUtil.dayOfWeek = function(day) {
    if (day == 0) {
        return "Chủ nhật";
    }
    return "Thứ " + (day+1);
};

DateUtil.isToday = function(date) {
    return DateUtil.truncate(date).getTime() == DateUtil.truncate(new Date()).getTime();
};

DateUtil.dayEnd = function(date) {
    return new Date(DateUtil.truncate(DateUtil.addDays(date, 1)).getTime() - 1);
};
DateUtil.monthEnd = function(date) {
    return new Date(DateUtil.truncateMonth(DateUtil.addMonth(date, 1)).getTime() - 1);
};
DateUtil.truncate = function(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};
DateUtil.truncateHour = function(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0);
};
DateUtil.truncateMinute = function(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), 0);
};
DateUtil.truncateMonth = function(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
};

DateUtil.weekBegin = function(date) {
    var dow = date.getDay();

    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - dow, 0, 0, 0);
};


var TimingUtil = TimingUtil || {};

TimingUtil.syncDelay = function (f, delay) {
    delay = delay || 1000;

    var globalInterrupted = null;
    return function() {
        if (globalInterrupted) {
            globalInterrupted[0] = true;
        }
        var interrupted = [false];
        globalInterrupted = interrupted;
        setTimeout(function() {
            if (!interrupted[0]) {
                f();
            }
        }, delay);
    };
};
TimingUtil.repeativeCallLock = function (f, delay) {
    delay = delay || 1000;

    var lockUntil = null;
    return function() {
        var now = new Date().getTime();
        if (lockUntil != null && lockUntil > now) {
            return;
        }
        lockUntil = now + delay;
        f();
    };
};

var LangUtil = LangUtil || {};
LangUtil.booleanValue = function(o) {
    if (o == null) {
        return false;
    }

    if (o == false || o == true) {
        return o;
    }

    if (typeof o == "string") {
        return o != "false";
    }

    return true;
};
LangUtil.toNum = function(o) {
    if (o == null) {
        return null;
    }

    return o * 1;
};


var ObjectUtil = ObjectUtil || {};

ObjectUtil.equals = function (o1, o2) {
    if (o1 == null) {
        return o2 == null;
    }

    if (o2 == null) {
        return false;
    }

    if ((typeof o1) != (typeof o2)) {
        return false;
    }

    if (typeof o1 != "object") {
        return o1 == o2;
    }

    if (o1.length != o2.length) {
        return false;
    }

    for (var i in o1) {
        if (typeof i == "string" && i[0] == "$") {
            continue;
        }
        if (!ObjectUtil.equals(o1[i], o2[i])) {
            //console.log("Different: " + i);
            return false;
        }
    }
    for (var i in o2) {
        if (typeof i == "string" && i[0] == "$") {
            continue;
        }
        if (!ObjectUtil.equals(o1[i], o2[i])) {
            //console.log("Different: " + i);
            return false;
        }
    }

    return true;
};

ObjectUtil.copy = function(fromO, toO) {
    for (var name in fromO) {
        toO[name] = fromO[name];
    }
    return toO;
};


ObjectUtil.isEmpty = function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            return false;
        }
    }
    return true;
};

ObjectUtil.clone = function(obj) {
    if (obj == null
        || typeof obj != "object"
    ) {
        return obj;
    } else if (obj.length == null) {
        var ret = {};
        for ( var i in obj) {
            if (obj.hasOwnProperty(i)) {
                ret[i] = ObjectUtil.clone(obj[i]);
            }
        }
        return ret;
    } else {
        var ret = [];
        for (var i = 0; i < obj.length; i++) {
            ret[i] = ObjectUtil.clone(obj[i]);
        }
        return ret;
    }
};

ObjectUtil.clear = function(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            delete obj[prop];
        }
    }
};
ObjectUtil.hasValue = function(o) {
    if (o == null) {
        return false;
    }
    for (var i in o) {
        if (o.hasOwnProperty(i)) {
            return true;
        }
    }
    return false;
};
ObjectUtil.toStringLines = function(o) {
    if (o == null) {
        return "null";
    }
    return Cols.join(Cols.yield(o, function(i) { return JSON.stringify(i);}), "\n");
};

var Http = Http || {};
Http.afterSharp = function() {
    var href = window.location.href;
    var index = href.indexOf("#");
    if (index == -1) {
        return null;
    }
    return href.substring(index + 1);
};

var RegexUtil = RegexUtil || {};

RegexUtil.replaceAll = function(str, exp, replace) {

    if (typeof replace == "string") {
        var replaceStr = replace;
        replace = function(m) {
            return RegexUtil.replaceAll(replaceStr, "\\$(\\d+)", function(m1) {
                return m[1*m1[1]];
            });
        };
    }

    var result = "";

    for (;;) {
        var m = new RegExp(exp).exec(str);
        if (m != null) {
            result += str.substring(0, m.index);
            result += replace(m);
            str = str.substring(m.index + m[0].length);
        } else {
            return result + str;
        }
    }
};

var Fs = Fs || {};
Fs.p0 = function(p1, a) {
    return function() {
        p1(a);
    }
};
Fs.f0 = function(f1, a) {
    return function() {
        return f1(a);
    }
};

Fs.invokeAll = function(funcs, data1, data2) {
    for (var i in funcs) {
        funcs[i](data1, data2);
    }
};
Fs.invokeWithEach = function(list, func) {
    for (var i in list) {
        func(list[i]);
    }
};

Fs.invokeAllF = function(col) {
    return function() {
        Cols.each(col, function(f) { f(); });
    };
};

Fs.invokeChecks = function(funcs, data) {
    for (var i in funcs) {
        if (funcs[i](data)) {
            return true;
        }
    }
    return false;
};

Fs.cache = function(f0) {
    var invoked = false;
    var cachedData = null;
    return function() {
        if (!invoked) {
            cachedData = f0();
            invoked = true;
        }

        return cachedData;
    };
};

Fs.sequel = function (fs) {
    return function() {
        for (var i in fs) {
            fs[i]();
        }
    };
};

Fs.tail0 = function(func, a, b) {
    return function() {
        return func(a, b);
    };
};
Fs.tail1 = function(func, b, c) {
    return function(a) {
        return func(a, b, c);
    };
};
Fs.tail2 = function(func, c, d) {
    return function(a, b) {
        return func(a, b, c, d);
    };
};

Fs.invoke = function(func) {
    if ((typeof func) == "function") {
        return func();
    } else {
        return func;
    }
};

var Cols = Cols || {};

Cols.keepBestFound = function(items, count, orderF) {
    var handles = Cols.yield(items, function (item) {
        var order = orderF(item);
        return order == null ? null : {
            order: order,
            item: item
        };
    });
    var sorted = _.sortBy(handles, function(h) { return h.order; });

    return _.map(sorted.splice(0, count), "item");
};

Cols.keepOldRefs = function(newCol, oldCol, by) {
    if (oldCol == null) {
        return newCol;
    }

    for (var i = 0; i < newCol.length; i++) {
        var newE = newCol[i];
        var oldE = Cols.find(oldCol, function(oldE) {
            return oldE[by] == newE[by];
        });
        if (oldE != null) {
            ObjectUtil.clear(oldE);
            ObjectUtil.copy(newE, oldE);
            newCol[i] = oldE;
        }
    }
    return newCol;
};

Cols.assureLength = function(length, col, createNew) {
    for (; col.length < length;) {
        col.push(createNew ? createNew() : null);
    }
    col.splice(length, col.length - length);
};
Cols.values = function(map) {
    var ret = [];
    for ( var k in map) {
        ret.push(map[k]);
    }
    return ret;
};

Cols.length = function(obj) {
    var count = 0;
    for (var k in obj) {
        if (obj.hasOwnProperty(k) && obj[k] != null) {
            count++;
        }
    }
    return count;
};

Cols.find = function(col, func) {
    for (var i in col) {
        var e = col[i];
        if (func(e)) {
            return e;
        }
    }
    return null;
};

Cols.findReverse = function(col, func) {
    for (var i = col.length - 1; i > -1; i--) {
        var e = col[i];

        if (func(e)) {
            return e;
        }
    }
    return null;
};

Cols.findIndex = function(col,func){
    for(var i in col){
        var e = col[i];
        if(func(e)){
            return i;
        }
    }
    return null;
};

Cols.yield = function(col, func) {
    var ret = Array.isArray(col) ? [] : {};
    for (var i in col) {
        var e = func(col[i]);
        if (e != null) {
            ret.push(e);
        }
    }
    return ret;
};
Cols.filter = function(col, func) {
    var ret = [];
    for (var i in col) {
        var e = col[i];
        if (func(e)) {
            ret.push(e);
        }
    }
    return ret;
};
Cols.join = function(col, delimiter) {
    var ret = "";
    for (var i in col) {
        if (ret.length > 0) {
            ret += delimiter;
        }
        ret += col[i];
    }
    return ret;
};
Cols.joinWrap = function(col, start, end) {
    return start + Cols.join(col, end + start) + end;
};
Cols.merge = function(map1, map2) {
    for ( var k in map2) {
        map1[k] = map2[k];
    }
    return map1;
};

/**
 * Add from map1 to map2
 * @param map1
 * @param map2
 * @returns {*}
 */
Cols.mapAddAll = function(map1, map2) {
    for ( var k in map1) {
        if (map1.hasOwnProperty(k)) {
            map2[k] = map1[k];
        }
    }
    return map2;
};

Cols.eachLine = function(/*final List<F>*/ steps, /*final P2<F,P1<N>>*/ digF, /*final List<N>*/ collecteds, /*final P1<List<N>>*/ resultF) {

    if (steps.length == 0) {
        resultF(collecteds);
        return;
    }

    var feed = steps[0];
    digF(feed, function(n) {
        var newCollecteds = Cols.copy(collecteds);
        newCollecteds.push(n);
        Cols.eachLine(steps.slice(1, steps.length), digF, newCollecteds, resultF);
    });
};

Cols.each = function(col, p1) {
    for (var i = 0; i<col.length; i++) {
        p1(col[i]);
    }
};

Cols.eachEntry = function(obj, p2) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            p2(key, obj[key]);
        }
    }
};

Cols.split = function(col, max) {
    var ret = [];

    var buffer = [];
    for (var i = 0; i < col.length; i++) {
        var o = col[i];
        buffer.push(o);
        if ((i + 1) % max == 0) {
            ret.push(buffer);
            buffer = [];
        }
    }
    if (buffer.length > 0) {
        ret.push(buffer);
    }

    return ret;
};

/**
 * collect(ele, total)
 */
Cols.collect = function(col, init, collect) {
    if (col==null) {
        return init;
    }
    var total = init;
    for (var i in col) {
        total = collect(col[i], total);
    }
    return total;
};
Cols.sum = function(col, getNum) {
    return Cols.collect(col, 0, function(e, sum) {
        var val = (getNum ? getNum(e) : e);
        if (val == null) {
            return sum;
        }
        return val + sum;
    });
};

/**
 * p2<Element,P0 onDone>
 */
Cols.eachPar = function(col, p2) {
    Cols.eachPar1(0, col, p2);
};
Cols.eachPar1 = function(index, col, p2) {
    if (index >= col.length) {
        return;
    }

    p2(col[index], function() {
        Cols.eachPar1(index+1, col, p2);
    });
};


Cols.indexOf = function(ele, col, colExtract) {
    if (col==null) {
        return -1;
    }
    for (var i = 0; i < col.length; i++) {
        if (colExtract(col[i]) == ele) {
            return i;
        }
    }
    return -1;
};

Cols.indexUnique = function(col, by) {
    if (typeof by == "string") {
        var byAttr = by;
        by = function(ele) { return ele[byAttr];};
    }

    return Cols.collect(col, {}, function(ele, groups) {
        var key = by(ele);
        groups[key] = ele;
        return groups;
    });
};

Cols.copy = function(arr1) {
    var ret = [];

    for (var i in arr1) {
        ret.push(arr1[i]);
    }
    return ret;
};
Cols.eachChildRecursive = function(/*A*/ a,
                                   /*F1<A, Collection<A>>*/ digF,
                                   /*P1<A>*/ p1) {
    var col = digF(a);
    if (col==null) {
        return;
    }
    for (var childI in col) {
        var child = col[childI];
        p1(child);
        Cols.eachChildRecursive(child, digF, p1);
    }
};

Cols.addList = function(key, value, maps) {
    var list = maps[key];
    if (list == null) {
        list = [];
        maps[key] = list;
    }
    list.push(value);

    return function() {
        Cols.remove(value, list);
    }
};

Cols.isEmpty = function(col) {
    return col == null || col.length == 0;
};

Cols.isNotEmpty = function(col) {
    return !Cols.isEmpty(col);
};

Cols.addAll = function (from, to) {
    for (var i in from) {
        to.push(from[i]);
    }
};

Cols.addAllSet = function (from, to) {
    for (var i = 0; i < from.length; i++) {
        var e = from[i];
        if (to.indexOf(e) == -1) {
            to.push(e);
        }
    }
};

Cols.addAllSet_deepEquals = function (from, to) {
    F1:
    for (var i = 0; i < from.length; i++) {
        var e = from[i];

        for (var j = 0; j < to.length; j++) {
            var te = to[j];
            if (ObjectUtil.equals(e, te)) {
                continue F1;
            }
        }

        to.push(e);
    }
};

Cols.addRemove = function(col) {
    return function(item) {
        col.push(item);
        return function() {
            col.splice(col.indexOf(item), 1);
        }
    }
};

Cols.toEnd = function(array) {
    var i = array.length + 1;
    return function() {
        if (i > 1) {
            i--;
        }
        return array[array.length-i];
    }
};

Cols.remove = function(e, col) {
    var i = col.indexOf(e);
    if (i == -1) {
        return false;
    }
    col.splice(i, 1);
    return true;
};

Cols.removeBy = function(col, f) {
    var removed = [];
    for (var j = 0; j < col.length; j++) {
        var obj = col[j];
        if (f(obj)) {
            col.splice(j, 1);
            j--;
            removed.push(obj);
        }
    }
    return removed;
};
Cols.removeAll = function(col, list) {
    for (var i in col) {
        var item = col[i];
        var rowI = list.indexOf(item);

        if (rowI == -1) {
//            alert("Can not find");
            return;
        }
        list.splice(rowI, 1);
    }
};

Cols.sortBy = function(byF) {
    if (typeof byF == "string") {
        var byAttr = byF;
        byF = function(ele) { return ele[byAttr];};
    }

    var nullGoLast = true;
    return function(rd1, rd2) {
        var by1 = byF(rd1);
        var by2 = byF(rd2);

        if (by1 == null) {
            return by2 == null ? 0 : (nullGoLast ? 1 : -1);
        } else if (by2 == null) {
            return nullGoLast ? -1 : 1;
        }

        if ((typeof by1) == "string" ) {
            if (by1 < by2)
                return -1;
            if (by1 > by2)
                return 1;
            return 0;
        }
        return by1 - by2;
    };
};

Cols.index = function(col, by, valueF) {
    if (typeof by == "string") {
        var byAttr = by;
        by = function(ele) { return ele[byAttr];};
    }

    return Cols.collect(col, {}, function(ele, groups) {
        var index = by(ele);
        var list = groups[index];
        if (list == null) {
            list = [];
            groups[index] = list;
        }
        list.push(valueF == null ? ele : valueF(ele));
        return groups;
    });
};

Cols.reverseIndex = function(index) {
    var ret = {};

    for (var key in index) {
        var list = index[key];

        for (var i = 0; i < list.length; i++) {
            var value = list[i];

            var newList = ret[value];
            if (newList == null) {
                newList = [];
                ret[value] = newList;
            }
            newList.push(key);
        }
    }

    return ret;
};

Cols.group = function(col, by) {
    return Cols.values(Cols.index(col, by));
};
Cols.arraysEqual = function (a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};


Cols.addLists = function(cols) {
    var ret = [];
    for (var i = 0; i < cols.length; i++) {
        var col = cols[i];
        Cols.addAll(col, ret);
    }
    return ret;
}

var Async = Async || {};

Async.createLazyExec = function(delay) {
    var timeout;
    return function(task) {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(task, delay);
    }
};

/**
 * Once scheduled, it's fixed, can not reschedule until it's done
 * @param func
 * @returns {Function}
 */
Async.schedule = function(func) {
    var oldScheduleTime;
    var timeout;

    var invoke = function() {
        func();
        timeout = null;
        oldScheduleTime = null;
    };

    return function(delay) {
        var scheduledTime = new Date().getTime() + delay;

        if (oldScheduleTime != null && Math.abs(oldScheduleTime - scheduledTime) < 100) {
            // Scheduled at that time, no need to redo
            return;
        }

        timeout = setTimeout(invoke, delay);

        oldScheduleTime = scheduledTime;
    };
};


/**
 * After scheduled, can cancel or reschedule, only run once
 * @param func
 * @returns {Function}
 */
Async.scheduleFlex1 = function(func) {
    var timeout;
    var ran = false;

    var invoke = function () {
        func();
        ran = true;
    };

    var schedule = function(delay) {
        if (ran) { return; }

        if (timeout) {
            clearTimeout(timeout);
        }

        if (!delay) {
            invoke();
        } else {
            timeout = setTimeout(invoke, delay);
        }

    };

    schedule.cancel = function() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    return schedule;
};



Async.ladyFirst = function() {
    var afterLadyDone = [];
    var freeToGo = false;
    return {
        ladyDone: function() {
            freeToGo = true;
            if (Cols.isNotEmpty(afterLadyDone)) {
                Fs.invokeAll(afterLadyDone);
                afterLadyDone = [];
            }
        },
        manTurn: function(func) {
            if (freeToGo) {
                func();
            } else {
                afterLadyDone.push(func);
            }
        }
    };
};

/**
 * @return checkF(checkIndex);
 */
Async.runWhenAllChecked = function(checkCount, func) {
    var flags = new Array(checkCount);
    for (var i=0;i<checkCount;i++) {
        flags[i] = false;
    }
    return function(chechIndex) {
        flags[chechIndex] = true;

        for (var i=0;i<checkCount;i++) {
            if (flags[i] == false) {
                return;
            }
        }

        func();
    }
};

Async.runAfterCount= function(checkCount, func) {
    return function(chechIndex) {
        checkCount --;

        if (checkCount <= 0) {
            func();
        }
    }
};

/**
 * func(quantity) => interrupted
 * @param func
 */
Async.incrementalRepeater = function(func) {
    var quantityFF = function() {
        var i = 0;
        var array = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
        return function() {
            i++;
            return array[Math.min(parseInt(i / 10), array.length-1)];
        }
    };

    var createRunner = function() {

        var sleepTimeF = Cols.toEnd([400, 300, 300, 300, 200, 200, 100]);
        var quantityF = quantityFF();
        var alive = true;
        // Start
        var run = function() {
            if (!alive) {
                return;
            }
            var interrupted = func(quantityF());
            if (interrupted) {
                alive = false;
                return;
            }
            setTimeout(run, sleepTimeF());
        };
        run();

        return {
            stop: function() {
                alive = false;
            }
        };
    };
    var runner = null;
    return {
        start: function() {
            if (runner != null) {
                return;
            }
            runner = createRunner();
        },
        stop: function() {
            if (runner != null) {
                runner.stop();
                runner = null;
            }
        }
    };
};

/**
 * checkF(val, stillValid)
 * @return invoke(val)
 */
Async.lazyValidate = function(startF, checkF) {
    var validating = [null];
    return function(val) {
        if (val == null) {
            alert("Async.lazyValidate: Not support null value");
            return;
        }
        var thisValidate = [val];
        if (validating[0] != null) {
            if (validating[0][0] == val) {
                // This val is being validated (not done)
                return;
            }
            validating[0][0] = null;
        }
        validating[0] = thisValidate;
        var stillValid = function() {
            return thisValidate[0] != null;
        };

        startF();
        setTimeout(function() {
            if (!stillValid()) {
                return;
            }
            checkF(val, stillValid);
        }, 500);
    }
};

var EmailUtil = EmailUtil || {};
EmailUtil.validEmail = function (email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

var RandomUtil = RandomUtil || {};
RandomUtil.choose = function(list) {
    return list[Math.floor(Math.random() * list.length)];
};

var MathUtil = MathUtil||{};
MathUtil.incMap = function(key, map) {
    var value = map[key];
    if (value == null) {
        map[key] = 1;
    } else {
        map[key]++;
    }
};


var Watchers = {};
Watchers.watcher = function(onChange) {
    var oldValue;
    return function(currentValue) {
        if (currentValue != oldValue) {
            onChange(currentValue);
            oldValue = currentValue;
        }
    }
};

try {
    module.exports = {
        ObjectUtil: ObjectUtil,
        Cols: Cols,
        StringUtil: StringUtil,
        RandomUtil: RandomUtil
    };
    global.Fs = Fs;
    global.Cols = Cols;
    global.ObjectUtil = ObjectUtil;
    global.StringUtil = StringUtil;
    global.RandomUtil = RandomUtil;
    global.MathUtil = MathUtil;
    global.Watchers = Watchers;
} catch (e) {
}

