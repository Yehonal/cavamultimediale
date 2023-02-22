hwc.include([
    "hwc!{CMDPATH_JS}tmpl/prototype/TemplateClass.js"
]).define(function () {
    var $ = this;

    CMD.StandardPage = $.abstract.class.extends(CMD.TemplateClass)([
        $.public({
            __construct: function (parent, childs, opt, name) {
                opt.selector = "#application-content";
                this.__super(parent, childs, opt, name);
            },
            init: function () {
                var parent = this.i.parent;
                var curr = this.i.getRouter().getRouteInfo().getComponent();
                var prev = this.i.getRouter().getPrevRouteInfo();

                // Instructions that must be executed only when new page loaded
                if (!prev || curr != prev.getComponent()) {
                    // reset content
                    parent.reset();
                }

                return this.__super();
            }
        })
    ]);

});