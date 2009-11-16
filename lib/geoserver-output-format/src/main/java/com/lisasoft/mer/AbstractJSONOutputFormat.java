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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import net.sf.json.JSON;
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
 * This is an abstract superclass for the custom JSON output formats.  It
 * most notably provides a streaming fall-through case that will perform
 * better in terms of memory consumption and will provide a fall-through case
 * for requests that don't need to be processed or that cannot due to 
 * mis-configuration of the request
 * 
 * @author mleslie
 *
 */
public abstract class AbstractJSONOutputFormat extends WFSGetFeatureOutputFormat {
    protected Logger LOGGER = org.geotools.util.logging.Logging.getLogger(this.getClass().toString());
    
	public AbstractJSONOutputFormat(String outputFormat) {
		super(outputFormat);
	}

	@Override
	public String getMimeType(Object value, Operation operation)
			throws ServiceException {
				return "application/json";
			}

	@Override
	protected boolean canHandleInternal(Operation operation) {
	    return super.canHandleInternal(operation);
	}

	/**
	 * This is the fall-through case.  It will output JSON features as they
	 * are, with no processing at all.  It writes out a feature at a time to 
	 * ensure that we aren't wasting memory when it isn't necessary.
	 * 
	 * @param fc Collection of features supplied by GeoServer
	 * @param output OutputStream to write response to
	 * @throws IOException
	 */
	protected void writeUnprocessed(FeatureCollection fc, OutputStream output)
			throws IOException {
				BufferedWriter w = new BufferedWriter(new OutputStreamWriter(output));
				FeatureIterator i = fc.features();    	
				
				SimpleFeatureType ft = (SimpleFeatureType)fc.getSchema();
				List<Map<String,Object>> featureList = 
					new ArrayList<Map<String,Object>>();
				w.write("{\n" +
					"\"type\":\"FeatureCollection\",\n" +
					"\"features\": [\n");
				boolean isFirst = true;
				try {
					while(i.hasNext()) {
						if(!isFirst)
							w.write(",\n");
						else
							isFirst = false;
						SimpleFeature f = (SimpleFeature)i.next();
						Map<String, Object> attMap = new HashMap<String,Object>();
						for(int j = 0; j < f.getAttributeCount(); j++) {
							Object att = f.getAttribute(j);
							if(att == null)
								att = "";
							AttributeDescriptor ad = ft.getDescriptor(j);
							LOGGER.warning("Found an attribute of type " +
									att.getClass().getName() + " called " + 
									ad.getLocalName());
							if(att instanceof Number)
								attMap.put(ad.getLocalName(), att);
							else
								attMap.put(ad.getLocalName(), att.toString());
						}
						JSON json = JSONSerializer.toJSON(attMap);
						w.write(json.toString(2));
					}
					w.write("]\n}");
				} finally {
					fc.close(i);
				}
				w.flush();
			}

	/**
	 * Finds the indicies of all the named attributes within the feature type.
	 * Any attibute that cannot be identified is included as -1.
	 * 
	 * @param ft SimpleFeatureType describing the features
	 * @param names array of names.  Null values should not be tragic.
	 * @return
	 */
	protected int[] findAttributeIndicies(SimpleFeatureType ft, String[] names) {
		if(names == null)
			return new int[0];
		int indicies[] = new int[names.length];
		for(int j = 0; j < names.length; j++)
			indicies[j] = -1;
		
		for(int i = 0; i < ft.getAttributeCount(); i++) {
			AttributeDescriptor ad = ft.getDescriptor(i);
			for(int j = 0; j < names.length; j++) {
				if(ad.getLocalName().equals(names[j]))
					indicies[j] = i;
			}
		}
		return indicies;
	}

	/**
	 * Determines if the array of indicies is complete (no -1 values)
	 * and usable for the processing.
	 * @param indicies Array of attribute indicies to verify
	 * @return true if all attribute indicies are valid, and there is at 
	 *         least one of them.
	 */
	protected boolean verifyIndicies(int[] indicies) {
		if(indicies == null || indicies.length == 0)
			return false;
		for(int j = 0; j < indicies.length; j++) {
			if(indicies[j] == -1) {
				return false;
			}
		}	
		return true;
	}

	/**
	 * Retrieves an array of attribute names
	 * @param ft description of the features
	 * @return array of attribute local names
	 */
	protected String[] getAttributeNames(SimpleFeatureType ft) {
		List<AttributeDescriptor> fds = ft.getAttributeDescriptors();
		String[] names = new String[fds.size()];
		for(int i = 0; i < names.length; i++) {
			names[i] = fds.get(i).getLocalName();
		}
		return names;
	}
	
}
