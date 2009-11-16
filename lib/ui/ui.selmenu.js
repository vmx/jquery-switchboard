/*
 * jQuery UI Selmenu widget @VERSION
 *
 * Depends:
 *  - ui.core.js (1.3.2)
 *
 * Limitations:
 *   - values for one menu must be unique
 *
 *
 * Licensed under the MIT Licence:
 *
 * Copyright (c) 2009 State of New South Wales through the Department of
 * Environment and Climate Change.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to 
 * deal in the Software without restriction, including without limitation the 
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in 
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 *
 */
(function($) {

$.widget("ui.selmenu", {

    plugins: {},

    _init: function() {
        var self = this;
        var o = this.options;

        this.element.addClass("ui-selmenu");
        if (o.isDropdown)
            this.element.addClass("ui-selmenu-dropdown");

        // Stores a lookup table between values and the position of
        // the item within the menu. The value is the key, the index
        // the value.
        this.valueMap = {};
        this.initText = this.element.text();
        this.element.empty();

        // the drop down menu you can select items from
        this.menu = $('<ul/>')
                      .appendTo(this.element)
                      .addClass('ui-widget')
                      .addClass('ui-corner-all')
                      //.width(this.element.outerWidth())
                      ;

        // When mouse hovers over selection list, make sure
        // that any previously selected items will be de-selected
        // TODO: this slows down the menu a bit. find a faster solution
        // This is sort of a hack.
        this.menu.bind('mouseover', function() {
            $(this).find('li a.active').removeClass("active");
        });

        // the currently selected item
        this.selected = $('<div></div>')
                .addClass('selected')
                .appendTo(this.element);

        this.selectedItem = $('<a class="ui-selmenu-item"></a>')
                .appendTo(this.selected);

        if (this.initText) {
            this.selectedItem.text(this.initText);
        }

        // area to click on to get the drop down menu
        this.more = $('<span>&#160;</span>')
                .addClass('ui-widget-content')
                .addClass('ui-selmenu-more')
                //.addClass('ui-widget ui-widget-content ui-selmenu-more ui-icon ui-icon-play')
                .appendTo(this.selected)
                .click(function() {
                        //self.log('Click!', this);
                        self.toggleMenu();
                });


        // Workaround bug where multiple rows can be 
        // selected when moving mouse out and then back
        // into menu
        /*
        this.element.hover(null, 
            function(evt) {
                    $(this).children().find('.selectedMenu').removeClass("selectedMenu");
            });
        */

        this.element.click(function(evt) {
            //$.log('Click', evt);
            var target = $(evt.target);
            var value = target.data('value');
            var label = target.text();

            // If the element has no value and the isDropdown has been set to false,
            // we look for the value that has been set
            if (!value && !self.options.isDropdown) {
                var newTarget = target.find('.selected > .ui-selmenu-item');
                value = newTarget.data('value');
                //$.log('Finding value', value,newTarget, evt, self.options.isDropdown);
            }

/*/
            if (target[0]==$(this).find('.selected .ui-selmenu-item')[0]) {
                if (self.options.mode == "dropdown") {
                  self.toggleMenu();
                }
            }
            // any item was clicked (but not the dropdown icon)
            else  if (!target.is('.ui-selmenu-more')) {
                    self.hideMenu();
                    if (value)
                        self.trigger('click', null, self.ui(value, label));
            }
*/

            if (!target.is('.ui-selmenu-more')) {
                if (self.options.isDropdown){
                        //&& target[0]==$(this).find('.selected .ui-selmenu-item')[0]) {
                    self.toggleMenu();
                }
                else {
                    self.hideMenu();
                }

                if (value) {
                    //$.log("Menu click", value, target, self.options, self.ui(value, label));
                    //self._trigger('change', null, self.ui(value, label)); // rdewit
                    self._trigger('click', null, self.ui(value, label));
                }
            }


            // only if an item of the dropdown was clicked
            var item = target.parents('li').andSelf();
            if (item.is('li')) {
                self.select(value, false);
                //self._trigger('change', null, self.ui(value, label));
            }
        });

        // preserve style
        self.originalStyle = self.element.attr("style");

        this.setItems(this.options.items);

        // Hide menu when clicked outside of it
        $(document).bind('mousedown', function(evt) {
            if ($(evt.target).parents('.ui-selmenu').length==0)
                self.menu.fadeOut();
        });

        this.menu.hide();
        this._trigger('ready', null, this.menu); // rdewit
    },

    data: function() {
        var data;
        var value = this.value();
        var label = this.label();
        if (value || label) {
            data = {};
            data.value = value;
            data.label = label;
        }
        return data;
    },

    destroy: function() {
        this.element.unbind();
        this.element.removeData('selmenu');
        this.element.removeClass('ui-selmenu ui-selmenu-dropdown').empty();
        this.element.attr('style', this.originalStyle);
        this.element.text(this.initText);
    },

    // TODO
    disable: function() {
        this.element.addClass('ui-selmenu-disabled');
        this.disabled = true;
    },

    // TODO
    enable: function() {
        this.element.removeClass('ui-selmenu-disabled');
        this.disabled = false;
    },

    getLabelByValue: function(value) {
        var item = this.lookuptable[value];
        var label;
        for (key in this.lookuptable) {
            if (this.lookuptable[key] == value) {
                 label = key;
                 break;
            }
        }
        return label;
    },

    getValueByLabel: function(label) {
        var value = this.lookuptable[label];
        return value;
    },

    hideMenu: function() {
        this.menu.hide();
    },

    index: function() {
        return this.selectedIndex;
    },

    label: function() {
        var result = null;
        for (label in this.lookuptable) {
            if (this.lookuptable[label] == this.selectedValue) {
                 result = label;
                 break;
            }
        }
        return result;
    },


    // select an item from the menu by value or by index
    select: function(value, propagate) {
        //$.log("Do select", value, propagate);

        // Don't do anything when there is no value
        if (typeof value == "undefined" || value == null) {
            return;
        }

        //propagate = !(propagate === false);
        propagate = true;

        // the label shown at the top is always only one
        var selectedLabel = this.selected.children('.ui-selmenu-item');

        var index = 0;
        if (value.constructor == String) {
            index = this.valueMap[value];
        }
        else {
            index = value;
            value = this.options.items[index].value;
        }

        // index of previously selected item
        var prevIndex = this.valueMap[selectedLabel.data('value')];

        /*
        var selectedItem = this.menu.children()
                .eq(prevIndex)
                        .show()
                        .end()
                .eq(index)
                        .hide();
        */
        selectedItem = this.menu.children().eq(index);

        // Make item visibly selected and deselected any other
        // item
        selectedItem
            .find('a')
                .addClass('active')
                .end()
            .siblings()
                .find('a')
                .removeClass('active');
       
        this.selectedValue = value;
        this.selectedIndex = index;

        selectedLabel.data('value', value).text(selectedItem.text());
        if (propagate) {
            //console.info("trigger select item:" + selectedItem.text());
            this._trigger('change', null, this.ui(value, selectedItem.text())); // rdewit
            //this._trigger('click', null, this.ui(value, selectedItem.text())); // rdewit
        }
    },

    selectById: function(id, propagate) {
        //$.log('SelMenu selectById', arguments);
        this.select(id, propagate);
    },

    selectByIndex: function(index, propagate) {
        var value = this.options.items[index].value;
        //$.log('SelMenu selectByIndex', arguments, value);
        this.select(value, propagate);
    },

    selectByLabel: function(label, propagate) {
        //$.log('selectByLabel', arguments);
        var index = this.lookuptable[label];
        if(typeof index != 'undefined') {
            this.select(index, propagate);
        }
    },

    setItems: function(items) {
        var self = this,
            menu = this.menu,
            valueMap = {};

        this.lookuptable = {}; 
        $.each(items, function(index) {
            self.lookuptable[this.label] = this.value;

            // Item is of type <a>
            // this allows us to add a href to it and make it 
            // a real link
            var item = $('<a />').text(this.label)
                                 .addClass('ui-selmenu-item')
                                 .data('value', this.value);

            if (this.id) {
                item.attr('id', this.id);
            }

            if (this.href) {
                item.attr('href', this.href);
            }

            if (this.title) {
                item.attr('title', this.title);
            }

            if (this.target) {
                item.attr('target', this.target);
            }

            var li = $("<li />").append(item).appendTo(menu);

            valueMap[this.value] = index;
        });

        this.valueMap = valueMap;

        if (!this.initText) {
            this.select(0);
        }
    },

    toggleMenu: function() {
        this.menu.toggle();
        //this.menu.toggle('blind', null, 'fast');
    },

    ui: function(value, label) {
        this.selectedValue = value;
        return {
            options: this.options,
            // value of the currently selected/clicked item
            value: value,
            // label of the currently selected/clicked item
            label: label
        };
    },

    value: function() {
        return this.selectedValue;
    }


});


$.ui.selmenu.getter = ['data', 'getLabelByValue', 'getValueByLabel', 'index', 'label', 'value'];
$.ui.selmenu.defaults = {
    items: [],
    // {Boolean} Show dropdownmenu on click on the currently selected item
    isDropdown: true
};

})(jQuery);

