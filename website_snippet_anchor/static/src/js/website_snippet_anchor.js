/* © 2015 Antiun Ingeniería S.L. - Jairo Llopis
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
 */

odoo.define('foo.bar', function (require) {
    'use strict';
    var website = require('website.website');
    var options = require('web_editor.snippets.options');
    var editor = require('website.editor');
    var widget = require('web_editor.widget');
    var core = require('web.core');
    var ajax = require('web.ajax');
    var qweb = core.qweb;
    var _t = core._t;

    // Option to have anchors in snippets
    options.registry.anchor = options.Class.extend({
        start: function () {
            var self = this;
            console.log(self.$el.find('.js_anchor'));
            self.$el.find(".js_anchor").click(function (event) {
                return self.select(event, _t("Choose anchor"));
            });
        },

        /**
         * Allow to set anchor name.
         */
        select: function (event, window_title, default_) {
            var self = this;
            default_ = default_ || self.$target.attr("id");
            website.prompt({
                "window_title": window_title,
                "default": default_,
                "input": _t("Name"),
            }).then(function (answer) {
                if (answer) {
                    if (-1 != $.inArray(answer,
                                  self.current_anchors(self.$target[0]))) {
                        return self.select(
                            event,
                            _t("Anchor already exists: ") + answer,
                            answer
                        );
                    } else {
                        self.update_anchor(self.$target, answer);
                    }
                } else {
                    self.$target.removeAttr("id");
                }
            });
        },

        /**
         * Return an array of anchors except the one found in `except`.
         */
        current_anchors: function (except) {
            var anchors = Array();

            $("[id]").not(except).each(function () {
                anchors.push($(this).attr("id"));
            });

            return anchors;
        },

        /**
         * Update an anchor and all its dependencies.
         */
        update_anchor: function ($element, new_anchor, old_anchor) {
            old_anchor = old_anchor || $element.attr("id");
            var new_hashed = "#" + new_anchor,
                old_hashed = "#" + old_anchor;

            // Set new anchor
            $element.attr("id", new_anchor);
            $element.attr("data-cke-saved-id", new_anchor);

            // Fix other elements' attributes. The "data-cke-saved-*" attribute
            // forces Odoo to update when no visible changes are made.
            $("[href='" + old_hashed + "'], \
               [data-cke-saved-href='" + old_hashed + "']")
                .attr("href", new_hashed)
                .attr("data-cke-saved-href", new_hashed);
            $("[data-target='" + old_hashed + "']")
                .attr("data-target", new_hashed);
            $("[for='" + old_anchor + "'], \
               [data-cke-saved-for='" + old_anchor + "']")
                .attr("for", new_anchor)
                .attr("data-cke-saved-for", new_anchor);
        },
    });

    // Load QWeb js snippets
    ajax.loadXML('/website_snippet_anchor/static/src/xml/website_snippet_anchor.xml', qweb);

    // Add anchor to link dialog
    widget.LinkDialog = widget.LinkDialog.extend({
        /**
         * Allow the user to use only an anchor.
         */
        get_data: function (test) {
            var $anchor = this.$el.find("#anchor");

            if (test !== false && $anchor.val()) {
                var $url_source = this.$el
                                  .find(".active input.url-source:input"),
                    style = this.$el
                            .find("input[name='link-style-type']:checked")
                            .val(),
                    size = this.$el
                           .find("input[name='link-style-size']:checked")
                           .val(),
                    classes = (style && style.length ? "btn " : "") +
                              style + " " + size;

                return new $.Deferred().resolve(
                    $url_source.val() + "#" + $anchor.val(),
                    this.$el.find("input.window-new").prop("checked"),
                    this.$el.find("#link-text").val() || $url_source.val(),
                    classes);
            } else {
                return this._super(test);
            }
        },

        /**
         * Put data in its corresponding place in the link dialog.
         *
         * When user edits an existing link that contains an anchor, put it
         * in its field.
         */
        bind_data: function () {
            var url_parts = this.data.url.split("#", 2);

            if (url_parts.length > 1) {
                this.data.url = url_parts[0];
                this.$el.find("#anchor").val(url_parts[1]);
            }

            return this._super.apply(this, arguments);
        },
    })
});
