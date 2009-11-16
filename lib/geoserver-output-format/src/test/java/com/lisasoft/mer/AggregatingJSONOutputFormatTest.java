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


public class AggregatingJSONOutputFormatTest extends AbstractOutputFormatTest {
   
    public void testAggregatingOutputFormat() throws Exception {
    	testOutputFormatType("agg-json", 
    			"aggregates:pointProperty intProperty measurand " + 
    			"booleanProperty decimalProperty name dateProperty " + 
    			"description curveProperty name dateTimeProperty surfaceProperty");
    	testOutputFormatType("agg-json", 
    			"" + 
    			"booleanProperty decimalProperty name dateProperty " + 
    			"description curveProperty name dateTimeProperty surfaceProperty");
    	testOutputFormatType("agg-json",
    			"aggregates:pointProperty intProperty decimalProperty name " +
    			"dateProperty description curveProperty name " +
    			"dateTimeProperty surfaceProperty;sort:measurand");    }
}