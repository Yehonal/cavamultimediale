hwc.include([
    "hwc!{PATH_JS_LIB}browser/application/Component.js"
]).define(function () {
    var $ = this;

    CMD.TemplateClass = $.public.abstract.class.extends($.Browser.Component)([
        $.protected({
            parentPage: null
        }),
        $.public({
            __construct: function (parent, childs, opt, pageName) {
                var template = new $.Browser.Template($.const.CMDPATH_SRC + "tmpl/" + pageName + ".html", $.const.CMDPATH_SRC + "css/tmpl/" + pageName + ".css");
                opt.template = template;
                this.__super(parent, childs, opt);
            },
            getParentPage: function () {
                return this.i.parentPage;
            }
        })
    ]);

});
