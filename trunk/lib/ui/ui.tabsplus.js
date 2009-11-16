/*
 * jQuery UI ToolBox widget @VERSION
 *
 * Depends:
 *  - ui.jquery.js (1.7.2)
 *  - ui.jquery.tabs.js (1.7.2)
 *  - jquery.utils.js: isEmptyObject()
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
    $.widget("ui.tabsplus",  $.extend(true, {}, $.ui.tabs.prototype, {
        plugins: {},

        items: {},

        selectedTabIndex: -1,

        _init: function() {
            //$.log('tabsplus init');
            var self = this;

            // For some reason, options.disabled is a boolean
            // and ui.tabs.js expects it to be an array
            if (this.options.disabled === false) {
                this.options.disabled = [];
            }

            this.element.addClass("ui-tabsplus").addClass("ui-helper-clearfix");
            this.element.prepend($('<ul />'));


            // Set tab title based on event types
            this.element.bind('tabsadd', function(event, ui) {
                //$.log('tabsadd', event, ui); 
                self.setTabTitleByEvent(event, ui);

                // Store tab ui info. This helps us find the 
                // tab panel easily for example
                self.setTabUiByEvent(event, ui);
            });

            this.element.bind('tabsenable', function(event, ui) {
                //$.log('tabsenable', event, ui); 
                self.setTabTitleByEvent(event, ui);
            });
            this.element.bind('tabsdisable', function(event, ui) {
                //$.log('tabsdisable', event, ui);
                self.setTabTitleByEvent(event, ui);
            });

            //trigger event on tab change
            this.element.bind('tabsselect', function(event, ui) {
                var index = ui.index;
                
                // Work around a bug in UI Tabs, where the selected
                // tab index does not get set quickly enough
                self.selectedTabIndex = index;

                // Don't trigger event when the selected index
                // is the one of a disabled one. This is because
                // deselecting a tab also triggers a select event
                // which is something we don't want
                if (!self.isDisabled(index)) {
                    var feature = self.items[index];
                    //$.log('triggering myself: tabschanged', event, feature);
                    //ui.feature = feature;
                    self.element.trigger('tabschanged', feature);
                }
                return true;
            });

            // initialise the tabs _init
            $.ui.tabs.prototype._init.apply(this); 
            //this.element.tabs();

        },

        /**
         * Method: addTab
         * Adds a tab to the panel
         */
        addTab: function(tab) {
            //$.log('addTab', arguments);

            // If tab is a string, then turn it into an object
            if (typeof tab == "string") {
                //$.log('addTab', 'type is string:', tab);
                var url = '#' + tab.replace(/\W/g, '_');
                tab = {
                    label: tab,
                    url : url
                };
            }

            var label = tab.label;
            var url = tab.identifier ||'#' + label.replace(/\W/g, '_');
            var index = tab.index; 

            //$.log('addTab', url, label, index, this.element);
            $(this.element).tabs('add', url , label, index);
            
            return;
        },

        /**
         * Method: addTabs
         * Adds an array of tabs to the tab list
         */
        addTabs: function(tabs) {
            //$.log('addTabs', typeof tabs, tabs.length);
            var self = this;

            $.each(tabs, function(key, value) {
                // Add item to item tabs
                self.addTab(value);
            });

            //this._trigger('ready', null, this.element);
        },

        /**
         * Method: deselectAllTabs
         * Deselects all tabs
         */
        deselectAllTabs: function() {
            //$.log('deselectAllTabs', this);

            // Deselect all tabs
            // Tabs need to be made collapsible to allow no tabs to be selected
            var collapsible = this.option('collapsible') || false;
            this.element.tabs('option', 'collapsible', true);
            this.selectTabByIndex(-1);
            this.element.tabs('option', 'collapsible', collapsible);
        },

        /**
         * Method: disableAllTabs
         * Disables all tabs.
         */
        disableAllTabs: function() {
            //$.log('disableAllTabs', this);
            var self = this;

            // Deselect all tabs first
            this.deselectAllTabs();

            $.each(this.items, function(index) {
                self.element.tabs('disable' , index);
            });
        },
        
        /**
         * Method: disableTabs
         * Will disable tabs by a list of tab indexes
         */
        disableTabs: function(tabIndexes) {
            if (!(tabIndexes instanceof Array)) {
                $.warn('Tab index list is not an array', tabIndexes);
                return;
            }
            var self = this;
            var activeTabIndex = this.getActiveTabIndex();

            $.each(tabIndexes, function(key, value) {
                // Deselect current active tab before
                // disabling it
                if (value == activeTabIndex) {
                    self.selectTabByIndex(-1);
                }
                self.element.tabs('disable' , value);
            });
        },


        /**
         * Method: enableAllTabs
         * Enables all tabs
         */
        enableAllTabs: function() {
            var self = this;

            $.each(this.items, function(index) {
                self.element.tabs('enable' , index);
            });
        },

        /**
         * Method: enableTabs
         * Will enable tabs by a list of tab indexes
         */
        enableTabs: function(tabIndexes) {
            //$.log('enableTabs', tabIndexes);
            if (!(tabIndexes instanceof Array)) {
                $.warn('Tab list is not an array', tabIndexes);
                return;
            }
            var self = this;
            $.each(tabIndexes, function(key, value) {
                self.element.tabs('enable' , value);
            });
        },

        /**
         * Method: getActiveTab
         * Returns the active tab object
         *  
         */
        getActiveTab: function() {
            var id = this.getActiveTabIndex();
            var tab = this.getTabByIndex(id);
            return tab; 
        },

        /**
         * Method: 
         *  
         */
        getActiveTabData: function() {
            //get active tab index
            var tab = this.getActiveTab();
            var tabData = this.getTabData(tab);
            return tabData; 
        },

        /**
         * Method: getActiveTabIndex
         * Returns the index of the active tab
         * Will return -1 if no tab is selected
         */
        getActiveTabIndex: function() {
            // Work around a bug in UI Tabs, where the selected
            // tab index does not get set quickly enough
            var index = this.selectedTabIndex;
            //var index = this.element.tabs('option', 'selected');
            return index; 
        },

        /**
         * Method: getActiveTabLabel
         * Returns the label for the active tab
         *  
         */
        getActiveTabLabel: function() {
            var tab = this.getActiveTab();
            var tabLabel;
            if (tab) {
                tabLabel = this.getTabLabel(tab);
            }
            return tabLabel; 
        },

        /**
         * Method: 
         *  
         */
        getElement: function() {
            return this.element;
        },

        /**
         * Method: getFirstEnabledTabIndex
         * Returns the index of the first tab that is not disabled
         * Will return -1 if there are no enabled tabs
         *  
         */
        getFirstEnabledTabIndex: function() {
            var numTabs = this.element.tabs('length');
            for (var index = 0; index < numTabs -1; index++){
                if(!this.isDisabled(index)) {
                    return index;
                }
            }
            return -1;
        },

        /**
         * Method: 
         *  
         */
        getTabByIndex: function(id) {
            var tab = this.items[id];
            return tab; 
        },

        /**
         * Method: 
         *  
         */
        getTabByLabel: function(label) {
            var index = this.getTabIndexByLabel;
            var tab = this.getTabByIndex(index);
            return tab; 
        },

        /**
         * Method: 
         *  
         */
        getTabData: function(tab) {
            return tab.data;
        },

        /**
         * Method: 
         *  
         */
        getTabData: function(tab) {
            return tab.data;
        },

        /**
         * Method: 
         *  
         */
        getTabIndexByLabel: function(label) {
            var self = this;
            var index = null;
            if (!this.items) {
                return null;
            }
            $.each(this.items, function(key, tab) {
                var tabLabel = self.getTabLabel(tab);
                if (label == tabLabel) {
                    index = key;
                    return false; // exit each
                }
            });
            return index; 
        },

        /**
         * Method: 
         *  
         */
        getTabLabel: function(tab) {
            return tab.label;
        },

        /**
         * Method: 
         *  
         */
        getTabs: function() {
            return this.items;
        },

        /**
         * Method: 
         *  
         */
        isDisabled: function(index) {
            var disabledList = this.element.tabs('option', 'disabled');
            return disabledList.indexOf(index) > -1;
        },

        /**
         * Method:  
         *  
         */
        selectTabByIndex: function(index, force) {
            //$.log("selecting tab by id: ", index);
            if (isNaN(index) || index == null) {
                $.warn('index is not a number', index);
                return;
            }
            //this.element.tabs('option', 'selected' , index);
            this.element.tabs('select' , index);

            // Force a tabschanged event when the same tab
            // gets reselected
            if (force && (index == this.selectedTabIndex)) {
                //$.log(index == this.selectedTabIndex, this.element);
                this.element.trigger('tabsselect', {index: index});
                //this.element._trigger('tabsselect', null, feature);
            }
        },

        /**
         * Method:  
         *  
         */
        selectTabByLabel: function(label) {
            //$.log("Trying to select tab by label: ", label);
            var index = this.getTabIndexByLabel(label);
            this.selectTabByIndex(index);
        },

        /**
         * Method:  
         *  
         */
        setTabUiByEvent: function(event, ui) {
            //$.log('setTabUiByEvent', arguments);
            var index = ui.index;
            var tab = this.items[index];

            if (!tab) {
                $.warn('Tab not found at index:', index);
                return;
            }

            // Store ui info in tab info
            tab.ui = ui;
                
        },

        // (re)creates tabs
        /**
         * Method:  
         *  
         */
        setTabs: function(tabs) {
            //$.log('setTabs', typeof tabs, tabs);

            this.items = tabs;

            // recreate tabs
            this.element.tabs(); //.tabs('destroy').tabs();

            this.addTabs(tabs);
        },

        /**
         * Method:  
         *  
         */
        setTabTitleByEvent: function(event, ui) {
            //$.log('setTabTitleByEvent', arguments);
            var index = ui.index;
            var tab = this.items[index];
            if (!tab) {
                $.warn('Tab not found at index:', index);
                return;
            }

            var title = tab.title;
            if (typeof title == "object") {
                type = event.type;
                switch (event.type) {
                    case 'tabsadd':
                    case 'tabsenable':
                        title = title.enabled;
                        break;
                    case 'tabsdisable':
                        title = title.disabled || title.enabled;
                        break; 
                }
            }
            if (typeof title != 'undefined') {
                this.setTabTitleByIndex(index, title);
            }
        },

        /**
         * Method:  
         *  
         */
        setTabTitleByIndex: function(index, title) {
            //$.log('setTabTitleByIndex', arguments);
            var tab = this.items[index];
            var tabDiv = this.element.find('li a:eq(' + index + ')')[0];
            if (tabDiv) {
                $(tabDiv).attr('title', title);
            }
        },
        
        /**
         * Method:  
         *  
         */
        destroy: function() {
            this.element.unbind();
            this.element.tabs('destroy');
            
            this.element.removeClass('ui-tabsplus').empty();
            $.ui.tabs.prototype.destroy.apply(this); 
        },

        /**
         * Method:  
         *  
         */
        enable: function() {
            this.element.removeClass('ui-tabsplus-disabled');
            this.disabled = false;
        },

        /**
         * Method:  
         *  
         */
        disable: function() {
            this.element.addClass('ui-tabsplus-disabled');
            this.disabled = true;
        },

        /**
         * Method:  
         *  
         */
        hide: function() {
            this.element.css('visibility', 'hidden');
        },

        /**
         * Method:  
         *  
         */
        show: function() {
            this.element.css('visibility', '');
        }
    }));

    $.ui.tabsplus.getter = ['getActiveTab', 'getActiveTabData', 'getActiveTabIndex', 'getActiveTabLabel', 
                            'getElement', 'getFirstEnabledTabIndex', 'getTabByIndex', 'getTabByLabel', 
                            'getTabData', 'getTabIndexByLabel', 
                            'getTabLabel','getTabs', 'isDisabled'];


})(jQuery);
