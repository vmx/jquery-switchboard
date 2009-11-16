(function($){

    /* -------------------- Util methods --------------------------------------- */
    //allows jquery selector to select path with a give data
    //taken from http://james.padolsey.com/javascript/a-better-data-selector-for-jquery/
    var _dataFn = $.fn.data;
    $.fn.data = function(key, val){
        if (typeof val !== 'undefined'){
            $.expr.attrHandle[key] = function(elem){
                return $(elem).attr(key) || $(elem).data(key);
            };
        }
        return _dataFn.apply(this, arguments);
    };

    //returns all data associated with a given element
    //taken from http://stackoverflow.com/questions/772608/jquery-loop-through-data-object
    jQuery.fn.allData = function() {
        var got0 = this.get(0);
        var allData = null;
        if (got0) {
            var intID = jQuery.data(this.get(0));
            allData = jQuery.cache[intID];
        }
        return allData;
    };

    // add class on hover, remove it afterwards
    $.fn.hoverClass = function(cssClass) {
        return this.each(function() {
            $(this).hover(function() {
                $(this).addClass(cssClass);
            }, function() {
                $(this).removeClass(cssClass);
            });
        });
    };

    $.utils = {
        /* returns all props for a given object */
        getProperties: function(obj) {
            var i, v;
            var count = 0;
            var props = [];
            if (typeof(obj) === 'object') {
                for (i in obj) {
                    v = obj[i];
                    if (v !== undefined && typeof(v) !== 'function') {
                        props[count] = i;
                        count++;
                    }
                }
            }
            return props;
        },

        /* Helper function to determine whether an object is empty or not
         */
        isEmptyObject: function (obj) {
            for(var i in obj) {
                return false;
            }
            return true;
        },


        /* Returns the first key that is found in obj */
        firstKey: function(obj) {
            if (this.isEmptyObject(obj)) {
                return null;
            }

            var key;
            $.each(obj, function(objKey, objPprop) {
                key = objKey;
                return false;
            })
            return key;
        },

        /* Returns the first property that is found in obj */
        firstProperty: function(obj) {
            if (this.isEmptyObject(obj)) {
                return null;
            }

            var property;
            $.each(obj, function() {
                property = this;
                return false;
            })
            return property;
        },
        
        // This one is from Jeff Walden (http://whereswalden.com/)
        // http://ejohn.org/blog/javascript-array-remove/#comment-296114 (2008-08-18)
        arrayRemove: function(array, from, to){
            array.splice(from,
                !to ||
                1 + to - from + (!(to < 0 ^ from >= 0) && (to < 0 || -1) * array.length));
            return array.length;
        }
    }
})(jQuery);
