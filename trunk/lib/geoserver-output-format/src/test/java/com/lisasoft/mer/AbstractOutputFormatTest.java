/* Copyright (c) 2009 Government of the State of New South Wales 
 *                    Through the Department of Environment and Climate Change
 * All rights reserved.
 * This code is licensed under the GPL 2.0 license, available at the root
 * application directory.
 */
package com.lisasoft.mer;

import java.io.InputStream;

import org.geoserver.wfs.WFSTestSupport;
import org.w3c.dom.Document;


public abstract class AbstractOutputFormatTest extends WFSTestSupport {

	protected void testOutputFormatType(String outputFormat) 
			throws Exception {
		testOutputFormatType(outputFormat, null);
}
	
	protected void testOutputFormatType(String outputFormat, String formatOptions) 
			throws Exception {
		InputStream in = null;
		if(formatOptions != null)
			in = get( "wfs?request=GetFeature&typeName=sf:PrimitiveGeoFeature" + 
					"&outputFormat=" + outputFormat + "&format_options=" + formatOptions);
		else
			in = get( "wfs?request=GetFeature&typeName=sf:PrimitiveGeoFeature" + 
					"&outputFormat=" + outputFormat);
		print( in ); 
	}
}
	