/* Copyright (c) 2009 Government of the State of New South Wales 
 *                    Through the Department of Environment and Climate Change
 * All rights reserved.
 * This code is licensed under the GPL 2.0 license, available at the root
 * application directory.
 */
package com.lisasoft.mer;

public class SortingJSONOutputFormatTest extends AbstractOutputFormatTest {

    public void testSortingOutputFormat() throws Exception {
    	testOutputFormatType("sort-json", 
    			"sort:pointProperty intProperty measurand ");
    	testOutputFormatType("sort-json", 
    			"name decimalProperty");
    }
}
