/*
 * jQuery UI OpenLayers widget @VERSION
 *
 * Depends:
 *  - ui.core.js (1.3.2)
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
var map;
(function($) {
  // Code from http://n2.nabble.com/WMS---Problem-with-projection-param-in-WMS-request-td1827837.html
  // Makes OpenLayers use the declared projection in WMS requests to other layers, even when it is not supported by the base map.
    $.widget("ui.openlayers", {
        plugins: {},

        _init: function(options) {
            //$.log('ui.openlayers init', this);
            var self = this;

            // allow options to be passed into the init function
            // not sure if this would work
            var o = OpenLayers.Util.extend(options || {}, this.config);
   
            //list to maintain selected features
            this.selectedFeatureList = [];

            this.element.addClass("ui-openlayers");
            this.element.data("name", o.name);
            var mapOptions = {};

            // Set maxExtent for map
            if (o.extent && o.extent.max) {
                //$.log('Setting max extent from config', o.extent.max);
                var maxExtent = this.getBoundsFromString(o.extent.max, o.options.displayProjection, o.options.projection);
                mapOptions.maxExtent = maxExtent;
                var worldExtent = this.getBoundsFromString(o.extent.worldExtent, o.options.displayProjection, o.options.projection);
                mapOptions.worldExtent = worldExtent;
                if (o.extent.initial) {
                    var initialExtent = this.getBoundsFromString(o.extent.initial,
                                    o.options.displayProjection, o.options.projection);
                    mapOptions.restrictedExtent = initialExtent;
                }


                //
                //$.log('New max extent:', maxExtent);
                //$.log('New initial extent:', initialExtent);

                
            }

            // Merge options with options from config
            mapOptions = OpenLayers.Util.extend(mapOptions, o.options);

            //$.log('mapOptions', mapOptions);
            this.olmap = new OpenLayers.Map(this.element[0], mapOptions);
            map = this.olmap;
            //$.log('olMap:', this.olmap);
            //create styles
            var styles = {};
            //$.log('styles', o.styles);
            $.each(o.styles, function(name, config) {
                //$.log('style', this, name, config, config.template);
                styles[name] = new OpenLayers.Style(config.template, config.options);
                //$.log("Style", config.template, config.options, styles[name]);
            });
            //$.log("Styles", styles);

            //create layers
            var layers = [];
            var selectableLayers = [];
            $.each(o.layers, function() {
                //ading layer styles
                if (this.stylemap) {
                    var intentList = {};
                    $.each(this.stylemap, function(intent, style) {
                        intentList[intent] = styles[style];
                    });
                    var styleMap = new OpenLayers.StyleMap(intentList);
                    //$.log("StyleMap", styleMap);
                    this.options["styleMap"] = styleMap;
                }

                var layer;
                //self.log ('type', self, self.namespace + '.' + self.widgetName,  this.type);
                switch (this.type) {
                    case OpenLayers.Layer.WFS:
                    case OpenLayers.Layer.WMS:
                        // Raster layer (WMS, etc)
                        layer = new this.type( this.name,
                                               this.url,
                                               this.params,
                                               this.options);
                        break;
                    case OpenLayers.Layer.Vector:
                        layer = new this.type( this.name,
                                               this.options);
                        break;
                    case OpenLayers.Layer.Google:
                        // Google type layers: skip if google api is not loaded
                        if (typeof G_API_VERSION != "undefined") {
                            layer = new this.type( this.name,
                                               this.options);
                        } 
                        break;
                    default:
                        layer = new this.type( this.name,
                                               this.options);
                }

                // Continue if layer did not get created
                if (!layer) {
                    //$.log('Layer not created for: ', this.name);
                    return;
                }

                // register layer events if defined in the config
                for (var e in this.events) {
                   layer.events.register(e, layer, this.events[e]);
                }
                  
                // adding controls that belong to a layer
                $.each(this.controls || {}, function(name, data) {
                    var control = new OpenLayers.Control[name](layer, data.options);
                    self.olmap.addControl(control);
                    control.activate();
                });
          
                // Add layer to list of selectable layers
                if (this.selectable) {
                    layer.events.register("featureselected", self, function(e) {self.onFeatureSelect.apply(self, [e.feature])});
                    layer.events.register("featureunselected", self, function(e) {self.onFeatureUnselect.apply(self, [e.feature])});
                    selectableLayers.push(layer);
                }

                // Add layer to the stack
                layers.push(layer);
            });

            // Actually add the layers to the map
            this.olmap.addLayers(layers);

            //load map controls
            //$.log(o.controls);
            $.each(o.controls || {}, function(name, options) {
                var control = new OpenLayers.Control[name](options);
                self.olmap.addControl(control);
            });

            // highlightControl (needs to be defined before selectFeatureControl!)
            var highlightFeatureControl = new OpenLayers.Control.SelectFeature(selectableLayers,{
                    hover: true, 
                    highlightOnly: true // feature will not be selected, only highlighted
                });
            self.olmap.addControl(highlightFeatureControl);
            highlightFeatureControl.activate();   

            // selectFeatureControl
            var selectFeatureControl = new OpenLayers.Control.SelectFeature(selectableLayers);
            self.olmap.addControl(selectFeatureControl);
            selectFeatureControl.activate();   

            // Attach selectFeatureControl to layer
            $.each(selectableLayers, 
                function() {
                    this.selectFeatureControl = selectFeatureControl;
                });

            //$.log('map controls', selectFeatureControl); 


            //set extent
            if (o.extent && o.extent.initial) {
                var bounds = this.getBoundsFromString(o.extent.initial);
                this.olmap.zoomToExtent(bounds);   
                //$.log(bounds, this.olmap.getExtent());
            } else {
                this.olmap.zoomToMaxExtent();
            }

            if (o.zoom && o.zoom.initial && this.olmap.getZoom() != o.zoom.initial) {
                this.olmap.zoomTo(o.zoom.initial);   
            }

        },

        getBoundsFromString: function(str, from, to) {
            //$.log('getBoundsFromString', arguments);
            var bounds = new OpenLayers.Bounds.fromString(str);
            // Reproject Bounds if map projection is different than display projection
            to   = to || this.map().getProjectionObject();
            from = from || this.map().displayProjection || to;
            if (from && to && (from != to)) {
                bounds = bounds.transform(from, to)
            }
            //$.log('getBoundsFromString', bounds,(this.olmap ? this.olmap.getProjectionObject(): 'no olmap yet'), from, to );
            return bounds;
        },

        panToExtent: function(extent) {
            var self = this;
            if (this.currentExtent != extent) {
                this.currentExtent = extent;
                //$.log('panToExtent', this, this.map(), extent);
                if (typeof extent == "string") {
                    extent = this.getBoundsFromString(extent);
                }
                var center = extent.getCenterLonLat();
                var currentZoom  = this.olmap.getZoom();
                var newZoom  = this.olmap.getZoomForExtent(extent);
                //$.log('PANNING!', center, currentZoom, newZoom);

                /// The code below does not work yet....
                // use zoomToExtent!
                /*
                var zoomToF = function(options) {
                    $.log('done', this, options, newZoom);
                    self.olmap.events.unregister("moveend", options, zoomToF);
                    //self.olmap.zoomTo(newZoom);
                };
                this.olmap.events.register('moveend', this, zoomToF);
                */
                if (newZoom != currentZoom) {
                    this.olmap.zoomTo(newZoom);
                }
                this.olmap.panTo(center);
                //map.zoomToExtent(extent);
            } else {
                //$.log('old extent, skip paning');
            }
        },
        
        zoomToExtent: function(extent) {
            //$.log('zoomToExtent', extent);
            if (typeof extent == "string") {
                extent = this.getBoundsFromString(extent);
            }
            map.zoomToExtent(extent);
        },
        
        //TODO
        destroy: function() {
            this.element.unbind();
            this.element.removeClass('ui-openlayers').empty();
        },
        // TODO
        enable: function() {
            this.element.removeClass('ui-openlayers-disabled');
            this.disabled = false;
        },
        // TODO
        disable: function() {
            this.element.addClass('ui-openlayers-disabled');
            this.disabled = true;
        },

        //Searches for a feature and returns one
        //
        //options.layer - layer name
        //options.path - attribute path
        //options.value - value of the attribute
        features: function(options) {
            var featureList = [];
            var layer = this.olmap.getLayersByName(options.layer)[0]; //TODO (adjioev) loop through all layers?
            //$.log(this.olmap);
            if (layer) {
                $.each(layer.features, function() {
                    if (this.attributes[options.attr] == options.value) {
                        featureList.push(this);
                    }
                });
                return featureList;
            }
            return false;
        },

        getFeaturesByAttribute: function(key, value, layer) {
            if (!this.olmap) {
                //$.log('getFeaturesByAttribute: map not initialised (yet).');
                return false;
            }
            //$.log("getFeaturesByAttribute", key, value);
            var features = [];

            // layer is provided and is object. Use that one
            if (layer && typeof(layer) == "object") {
                layers = [layer];
            } 
            // layer is provided and is string, find the layer object
            else if (layer && typeof(layer) == "string") {
                layers = [this.olmap.getLayersByName(layer)[0]];
            // otherwise, search through all layers as a last resort
            }
            else {
                layers = this.olmap.layers;
            }

            //$.log("layers", layers);

            // loop through list of layers
            $.each(layers, function() {
                // If layer is a vector layer (has features, loop through them)
                if (this.features) {
                    var l = this;
                    //$.log("layer", l);
                    // looping is done here
                    $.each(l.features, function() {
                        //$.log("feature", this.attributes[key], value);
                        if (this.attributes[key] == value) {
                            features.push(this);
                        }
                    });
                }
            });
            return features;
        },

        onFeatureOver: function(feature) {
            //$.log("Feature Over", feature);
            //document.body.style.cursor = "pointer";
            //feature.layer.drawFeature(feature, "select");
        },

        onFeatureOut: function(feature) {
            //$.log("Feature Out", feature);
            //document.body.style.cursor = "default";
            //feature.layer.drawFeature(feature, "default");
        },

        onFeatureSelect: function(feature) {
            //$.log("Feature Selected", feature);
            this.addPopup(feature); // removes any existing popups
            this.element.trigger("selected", feature);
        },

        onFeatureUnselect: function(feature) {
            //$.log("Feature Unselected", feature);
            this.removePopups();// hack to remove popup (won't go away on close button)
        },

        addPopup: function(feature) {
            //this.removePopups(); // removes any existing popups
            //$.log("adding popup, feature:", feature);
            var template = feature.layer.options.popup.template;
            var content = $.simpleTemplate(template, feature.attributes);
            //$.log("content", feature.layer.options, content, feature.attributes);

            var popup = new OpenLayers.Popup.FramedCloud("Popup", 
                            feature.geometry.getBounds().getCenterLonLat(),
                            null, // content size
                            content,
                            null, // anchor
                            true, // close box 
                            function() { // close box callback
                                if (feature.layer) {
                                    feature.layer.selectFeatureControl.unselect(feature);
                                }
                            }
                        ); 
            popup.autoSize = true;
            //popup.updateSize();
            feature.popup = popup;

            // Open popup and tell map to close any other
            // popups that are possibly opened
            var exclusive = true;
            this.olmap.addPopup(popup, exclusive);


        },

        /* removePopups:
         * If no arguments provided, this will remove all
         * existing popups. Otherwise it will only remove
         * the popup passed into the function.
         */
        removePopups: function(popup) {
            //$.log('Removing popup', popup);
            if (!this.olmap) {
                $.warn('removePopups: map not initialised yet!');
                return;
            }

            var popupList = [];
            if (popup != null) {
                popupList.push(popup);
            } else {
                for (var p in this.olmap.popups) {
                    popupList.push(this.olmap.popups[p]);
                }
            }

            for (var p in popupList) {
                var popup = popupList[p];
                //this.olmap.removePopup(popup);
                if (popup && typeof(popup.destroy == "function")) {
                    popup.destroy();
                    popup = null;
                }
            }
        },

        setLayerVisibility: function(layerName, visibility) {
            //$.log('setLayerVisibility', layerName, visibility);
            if (!this.olmap) {
                //$.log('setLayerVisbility: map not initialised (yet).');
                return false;
            }

            var layer = this.map().getLayersByName(layerName)[0]; 
            if (layer) {
                layer.setVisibility(visibility);
            }
            
        },

        setPopupContent: function(popup, content){
            //$.log("setPopupContent", popup, content);
            popup.setContentHTML(content);
        },

        //pan map to the given LonLat string
        pan: function(lonlat) {
            var coords = OpenLayers.LonLat.fromString(lonlat);
            this.olmap.panTo(coords);
        },

        //returns map object
        map: function() {
            return this.olmap;     
        },

        setLayer: function() {
            //$.log("setting a layer");
        }

  });

    $.ui.openlayers.getter = "map, features";
    $.ui.openlayers.defaults = {
        controls: ["LayerSwitcher", "ScaleLine", "NavigationHistory"]
    };


})(jQuery);
