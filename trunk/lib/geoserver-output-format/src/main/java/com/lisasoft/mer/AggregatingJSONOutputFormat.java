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
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
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

/**
 * @author mleslie
 *
 */
public class AggregatingJSONOutputFormat extends AbstractJSONOutputFormat {
    private Logger LOGGER = org.geotools.util.logging.Logging.getLogger(this.getClass().toString());
    
    public AggregatingJSONOutputFormat() {
        super("agg-json");
    }
   
    @Override
    /**
     * This will output the features in the collection in an appropriate
     * format.  If a list of attribute names is provided in the
     * format options under an AGGREGATES parameter, and all of these attributes
     * exist in the feature type, then these will be aggregated into lists
     * within each feature.  Otherwise the writeUnprocessed method of
     * AbstractJSONOutputFormat is called to handle the features.
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
    	System.out.println("Format Options: " + formatOptions.toString());
    	
    	String[] aggregateNames = {};
    	String[] sortNames = {};
    	if(formatOptions != null && 
    			formatOptions.get("AGGREGATES") != null) {
    		String groupingList = formatOptions.get("AGGREGATES").toString();
    		LOGGER.warning("Aggregating := (" + groupingList + ")");
    		aggregateNames = groupingList.split(" ");
    	} else {
    		LOGGER.warning("Not aggregating.");
    	}
		if(formatOptions != null && 
				formatOptions.get("SORT") != null) {
			String sortList = formatOptions.get("SORT").toString();
			LOGGER.warning("Sorting on:= (" + sortList + ")");
			sortNames = sortList.split(" ");
		} else {
			LOGGER.warning("Not sorting.");
		}

    	int[] aIndicies = findAttributeIndicies(ft, aggregateNames);
		int[] sIndicies = findAttributeIndicies(ft, sortNames);

    	if(verifyIndicies(aIndicies))
    		writeAggregated(fc, aIndicies, 
    				verifyIndicies(sIndicies) ? sIndicies : null, output);
    	else 
    		writeUnprocessed(fc, output);
    }

    /**
     * This will handle any features with the required attributes as 
     * defined in the gIndicies array.  Others are handled by writeNonMER
     * 
     * @param fc FeatureCollection passed in by GeoServer
     * @param featureIdIndex index of the feature id attribute
     * @param condPressIndex index of the condition vs pressure attribute
     * @param indIdIndex index of the indicator id attribute
     * @param output OutputStream to write response to
     * @throws IOException
     */
    private void writeAggregated(FeatureCollection fc, int[] gIndicies, 
    		int[] sIndicies, OutputStream output) throws IOException {
    	
    	BufferedWriter w = new BufferedWriter(new OutputStreamWriter(output));
    	SimpleFeatureType ft = (SimpleFeatureType)fc.getSchema();
    	String[] names = getAttributeNames(ft);
    	Map<String, Map<String, Object>> allFeatures = 
    			new HashMap<String, Map<String, Object>>();
    	FeatureIterator i = fc.features();
    	try {
    		while(i.hasNext()) {
    			SimpleFeature f = (SimpleFeature)i.next();
    			Object[] values = new Object[names.length];
    			StringBuffer keyBuf = new StringBuffer();
    			/*
    			 * This section defines the key used to group like 
    			 * non-aggregates, by concatenating their values together.
    			 * As such, it handles all attributes as Strings.
    			 */
    			for(int a = 0; a < names.length; a++) {
    				Object obj = f.getAttribute(a);
    				LOGGER.warning("Found attribute " + names[a] +  " of type " + 
    						(obj == null ? "null" : obj.getClass().getName()));
    				if((obj != null) && obj instanceof Number) {
    					values[a] = obj;
    				} else {
    					values[a] = (obj != null) ? obj.toString() : "";
    				}
    				boolean isAgg = false;
    				for(int b = 0; b < gIndicies.length; b++) {
    					if(gIndicies[b] == a) {
    						isAgg = true;
    					}
    				}
    				if(!isAgg) {
    					if(a != 0)
    						keyBuf.append(",");
    					keyBuf.append(values[a].toString());
    				}
    			}
    			/*
    			 * Based on the values of the non-aggregated attributes, find 
    			 * the feature map for the appropriate feature.
    			 */
    			Map<String, Object> feat = allFeatures.get(keyBuf.toString());
    			if(feat == null) {
    				feat = new HashMap<String, Object>();
    				allFeatures.put(keyBuf.toString(), feat);
    				for(int a = 0; a < names.length; a++) {
    					boolean isAgg = false;
    					for(int b = 0; b < gIndicies.length; b++) {
    						if(gIndicies[b] == a) {
    							isAgg = true;
    							break;
    						}
    					}
    					if(isAgg) {
    						List<Object> vals = new ArrayList<Object>();
    						LOGGER.warning("Found attribute " + names[a] + 
    								" of type " + values[a].getClass().getName());
    						vals.add(values[a]);
    						feat.put(names[a], vals);
    					} else {
    						feat.put(names[a], values[a]);
    					}
    				}
    			} else {
    				// There is no need to handle the non-aggregates again
    				for(int a = 0; a < names.length; a++) {
    					for(int b = 0; b < gIndicies.length; b++) {
    						if(gIndicies[b] == a) {
    							List<Object> vals = (List<Object>)feat.get(names[a]);
    							vals.add(values[a]);
    						}
    					}
    				}
    			}
    		}
    		
    		Set<Map<String, Object>> set = null;
    		if(sIndicies != null) {
    			set =  new TreeSet<Map<String, Object>>(
    					new AttributeComparitor(sIndicies, names));
    			set.addAll(allFeatures.values());
    		} else {
    			set = new HashSet<Map<String, Object>>();
    			set.addAll(allFeatures.values());
    		}

    		w.write("{\n" +
    				"\"type\":\"FeatureCollection\",\n" +
    		"\"features\": [\n");
    		Iterator<Map<String, Object>> loopIt = set.iterator();
    		while(loopIt.hasNext()) {
    			Map<String, Object> attMap = loopIt.next();
    			JSON json = JSONSerializer.toJSON(attMap);
    			String jsonString = json.toString(2);
    			w.write(jsonString);
    			if(loopIt.hasNext()) w.write(",");
    		}
    		w.write("]\n}");
    	
//			Map<String,Object> feats = new HashMap<String,Object>();
//			feats.put("type", "FeatureCollection");
//			feats.put("features", allFeatures.values());
//    		JSON json = JSONSerializer.toJSON(feats);
//    		w.write(json.toString(2));
//    		w.write("\n");
    	} finally {
    		fc.close(i);
    	}
    	w.flush();
    }
}
