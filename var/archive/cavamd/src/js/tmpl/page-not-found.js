hwc.include([
    "hwc!{CMDPATH_JS}tmpl/prototype/StandardPage.js"
]).define(function () {
    var $ = this;

    CMD.PageNotFound = $.class.extends(CMD.StandardPage)([
        $.public({
            __construct: function (parent, childs, opt) {
                this.i.parentPage = "main";
                this.__super(parent, childs, opt, "page-not-found");
            },
            init: function () {
                return this.__super();
            },
            __destruct: function () {
                this.__super();
            },
            build: function () {
                this.__super();

                $.Browser.JQ.getJSON($.const.CMDPATH_MEDIA + 'text/system/' + CMD.Language.I().getFPrefix() + 'system.json',
                    function (json) {
                        $.Browser.JQ("#not-found-message").text(json["pagenotfound"]);
                    }
                );
            }
        })
    ]);

    return CMD.PageNotFound;

});