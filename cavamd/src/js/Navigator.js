'use strict';

hwc.include([
    "hwc!{PATH_JS_LIB}browser/router/index.js",
]).define(function () {
    var $ = this;
    /*window.onpopstate = function (event) {
     Hw2.Navigator.checkPage();
     // if we are not on popstate of page init
     if (!Hw2.Navigator.isRefreshing())
     hwcBody.update();
     };*/

    CMD.Navigator = $.class([
        $.private.static({
            oldPage: null,
            curPage: null,
            oldUri: null,
            curUri: null
        }),
        $.public.static({
            getCurPage: function () {
                return this._s.curPage;
            },
            getOldPage: function () {
                return this._s.oldPage;
            },
            getCurUri: function () {
                return this._s.curUri;
            },
            getOldUri: function () {
                return this._s.oldUri;
            },
            isRefreshing: function () {
                return Hw2.Navigator.oldUri && JSON.stringify(Hw2.Navigator.oldUri) === JSON.stringify(Hw2.Navigator.curUri);
            },
            checkPage: function (reset) {
                this._s.oldUri = Hw2.Tools.cloneObj(this._s.curUri);
                this._s.curUri = new Hw2.Uri.getInstance(true);

                var page = this._s.curUri.getParam("page") || HWC_BODY_INTRO_PAGE();
                if (page && Hw2.PathManager.fileExists(HWCPATH_CAVA + "tmpl/" + page.toLowerCase() + ".html")) {
                    if (reset === true) {
                        this._s.oldPage = null;
                        this._s.curPage = page;
                    } else {
                        this._s.oldPage = this._s.curPage;
                        this._s.curPage = page;
                    }
                } else {
                    this._s.oldPage = this._s.curPage;
                    this._s.curPage = 'PageNotFound';
                    console.error("Page " + page + " doesn't exists!");
                }
            },
            go: function (page, params) {
                if (!page)
                    page = this._s.curPage;

                if (params) {
                    var tmp = {};
                    tmp["page"] = page;
                    var p = jQuery.extend(tmp, params);
                    Hw2.Uri.updateParams(p, false, false, "");
                } else {
                    Hw2.Uri.updateParam("page", page, false, false, "");
                }

                this._s.update();
            },
            isNewPage: function () {
                return !pageInst || Nav.getOldPage() !== Nav.getCurPage();
            },
            goBack: function () {
                var bPage = hwcBody.getCurPage().backPage;
                if (bPage)
                    Hw2.Navigator.go(bPage);
                else
                    Hw2.Navigator.back();
            },
            update: function () {
                window.onpopstate();
            },
            menu: function () {
                $.Browser.Router.I().navigate({component: "main"});
            }
        })
    ]);

    return CMD.Navigator;

});