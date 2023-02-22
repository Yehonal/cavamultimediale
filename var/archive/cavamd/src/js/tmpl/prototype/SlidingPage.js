hwc.include([
    "hwc!{CMDPATH_JS}tmpl/prototype/TemplateClass.js"
]).define(function () {
    var $ = this;

    CMD.SlidingPage = $.abstract.class.extends(CMD.TemplateClass)([
        $.public({
            __construct: function (parent, childs, opt, pageName) {
                $.Browser.JQ("#application").prepend("<div id='application-content-trans' class='empty'></div>");
                opt.selector = "#application-content-trans.empty";
                this.__super(parent, childs, opt, pageName);
            },
            init: function () {
                var that = this;
                var parent = this.i.parent;
                var evtHandler = parent.eventHandler;

                return this.__super().then(function () {
                    var defer = $.Async.defer();

                    var _end = function () {
                        parent.reset();

                        $.Browser.JQ('#application-content').remove();
                        $.Browser.JQ('#application-content-trans').removeClass("empty");
                        $.Browser.JQ('#application-content-trans').attr("id", "application-content");
                        $.Browser.JQ('#application-content-trans').remove();

                        defer.resolve();
                    };

                    if (parent.getPrevContent()) {
                        // workaround to original effect that doesn't show 
                        // flags during animation.
                        // The right way to handle it should instead load a new bar
                        // over old one that will replace it during animation
                        evtHandler.trigger("onPageChangeAnim");
                        $.Browser.JQ("#bottom-left").empty();
                        $.Browser.JQ("#application-content-trans").animate({width: "100%"}, 1000, function () {
                            _end();
                        });
                    } else {
                        _end();
                    }

                    return defer.promise;
                });
            }
        })
    ]);

    return CMD.SlidingPage;
});
