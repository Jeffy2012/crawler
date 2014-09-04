var fs = require("fs");
var appInfo = store.get("appInfo") || {};
var xlsx = require('node-xlsx');
var huaBid = {
    errors: [],
    progress: [],
    db: new IDBStore({
        dbVersion: 1,
        storeName: "huaBidAuction",
        keyPath: 'id',
        indexes: [
            {
                name: "price",
                keyPath: "price"
            },
            {
                name: "id",
                keyPath: "id"
            },
            {
                name: "date",
                keyPath: "date"
            }
        ]
    }),
    getPages: function () {
        var first = parseInt($("#huaBid-first-page").val(), 10);
        var last = parseInt($("#huaBid-last-page").val(), 10);
        if (first && last) {
            this.pages = _.range(first, last + 1);
        } else {
            alert("输入正确的页码");
        }
        return this;
    },
    getDate: function () {
        var date1 = $("#huaBid-first-day").val();
        var date2 = $("#huaBid-last-day").val();
        this.date = {
            txtDate1: date1,
            txtDate2: date2
        };
        return this;
    },
    date: {
        txtDate1: "2014-01-01",
        txtDate2: "2014-01-31"
    },
    totalPagePartner: /<a pageNo="(\d*)" href=/ig,
    auctionPartner: /<tr class=".*">.*target="_blank"> *(.*) *<\/a>.*<td>(.*)<\/td>.*<td>¥\s(.*)<\/td>.*<time.*> *(.*) *<\/time>.*<a.*(?:vlaue|valu)="(\d*)".*>.*<\/tr>/ig,
    totalPage: 1,
    fetchTotalPage: function () {
        var self = this;
        var promise = $.ajax({
            url: "http://www.huabid.com/auctionList/all/all/history",
            data: {
                showType: "",
                //orderBy: 6,
                topicId: "",
                quantityId: "",
                p1: "0000000",
                p2: "",
                p3: "",
                p4: "",
                p5: "",
                p6: "",
                pageNo: 1,
                keyword: ""
            }
        });
        promise
            .done(function (data) {
                var totalPage = 0;
                while (self.totalPagePartner.exec(data)) {
                    totalPage = Math.max(parseInt(RegExp.$1), totalPage);
                }
                self.totalPage = totalPage;
            });
        return promise;
    },
    saveAsFile: function () {
        var self = this;
        var keyRange = self.db.makeKeyRange({
            lower: new Date(self.date.txtDate1),
            excludeLower: false,
            upper: new Date(self.date.txtDate2),
            excludeUpper: false
        });
        self.db.query(function (auctions) {
            var data = auctions.map(function (auction) {
                return _.values(auction);
            });
            var buffer = xlsx.build({worksheets: [
                {"name": "xlsx", "data": data}
            ]});
            fs.writeFileSync('d:/b.xlsx', buffer, 'binary');
        }, {
            index: "date",
            keyRange: keyRange
        });
    },
    check: function () {
        var arr = [];
        for (var key in appInfo) {
            if (appInfo[key].length != 20) {
                arr.push(+key);
            }
        }
        return arr;
    },
    fetch: function () {
        var promises = [],
            self = this,
            i = 0,
            l = this.pages.length;
        this.errors = [];
        this.pages.forEach(function (pageNo) {
            var promise = self.query({pageNo: pageNo});
            promise
                .always(function () {
                    i++;
                    $(".info").html("success:" + (i - self.errors.length)
                        + "<br/>error:" + self.errors.length
                        + "<br/>total:" + l);
                    self.progress = [i, l];
                });
            promises.push(promise);
        });
        return promises;
    },
    query: function (query) {
        var self = this;
        query = _.extend({
            //orderBy: 6,
            p1: 1000000,
            pageNo: 1
        }, query || {});
        var promise = $.ajax({
            url: "http://www.huabid.com/auctionList/all/bid/history",
            data: query
        });
        promise
            .done(function (data) {
                var pageData = [];
                data = data.replace(/\s+/igm, " ").replace(/<\/tr>/ig, "</tr>\n");
                while (self.auctionPartner.exec(data)) {
                    pageData.push({
                        id: parseInt(RegExp.$5, 10),
                        title: RegExp.$1,
                        character: RegExp.$2,
                        price: +RegExp.$3,
                        date: new Date(RegExp.$4)
                    });
                }
                self.db.putBatch(pageData, function () {
                    var info = appInfo[query.pageNo] = {};
                    info.length = pageData.length;
                    store.set("appInfo", appInfo);
                }, function (error, b, c) {
                    console.log(error, b, c);
                    self.errors.push(query.pageNo);
                });
            })
            .fail(function () {
                self.errors.push(pageNo);
            });
        return promise;
    }
};
var xuYi = {
    auctionPartner: /<table.*(\d{6,})&nbsp;.*编号：〔(\d{5,}).*target="_blank">(.*)<\/a><\/span>.*起拍价：¥ (\d{1,}).*(?:结标价|当前价):(\d*|无人出价).*竞拍次数:(\d*).*<\/table>/ig,
    getPage: function () {
        var first = parseInt($("#first-page").val(), 10);
        var last = parseInt($("#last-page").val(), 10);
        if (first && last) {
            this.pages = _.range(first, last + 1);
        } else {
            alert("输入正确的页码");
        }
        return this;
    },
    getIds: function () {
        var first = parseInt($("#first-one").val(), 10);
        var last = parseInt($("#last-one").val(), 10);
        if (first && last) {
            this.ids = [first, last];
        } else {
            alert("输入正确的标号（ID）");
        }
        return this;
    },
    db: new IDBStore({
        dbVersion: 1,
        storeName: "xuYiAuction",
        keyPath: 'ID',
        indexes: [
            {
                name: "ID",
                keyPath: "ID"
            },
            {
                name: "NO",
                keyPath: "NO"
            }
        ]
    }),
    fetch: function () {
        var array = this.pages,
            promises = [],
            self = this,
            i = 0,
            l = array.length;
        this.errors = [];
        array.forEach(function (pageNo) {
            var promise = self.query({pageNo: pageNo});
            promise
                .always(function () {
                    i++;
                    $(".info").html("success:" + (i - self.errors.length)
                        + "<br/>error:" + self.errors.length
                        + "<br/>total:" + l);
                    self.progress = [i, l];
                });
            promises.push(promise);
        });
        return promises;
    },
    query: function (query) {
        var self = this;
        query = _.extend({
            EventId: 0,
            scid: 1,
            pageNo: 1
        }, query || {});
        var promise = $.ajax({
            url: "http://www.xuyistamps.com/Scene/ProductListByEvent.aspx",
            data: query
        });
        promise
            .done(function (data) {
                var pageData = [], auction;
                data = data.replace(/\s+/igm, " ").replace(/<\/table>/ig, "</table>\n");
                while (auction = self.auctionPartner.exec(data)) {
                    pageData.push({
                        ID: parseInt(RegExp.$1, 10),
                        NO: parseInt(RegExp.$2, 10),
                        name: RegExp.$3,
                        initPrice: parseInt(RegExp.$4, 10),
                        price: parseInt(RegExp.$5, 10) || 0,
                        times: parseInt(RegExp.$6, 10)
                    });
                }
                self.db.putBatch(pageData, function () {
                    var info = appInfo[query.pageNo] = {};
                    info.length = pageData.length;
                    store.set("appInfo", appInfo);
                }, function (error, b, c) {
                    console.log(error, b, c);
                    self.errors.push(query.pageNo);
                });
            })
            .fail(function () {
                self.errors.push(pageNo);
            });
        return promise;
    },
    saveAsFile: function () {
        var self = this;
        var range = this.ids;
        var keyRange = self.db.makeKeyRange({
            lower: range[0],
            excludeLower: false,
            upper: range[1],
            excludeUpper: false
        });
        self.db.query(function (auctions) {
            var data = auctions.map(function (auction) {
                return _.values(auction);
            });
            var buffer = xlsx.build({worksheets: [
                {"name": "xlsx", "data": data}
            ]});
            fs.writeFileSync('d:/b.xlsx', buffer, 'binary');
        }, {
            index: "ID",
            keyRange: keyRange
        });
    }
};
var yaQu = {
    totalPagePartner: /<span id="labelPageCount" style="font-weight:bold;">(\d*)<\/span>页显示/ig,
    auctionPartner: /<tr> <td width="100px".*><strong>(.*)<\/strong><\/td>.*target="_blank">(.*)<\/a><\/strong>.*dashed #999;">(.*)<\/td> <td style="margin:12px 0px 12px 0px;.*(\d{4}-\d{2}-\d{2}).*￥(.*)<\/p><\/td> <\/tr>/ig,
    db: new IDBStore({
        dbVersion: 1,
        storeName: "yaQuAuction",
        keyPath: 'NO',
        indexes: [
            {
                name: "date",
                keyPath: "date"
            }
        ]
    }),
    getDate: function () {
        var date1 = $("#first-day").val();
        var date2 = $("#last-day").val();
        this.date = {
            txtDate1: date1,
            txtDate2: date2
        };
        return this;
    },
    date: {
        txtDate1: "2014-01-01",
        txtDate2: "2014-01-31"
    },
    getTotalPage: function () {
        var self = this;
        var promise = $.ajax({
            url: "http://www.99yq.com/ChengJiao.aspx",
            method: "POST",
            data: _.extend({
                __EVENTTARGET: "",
                __EVENTARGUMENT: "",
				__VIEWSTATE: "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",
				__PREVIOUSPAGE: "STYKCnEE92UtPpWVKx0sug2",
				__EVENTVALIDATION: "/wEWEQLq/I7/DQKLsufxCAKLspvtDQL9h52dCQLEhPyQAgLEhMD/BwLHsbiiDAKyl4aoBAKM0ruDBAKAtKPICALd7uXIDwLEhPSGBALgx43kCwKC7uXKBQKHqMuqDwK4ocseAt+NxyBBK9iQGwJk57CmujQ0offnNdROzQKw+EaTr7jpRucYEw==",
                cbTextType: "name",
                txtText: "",
                txtPage: 1,
                "bnGoPage.x": 10,
                "bnGoPage.y": 9,
                returnMessage: "",
                fieldPageIndex: 1
            }, self.date)
        });
        promise
            .done(function (data) {
                var totalPage = 0;
                while (self.totalPagePartner.exec(data)) {
                    totalPage = parseInt(RegExp.$1, 10);
                }
                if (totalPage > 0) {
                    self.totalPage = totalPage;
                    self.pages = _.range(1, totalPage + 1);
                }
            });
        return promise;
    },
    fetch: function () {
        var array = this.pages,
            promises = [],
            self = this,
            i = 0,
            l = array.length;
        this.errors = [];
        array.forEach(function (pageNo) {
            var promise = self.query({txtPage: pageNo});
            promise
                .always(function () {
                    i++;
                    $(".info").html("success:" + (i - self.errors.length)
                        + "<br/>error:" + self.errors.length
                        + "<br/>total:" + l);
                    self.progress = [i, l];
                });
            promises.push(promise);
        });
        return promises;
    },
    query: function (query) {
        var self = this;
        query = _.extend({
            __EVENTTARGET: "",
            __EVENTARGUMENT: "",
            __VIEWSTATE: "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",
            __PREVIOUSPAGE: "STYKCnEE92UtPpWVKx0sug2",
            __EVENTVALIDATION: "/wEWEQLq/I7/DQKLsufxCAKLspvtDQL9h52dCQLEhPyQAgLEhMD/BwLHsbiiDAKyl4aoBAKM0ruDBAKAtKPICALd7uXIDwLEhPSGBALgx43kCwKC7uXKBQKHqMuqDwK4ocseAt+NxyBBK9iQGwJk57CmujQ0offnNdROzQKw+EaTr7jpRucYEw==",
            cbTextType: "name",
            txtText: "",
            txtPage: 1,
            "bnGoPage.x": 10,
            "bnGoPage.y": 9,
            returnMessage: "",
            fieldPageIndex: 1
        }, query || {}, self.date);
        var promise = $.ajax({
            method: "POST",
            url: "http://www.99yq.com/ChengJiao.aspx",
            data: query
        });
        promise
            .done(function (data) {
                var pageData = [], auction;
                data = data.replace(/\s+/igm, " ").replace(/<\/tr>/ig, "</tr>\n");
                while (auction = self.auctionPartner.exec(data)) {
                    pageData.push({
                        NO: RegExp.$1,
                        name: RegExp.$2,
                        character: RegExp.$3,
                        date: new Date(RegExp.$4),
                        price: +RegExp.$5 || 0
                    });
                }
                self.db.putBatch(pageData, function () {
                    var info = appInfo[query.pageNo] = {};
                    info.length = pageData.length;
                    store.set("appInfo", appInfo);
                }, function (error, b, c) {
                    console.log(error, b, c);
                    self.errors.push(query.pageNo);
                });
            })
            .fail(function () {
                self.errors.push(pageNo);
            });
        return promise;
    },
    saveAsFile: function () {
        var self = this;
        var keyRange = self.db.makeKeyRange({
            lower: new Date(self.date.txtDate1),
            excludeLower: false,
            upper: new Date(self.date.txtDate2),
            excludeUpper: false
        });
        self.db.query(function (auctions) {
            var data = auctions.map(function (auction) {
                return _.values(auction);
            });
            var buffer = xlsx.build({worksheets: [
                {"name": "xlsx", "data": data}
            ]});
            fs.writeFileSync('e:/b.xlsx', buffer, 'binary');
        }, {
            index: "date",
            keyRange: keyRange
        });
    }
};
$(document).ready(function () {
    $("#fetch-YiXu").click(function () {
        xuYi.getPage().fetch();
    });
    $("#create-YiXu").click(function () {
        xuYi.getIds().saveAsFile()
    });
    $("#fetch-YaQu").click(function () {
        yaQu.getDate().getTotalPage().done(function () {
            yaQu.fetch();
        });
    });
    $("#create-YaQu").click(function () {
        yaQu.saveAsFile()
    });
    $("#fetch-HuaBid").click(function () {
        huaBid.getPages().fetch();
    });
    $("#create-HuaBid").click(function () {
        huaBid.getDate().saveAsFile();
    });
    /*huaBid.fetchTotalPage().done(function () {
     if (huaBid.totalPage - 1 > Object.keys(appInfo).length) {
     $(".update").show();
     }
     });
     $(".update").click(function () {
     var all = _.range(1, huaBid.totalPage);
     var fetched = Object.keys(appInfo).map(function (id) {
     return +id;
     });
     */
    /*        _.difference(_.range(1, huaBid.totalPage), Object.keys(appInfo).map(function (id) {
     return +id;
     }));*/
    /*
     $.when.apply($, huaBid.fetch(_.difference(all, fetched))).always(function () {
     console.log("fetch over!!!");
     });
     });
     var total = 0;
     $(".total").click(function () {
     huaBid.db.getAll(function (all) {
     all.forEach(function (auction) {
     total += auction.price * 100;
     });
     console.log(total / 100, all.length);
     });
     });*/
});