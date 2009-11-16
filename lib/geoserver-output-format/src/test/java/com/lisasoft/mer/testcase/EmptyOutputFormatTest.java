/* Copyright (c) 2009 Government of the State of New South Wales 
 *                    Through the Department of Environment and Climate Change
 * All rights reserved.
 * This code is licensed under the GPL 2.0 license, available at the root
 * application directory.
 */
package com.lisasoft.mer.testcase;

import java.io.InputStream;

import org.geoserver.wfs.WFSTestSupport;

public class EmptyOutputFormatTest extends WFSTestSupport {

	public void testFormatOptionPersistence() throws Exception {
		makeGetRequest(null);
		makeGetRequest("key1:value1");
		makeGetRequest(null);
		makeGetRequest("key1:value2");
		makeGetRequest("key2:value3");
	}

	private void makeGetRequest(String formatOptions) throws Exception {
		InputStream in = null;
		try {
		if(formatOptions == null) 
			in = get("wfs?request=GetFeature&" +
					"typeName=sf:PrimitiveGeoFeature&" +
			"outputFormat=empty");
		else
			in = get("wfs?request=GetFeature&" +
					"typeName=sf:PrimitiveGeoFeature&" +
					"outputFormat=empty&" +
					"format_options=" + formatOptions);
		print(in);
		} finally {
			in.close();
		}
	}
}
