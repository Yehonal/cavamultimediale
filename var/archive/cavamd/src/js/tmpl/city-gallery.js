/**
 * 
 * Generic gallery 
 */

hwc.include([
    "hwc!{CMDPATH_JS}tmpl/prototype/GalleryPage.js"
]).define(function () {
    var $ = this;

    CMD.Gallery = $.class.extends(CMD.GalleryPage)([
        $.public({
            __construct: function (parent, childs, opt) {
                this.i.parentPage = "city-main";
                var cat = $.Browser.Router.I().getRouteInfo().getPath().split("-");
                switch (cat[0]) {
                    case "cavaoggi":
                        opt.imgCnt = 44;
                        break;
                    case "cavaieri":
                        opt.imgCnt = 84;
                        break;
                    default:
                        opt.imgCnt = 0; // shouldn't happen
                }

                this.__super(parent, childs, opt);
            }
        })
    ]);

    return CMD.Gallery;
});