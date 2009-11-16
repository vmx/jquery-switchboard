/* Copyright (c) 2009 Government of the State of New South Wales 
 *                    Through the Department of Environment and Climate Change
 * All rights reserved.
 * This code is licensed under the GPL 2.0 license, available at the root
 * application directory.
 */
package com.lisasoft.mer;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.logging.Logger;

import net.opengis.wfs.FeatureCollectionType;
import net.opengis.wfs.GetFeatureType;
import net.sf.json.JSON;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.geoserver.platform.Operation;
import org.geoserver.platform.ServiceException;
import org.geoserver.wfs.WFSGetFeatureOutputFormat;
import org.geotools.feature.FeatureCollection;
import org.geotools.feature.FeatureIterator;
import org.opengis.feature.simple.SimpleFeature;
import org.opengis.feature.simple.SimpleFeatureType;
import org.opengis.feature.type.AttributeDescriptor;

/**
 * @author mleslie
 *
 */
public class HierarchicalJSONOutputFormat extends AbstractJSONOutputFormat {
    private Logger LOGGER = org.geotools.util.logging.Logging.getLogger(this.getClass().toString());
    
    public HierarchicalJSONOutputFormat() {
        super("hier-json");
    }

    @Override
    /**
     * This will output the features in the collection in an appropriate
     * format.  If a list of attribute names is provided in the
     * format options under an GROUPING parameter, and all of these attributes
     * exist in the feature type, then these will be used to group attributes 
     * into a hierarchical structure.  The order of the GROUPING list 
     * determines the order of the attribute hierarchy as shown below.  
     * Otherwise the writeUnprocessed method of AbstractJSONOutputFormat is 
     * called to handle the features.
     * 
     * example:
     * 
     * Feature attributes:
     *   feature_name
     *   size_of_fish
     *   type_of_fish
     *   fish_id
     * 
     * GROUPING parameter:
     *   grouping:feature_name+fish_id
     * 
     * Output:
     *   {
     *     "Avola Lake": {
     *       "fish-212": {
     *         "type_of_fish": "trout",
     *         "size_of_fish": "fat"
     *       },
     *       "fish-029": {
     *         "type_of_fish": "salmon",
     *         "size_of_fish": "16lb"
     *       }
     *     },
     *     "South Creek River": {
     *       "fish-747": {
     *         "type_of_fish": "tasty",
     *         "size_of_fish": "illegal"
     *       }
     *     }
     *   }
     */
    protected void write(FeatureCollectionType featureCollection,
            OutputStream output, Operation getFeature) throws IOException,
            ServiceException {
    	// Create the writer used for streaming output
    	// Retrieve the FeatureCollection containing our data
    	FeatureCollection fc = 
    			(FeatureCollection)featureCollection.getFeature().get(0);
    	
    	SimpleFeatureType ft = (SimpleFeatureType)fc.getSchema();
    	GetFeatureType gft = (GetFeatureType) getFeature.getParameters()[0];
    	Map formatOptions = gft.getFormatOptions();
    	LOGGER.warning("Format Options: " + formatOptions.toString());
    	String[] groupingNames = {};
    	if(formatOptions != null && 
    			formatOptions.get("GROUPING") != null) {
    		String groupingList = formatOptions.get("GROUPING").toString();
    		LOGGER.warning("Grouping by := (" + groupingList + ")");
    		groupingNames = groupingList.split(" ");
    	} else {
    		LOGGER.warning("Not grouping.");
    	}
    	int gIndicies[] = findAttributeIndicies(ft, groupingNames);
    	
    	String[] sortNames = {};
    	int sortIndex = -1;
    	if(formatOptions != null &&
    			formatOptions.get("SORT") != null) {
    		String sortList = formatOptions.get("SORT").toString();
    		LOGGER.warning("Sort by := (" + sortList + ")");
    		sortNames = sortList.split(" ");
    		int sIndicies[] = findAttributeIndicies(ft, sortNames);
    		if(sIndicies != null && sIndicies.length > 0)
    			sortIndex = sIndicies[0];
    	} else {
    		LOGGER.warning("No sorting requested.");
    	}
   	
    	if(verifyIndicies(gIndicies))
    		writeGrouped(fc, gIndicies, output, sortIndex);
    	else
    		writeUnprocessed(fc, output);
    }
    
