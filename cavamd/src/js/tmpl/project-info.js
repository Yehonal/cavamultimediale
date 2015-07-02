hwc.include([
    "hwc!{CMDPATH_JS}tmpl/prototype/StandardPage.js"
]).define(function () {
    var $ = this;

    CMD.ProjectInfo = $.class.extends(CMD.StandardPage)([
        $.public({
            __construct: function (parent, childs, opt) {
                this.i.parentPage = "main";
                this.__super(parent, childs, opt, "project-info");
            },
            init: function () {
                return this.__super().then(function () {
                    // if music is terminated, restart it
                    CMD.BgMusic.I().play(CMD.BgMusic.PlayList.space);

                    $.Browser.JQ.getJSON($.const.CMDPATH_MEDIA + 'text/proj-info/' + CMD.Language.I().getFPrefix() + 'sidemenu.json',
                        function (json) {
                            for (var k in json) {
                                $.Browser.JQ("#nav-" + k).text(json[k]);
                                $.Browser.Router.I().setRoute("#nav-" + k, {path: k});
                            }
                        }
                    );
                });
            },
            __destruct: function () {
                this.__super();

                $.Browser.JQ("#project-info").remove();
            },
            build: function () {
                this.__super();
                var path = this.i.getRouter().getRouteInfo().getPath();
                var page = path || "intro";

                $.Browser.Loader.load(
                    $.const.CMDPATH_SRC + "tmpl/projectinfo-pages/" + CMD.Language.I().getFPrefix() + "-" + page + ".html",
                    null,
                    {selector: "#info"}
                );
            }
        })
    ]);

    return CMD.ProjectInfo;
});