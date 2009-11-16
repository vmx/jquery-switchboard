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
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.TreeSet;

import net.opengis.wfs.FeatureCollectionType;
import net.opengis.wfs.GetFeatureType;
import net.sf.json.JSON;
import net.sf.json.JSONSerializer;

import org.geoserver.platform.Operation;
import org.geoserver.platform.ServiceException;
import org.geotools.feature.FeatureCollection;
import org.geotools.feature.FeatureIterator;
import org.opengis.feature.Feature;
import org.opengis.feature.simple.SimpleFeature;
import org.opengis.feature.simple.SimpleFeatureType;
import org.opengis.feature.type.AttributeDescriptor;

public class SortingJSONOutputFormat extends AbstractJSONOutputFormat {
	


	public SortingJSONOutputFormat() {
		super("sort-json");
	}

	@Override
	protected void write(FeatureCollectionType featureCollection,
			OutputStream output, Operation getFeature) throws IOException,
			ServiceException {

		FeatureCollection fc = 
			(FeatureCollection)featureCollection.getFeature().get(0);

		SimpleFeatureType ft = (SimpleFeatureType)fc.getSchema();
		GetFeatureType gft = (GetFeatureType) getFeature.getParameters()[0];
		Map formatOptions = gft.getFormatOptions();
		LOGGER.warning("Format Options: " + formatOptions.toString());
		System.out.println("Format Options: " + formatOptions.toString());

		String[] sortNames = {};
		if(formatOptions != null && 
				formatOptions.get("SORT") != null) {
			String sortList = formatOptions.get("SORT").toString();
			LOGGER.warning("Sorting on:= (" + sortList + ")");
			sortNames = sortList.split(" ");
		} else {
			LOGGER.warning("Not sorting.");
		}

		int[] aIndicies = findAttributeIndicies(ft, sortNames);

    	if(verifyIndicies(aIndicies)) {
    		writeSorted(fc, aIndicies, output);
    	} else {
    		writeUnprocessed(fc, output);
    	}
	}
	
	private void writeSorted(FeatureCollection fc, 
			final int[] aIndicies, OutputStream output) throws IOException {
    	SimpleFeatureType ft = (SimpleFeatureType)fc.getSchema();
    	final String[] names = getAttributeNames(ft);
		TreeSet<Map<String, Object>> set = new TreeSet<Map<String, Object>>(
				new AttributeComparitor(aIndicies, names));
		
		FeatureIterator it = fc.features();
		try {
			while(it.hasNext()) {
				SimpleFeature f = (SimpleFeature)it.next();
				Map<String, Object> attMap = new HashMap<String,Object>();
				for(int j = 0; j < f.getAttributeCount(); j++) {
					Object att = f.getAttribute(j);
					if(att == null)
						att = "";
					AttributeDescriptor ad = ft.getDescriptor(j);
					LOGGER.warning("Found an attribute of type " +
							att.getClass().getName() + " called " + 
							ad.getLocalName());
					if(att instanceof Double) 
						attMap.put(ad.getLocalName(), att);
					else if(att instanceof Float)
						attMap.put(ad.getLocalName(), new Double(((Float)att).doubleValue()));
					else if(att instanceof Long)
						attMap.put(ad.getLocalName(), att);
					else if(att instanceof Integer)
						attMap.put(ad.getLocalName(), new Long(((Integer)att).longValue()));
					else
						attMap.put(ad.getLocalName(), att.toString());
				}
				set.add(attMap);
			}
		} finally {
			fc.close(it);
		}
//		JSON json = JSONSerializer.toJSON(set);
		BufferedWriter w = new BufferedWriter(new OutputStreamWriter(output));
		try {
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
		} finally {
			w.flush();
		}
	}

}
