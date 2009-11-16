/* Copyright (c) 2009 Government of the State of New South Wales 
 *                    Through the Department of Environment and Climate Change
 * All rights reserved.
 * This code is licensed under the GPL 2.0 license, available at the root
 * application directory.
 */
package com.lisasoft.mer.testcase;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.util.Map;

import net.opengis.wfs.FeatureCollectionType;
import net.opengis.wfs.GetFeatureType;

import org.geoserver.platform.Operation;
import org.geoserver.platform.ServiceException;
import org.geoserver.wfs.WFSGetFeatureOutputFormat;
import org.geotools.feature.FeatureCollection;
import org.opengis.feature.simple.SimpleFeatureType;

public class EmptyOutputFormat extends WFSGetFeatureOutputFormat {
	
	public EmptyOutputFormat() {
		super("empty");
	}

	@Override
	public String getMimeType(Object value, Operation operation)
	throws ServiceException {
		return "text/plain";
	}

	@Override
	protected boolean canHandleInternal(Operation operation) {
	    return super.canHandleInternal(operation);
	}
	
	@Override
	protected void write(FeatureCollectionType featureCollection,
			OutputStream output, Operation getFeature) throws IOException,
			ServiceException {
		BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(output));
		GetFeatureType gft = (GetFeatureType) getFeature.getParameters()[0];
		Map formatOptions = gft.getFormatOptions();
		writer.write("FormatOptions: " + formatOptions.toString());
		writer.flush();
	}

}
