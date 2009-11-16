/*
 * jQuery SwitchBoard @VERSION
 *
 * jQuery SwitchBoard plugin is a framework that allows to bind jQuery widgets
 * and plugins. jQuery library allows to develop standalone modular plugins but
 * it doesn't provide an interface that allows plugins to connect and interact 
 * among each other. SwitchBoard is a light and fast framework that is aimed to
 * tackle this problem by separating model/view and controller logic.
 *
 * Depends:
 *	- jquery.js (1.3.2)
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

(function($){
$.switchboard = {
    //dictionary for actions
    actionSet: {},
      
    action: function(o) {
        var actionset = this._getActionSet(o.id);
        actionset.hooks.before = o.before;
        actionset.hooks.after = o.after;
    },

    //register new widgets for the action
    add: function(o) {
        var self = this;
        var actionset = self._getActionSet(o.action);
        if (o.widget) {
            o.widget.obj.each(function() {
                actionset.widgets.push(o.widget);
                if (o.widget.notify) {
                    var notify = o.widget.notify;
                    $(this).bind(notify.event,
                                {actionName: o.action, action: actionset, params: o.widget},
                                self._triggerAction);
                }
            });
        } else if (o.trigger) {
            actionset.triggers.push(o.trigger);
        }
        return this;
    },

    //finds registered widget data by id
    get: function(action, id) {
        var actionset = this._getActionSet(action);
        var data;
        if (actionset) {
            $.each(actionset.widgets, function() {
                if (this.id == id) data = this;
            });
        }
        return data;
    },
      
    //removes registered widget data by id:
    //If id is provided, remove all widgets with that
    //action and id.
    //If no id is provided, remove the whole actionSet
    //with that action
    remove: function(action, id) {
        var actionset = this._getActionSet(action);

        //console.info("remove", action, id, actionset, this.actionSet)

        var newWidgets = [];

        // Loop through all widgets. Any widget that
        // is marked for deletion will have its 'obj' 
        // unbound and that widget will not be included
        // in the newly created widget list (the easiest 
        // way to remove widgets from an array is creating 
        // a new array without those widgets)
        $.each(actionset.widgets, function() {
            if (!id || this.id == id) {
                //console.info('excluding widget', this);

                // only unbind if the object has this.notify.event, otherwise
                // all events get unbound for that object, which can
                // have undesired effects
                if (this.notify) { 
                    //console.info('unbinding', this.obj, this.notify.event);
                    this.obj.unbind(this.notify.event);
                }
            } else {
                newWidgets.push(this); 
            }

        });              

        // Assign new widgets array to actionset (if 'id'
        // was provided). If no 'id' provided: remove whole
        // action from actionSet
        if (id) {
            actionset.widgets = newWidgets;
        } else {
            //this.actionSet[action] = undefined;  
            delete this.actionSet[action]; // really delete it!
        }
    },

    chainActions: function(actions) {
        // loop through all actions. Every action
        // gets linked to the next one (except for
        // the last one of course ;-)).
        $.each(actions, function(index, action) {
            var nextIndex = index + 1;
            var lastIndex = actions.length - 1;

            if (index < lastIndex) {
                action.next = actions[nextIndex];
            }
        });

        // Now add the first action (and automatically
        // add the next one on the fly)
        $.switchboard._addSwitchBoardAction(actions[0]);

    },

    _addSwitchBoardAction: function(action) {
        console.info('add SwitchBoard action', action);
        /* EXAMPLE:
        action = {
            event:  'subFeatureMenuReady',
            obj:    '#subFeatureMenu',
            method: 'selmenu',
            data:   ['selectByLabel', 'Manning River']
            next:   //pointer to the next action
        }
        */
        // Create an actionName that is unique, so we can safely
        // remove the action later without the risk of removing
        // another action with the same name
        var actionName = 'customAction_' + action.event + '_' + action.obj + '_' + action.method;

        // Add before and after hooks to the action we're about to
        // add to SwitchBoard.
        // Before: initialise the next action, so it is ready before
        //         when the current action gets executed
        // After:  clean up after ourselves and self-destruct to
        //         prevent this action from happening again.
        $.switchboard.action({
            id: actionName,
            before:
            function(){
                if (action.next) {
                    console.log( action.event + ": before: add next action");

                    // Call ourselves with the next action
                    $.switchboard.addSwitchBoardAction(action.next)
                }
            },
            after:
            function(){
                console.log( action.event + ": after: self-destruct");

                // Remove ourselves
                $.switchboard.remove(actionName);
            }
        });

        // Add the listener to the event and create the action
        $.switchboard.add({
            action: actionName,
            widget: {
                obj: $(document),
                notify: {
                    event: action.event,
                    setModel: function() {
                        var data = action.data
                        console.info(action.event + ' is ready, setting the following model: ' + data);
                        return data;
                    }
                }
            }
        })
        // Add the code that will be executed
        .add({
            action: actionName,
            widget: {
                obj: $(action.obj),
                update: {
                    methodName: action.method,
                    methodParams: function(data) {
                        return data;
                    }
                }
            }
        });
        
        return actionName;
    },

    //private method
    // returns set of widgets params for some action name
    _getActionSet: function(name) {
        if (!this.actionSet[name]){
            this.actionSet[name] = {};
            this.actionSet[name].hooks = {};
            this.actionSet[name].triggers = [];
            this.actionSet[name].widgets = [];
        }
        return this.actionSet[name];
    },


    //private method
    //triggers on action. Updates the model and widgets for the current action
    _triggerAction: function(evt, triggerData) {
        //inner function for slicing arrays
        //TODO find a way to call this function externaly
        function _arguments_slice(obj, start, end) {
            var argumentsArray = Array.prototype.slice.call(obj);
            if (end)
                return argumentsArray.slice(start, end);
            else
                return argumentsArray.slice(start);
        }

        //If you pass in array into trigger() it unwraps into a list of arguments
        //but we need an orginal array
        //and if its a single value (for example JSON object) keep it as it is.
        if (arguments.length > 2) {
            triggerData = _arguments_slice(arguments, 1);
        }
        //updating model with values from the widget
        //that was triggered exteranly
        var notifier = evt.data.params.obj;
        var model;
        //lazy init for setup object
        if (evt.data.params.setup && !this.setup) {
            this.setup = evt.data.params.setup.call($(this));
        }
        if ($.isFunction(evt.data.params.notify.setModel)) {
            model = evt.data.params.notify.setModel.call($(this), triggerData, this.setup);
        }
        if ($.isFunction(evt.data.params.notify.filter)) {
            var filterFlag = evt.data.params.notify.filter.call($(this), model);
            if (!filterFlag) return false;
        }

        //looping through the widgets signup for the current action
        //to updated them
        //call before script
        if (evt.data.action.hooks.before)
            evt.data.action.hooks.before.apply(this);
           
        $.each(evt.data.action.widgets, function(i) {
            var filterFlag = true;
            var data = evt.data.action.widgets[i];
            //obj is a jquery object, for example $("foobar")
            //console.log("Updating widget: " + data.id);
            data.obj.each(function() {
                var obj = $(this);
                if (data.update && (notifier != obj)) {
                    //setterObject is and object to set values to. If getterObject
                    //exists get setterObject from it, oterwise get it from obj.
                    var update = data.update;
                    var setterObj = obj;
                    if (update.obj) {
                        setterObj = update.obj.call(obj);
                    }
                    if (data.filter) {
                        filterFlag = update.filter.call(setterObj);
                    }
                    if (update.methodName && filterFlag) {
                        params = [];
                        if (update.methodParams) {
                            params = update.methodParams.call(setterObj, model);
                        }
                        update.methodName__switchBoardActionName__ = evt.data.actionName;
                        setterObj[update.methodName].apply(setterObj, params);
                    }
                }
            });

        });

        //rise ref triggers
        $.each(evt.data.action.triggers, function(i) {
            var data;
            var trigger = evt.data.action.triggers[i];
            if (trigger.data && $.isFunction(trigger.data)) {
                data = trigger.data.call($(this), model);
            } 
            trigger.obj.trigger(trigger.event, data);
        });

        //call after script
        if ($.isFunction(evt.data.action.hooks. after))
            evt.data.action.hooks.after.apply(this);

    },

    // This one is from Jeff Walden (http://whereswalden.com/)
    // http://ejohn.org/blog/javascript-array-remove/#comment-296114
    // (2008-08-18)
    _arrayRemove: function(array, from, to){
        array.splice(from, !to || 1 + to - from + (!(to < 0 ^ from >= 0) &&
                                              (to < 0 || -1) * array.length));
        return array.length;
    }
}//switchboard
})(jQuery);
