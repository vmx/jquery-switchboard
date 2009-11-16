This is an output format extension written for the GeoServer web application.  
It creates two new wfs output formats as described at the bottom of this document.

1. LICENSE

As an extension built upon the GeoServer project, the source code contained within licensed under the GNU General Public License, the full text of which can be found in GPL.txt

2. BUILD

Building this extension from source requires a Java Developer Kit (1.5 or 1.6) and Maven 2.  From the geoserver-output-format directory, run:

    mvn clean install

This will download all required libraries, compile the code, run tests and generate a jar file.  This jar is written to \target\mer-json-output-1.0.jar

3. INSTALL

To install the extension into a GeoServer application, simply copy the jar file created in the BUILD step into the WEB-INF\lib directory of the GeoServer web application.

4. Output Formats

4.1 hier-json

The HierachicalJSONOutputFormat will group all features into a hierarchical structure based on the ordered list of attributes. These attributes are listed in the format_options parameter in the GET request, in the form: format_options=grouping:attribute1+attribute2+attribute3. Note that the option name is grouping and the value is a + (or url encoded space) separated list of attribute names. This grouping is accomplished by storing feature attributes into nested Maps using the grouping attributes, in order, as the keys to each level of map. The final map is simply a mapping of attribute names and values. There is no limit to the number of attributes that can be grouped on. It is assumed that the combination of grouping attributes will uniquely identify each feature. If this is not the case, then the final map containing remaining attribute values will be overwritten by each consecutive match for the grouping attributes, resulting in only one feature for those values being returned.

{
  "value1a" : {
    "value2a" : {
      "value3a" : {
        "name4" : "value4a",
        "name5" : "value5a"
      },
      "value3b" : {
        "name4" : "value4b",
        "name5" : "value5b"
      }
    },
    "value2b" : {
      "value3d" : {
        "name4" : "value4c",
        "name5" : "value5c"
      }
    }
  }
}


4.2 agg-json

The AggregatingJSONOutputFormat will produce a flat JSON output where the listed attributes are aggregated into arrays. This will handle cases where a few attributes contain multiple values for a given feature and should not cause the feature to be repeated. The aggregated attributes are listed in the format_options parameter in the GET request, in the form: format_options=aggregates:attribute3+attribute4. Note that the option name is aggregates and the value is a + (or url encoded space) separated list of attribute names. This is accomplished by storing all features in separate Maps, with each map stored in a uber-map using a concatenation of non-aggregate attribute values as the key. Aggregate attributes are stored in a List in all instances (ie. the list is created on the first match) and subsequent matches to the non-aggregate attributes are appended. The parent map is then converted to a list which is output as JSON. Note that there is no collapsing of duplicate aggregate attribute values, so if two aggregates are stated they will have the same number of values within a feature, and some may be duplicate. 

{
  "type" : "FeatureCollection",
  "features" : [
    {
      "name1" : "value1a",
      "name2" : "value2a",
      "name3" : ["value3ai", "value3aii", "value4aiii"],
      "name4" : ["value4ai", "value4aii", "value4aiii"],
      "name5" : "value5a"
    },
    {
      "name1" : "value1b",
      "name2" : "value2b",
      "name3" : ["value3ai"],
      "name4" : ["value4ai"],
      "name5" : "value5a"
    }
  }
}