    /**
     * This will handle any features with the required attributes (feature_id, 
     * condition_pressure and indicator_id.  Others are handled 
     * by writeUnprocessed
     * @param fc FeatureCollection passed in by GeoServer
     * @param featureIdIndex index of the feature id attribute
     * @param condPressIndex index of the condition vs pressure attribute
     * @param indIdIndex index of the indicator id attribute
     * @param output OutputStream to write response to
     * @throws IOException
     */
    private void writeGrouped(FeatureCollection fc, int[] gIndicies, 
    		OutputStream output, int sortIndex) throws IOException {
    	BufferedWriter w = new BufferedWriter(new OutputStreamWriter(output));
    	FeatureIterator i = fc.features();
    	SimpleFeatureType ft = (SimpleFeatureType)fc.getSchema();
    	List<String> gNames = new ArrayList<String>();

    	int gCount = gIndicies.length;
    	for(int a = 0; a < gCount; a++) {
    		gNames.add(ft.getDescriptor(gIndicies[a]).getLocalName());
    	}
    	
    	/*
    	 * We're setting up the oblique comparable structures here.  The 
    	 * comparator itself will be passed into the hierarchical structure
    	 * code to be used in the inner-most Map.  The Map containing 
    	 * sort information is held by the comparator, and is populated 
    	 * in the outer feature loop.  It's synchronized for no good reason,
    	 * I'm just covering my ass in case I didn't think of something.
    	 */
    	Map<String, String> comparableMap = null;
    	CounterintuitiveComparator<String> comparator = null;
    	if(sortIndex != -1) {
    		comparableMap = Collections.synchronizedMap(new HashMap<String, String>());
    		comparator = new CounterintuitiveComparator<String>(comparableMap);
    	}
    	
    	Map<String,Object> features = null;
    	if(gCount == 1) {
    		/*
    		 * This is hear for the unfortunate case where we need to sort at 
    		 * the first set of keys.
    		 */
    		features = new TreeMap<String,Object>(comparator);
    	} else {
    		features = new HashMap<String,Object>();
    	}
    	
    	try {
    		while(i.hasNext()) {
    			SimpleFeature f = (SimpleFeature)i.next();
    			List<String> gAttributes = new ArrayList<String>();
    			for(int a = 0; a < gCount; a++) {
    				Object b = f.getAttribute(gIndicies[a]);
    				gAttributes.add((b != null) ? b.toString() : "");
    			}
    			
    			// Find the sort attribute and sort-level attribute
    			String key = gAttributes.get(gCount-1);
    			if(comparableMap != null) {
    				Object v = f.getAttribute(sortIndex);
    				String value = (v != null) ? v.toString() : "";
    				comparableMap.put(key, value);
    			}
    			
    			handleGroup(f, gAttributes, gNames, 0, features, comparator);
    		}

    		JSON json = JSONSerializer.toJSON(features);
    		w.write(json.toString(2));
    		w.write("\n");
    	} finally {
    		fc.close(i);
    	}
    	w.flush();
    }
    	
    /**
     * Recursively deals with the nested grouping attributes.  This extracts the
     * appropriate mapping for the indicated level and passes it recursively
     * to the next level, or populates the attributes if we have completed
     * the groupings
     * 
     * @param f current feature
     * @param gAttributes ordered listing of all attribute names 
     * @param gNames unordered listing of grouping attribute names
     * @param index current level within the grouping hierarchy
     * @param parent
     */
    private void handleGroup(SimpleFeature f, 
    		List<String> gAttributes, List<String> gNames, int index, 
    		Map<String, Object> parent, Comparator<String> comparator) {
    	if(index < gAttributes.size()) {
    		Object obj = parent.get(gAttributes.get(index));
    		Map<String, Object> value = null;
    		if(obj == null || !(obj instanceof Map)) {
    			if(index == gAttributes.size()-2 && comparator != null) {
    				// This is the second-innermost Map and must be sorted.
    				value = new TreeMap<String, Object>(comparator);
    			} else {
    				value = new HashMap<String, Object>();
    			}
    			parent.put(gAttributes.get(index), value);
    		} else {
    			value = (Map<String, Object>)obj;
    		}
    		handleGroup(f, gAttributes, gNames, index+1, value, comparator);
    	} else {
    		SimpleFeatureType ft = (SimpleFeatureType)f.getFeatureType();
    		for(int i = 0; i < f.getAttributeCount(); i++) {
    			Object attribute = f.getAttribute(i);
    			String name = ft.getDescriptor(i).getLocalName();
    			if(!gNames.contains(name)) {
    				if(attribute == null || attribute instanceof Number)
    					parent.put(name, attribute);
    				else {
    				    LOGGER.warning("Found attribute " + name + " of type " + attribute.getClass().getName());
    					parent.put(name, attribute.toString());
    				}
    					
    			}
    		}
    	}
    }
    
    private class CounterintuitiveComparator<T extends Comparable> implements Comparator<T> {
    	private Map<T, T> comparableMap;
    	
    	public CounterintuitiveComparator(Map<T, T> comparableIn) { 
    		this.comparableMap = comparableIn;
    	}

		public int compare(T o1, T o2) {
			T a1 = comparableMap.get(o1);
			T a2 = comparableMap.get(o2);
			if(a1 != null && a2 != null)
				return a1.compareTo(a2);
			if(a1 == null && a2 == null)
				return 0;
			if(a1 != null)
				return -1;
			return 1;
		}
    	
    }
}