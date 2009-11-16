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


public class HierarchicalJSONOutputFormatTest extends AbstractOutputFormatTest {
	
    public void testHierarchicalOutputFormat() throws Exception {
    	testOutputFormatType("hier-json", "grouping:uriProperty description");
    	testOutputFormatType("hier-json", "grouping:uriProperty description;sort:decimalProperty");
    	testOutputFormatType("hier-json", "grouping:description;sort:decimalProperty");
    }
}
