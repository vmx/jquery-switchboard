package com.lisasoft.mer;

import java.util.Comparator;
import java.util.Map;

import java.util.logging.Logger;

public final class AttributeComparitor implements Comparator<Map<String, Object>> {
	private int[] indicies;
	private String[] names;

	protected Logger LOGGER = org.geotools.util.logging.Logging.getLogger(this.getClass().toString());

	public AttributeComparitor(int[] indicies, String[] names) {
		this.indicies = indicies;
		this.names = names;
	}

	public int compare(Map<String, Object> left, Map<String, Object> right) {
		for(int i = 0; i < indicies.length; i++) {
			LOGGER.warning("Comparing on attribute " + names[i] + " at index " + i);
			Object leftObj = left.get(names[indicies[i]]);
			Object rightObj = right.get(names[indicies[i]]);
			if(leftObj == null && rightObj == null) {
				LOGGER.warning("Equally null.");
				continue;
			} else if(leftObj == null && rightObj != null) {
				LOGGER.warning("Comparing nulls, 1");
				return -1;
			} else if(leftObj != null && rightObj == null) {
				LOGGER.warning("Comparing nulls, -1");
				return 1;
			} else if(leftObj instanceof String && rightObj instanceof String) {
				LOGGER.warning("Comparing Strings " + (String)leftObj + ", " + (String)rightObj);
				int comp = ((String)leftObj).compareTo((String)rightObj);
				if(comp != 0)
					return comp;
			} else if(leftObj instanceof Long && rightObj instanceof Long) {
				LOGGER.warning("Comparing longs " + (Long)leftObj + ", " + (Long)rightObj);
				int comp = ((Long)leftObj).compareTo((Long)rightObj);
				if(comp != 0)
					return comp;
			} else if(leftObj instanceof Integer && rightObj instanceof Integer) {
				LOGGER.warning("Comparing ints " + (Integer)leftObj + ", " + (Integer)rightObj);
				int comp = ((Integer)leftObj).compareTo((Integer)rightObj);
				if(comp != 0)
					return comp;
			} else if(leftObj instanceof Double && rightObj instanceof Double) {
				LOGGER.warning("Comparing doubles " + (Double)leftObj + ", " + (Double)rightObj);
				int comp = ((Double)leftObj).compareTo((Double)rightObj);
				if(comp != 0)
					return comp;
			} else if(leftObj instanceof Float && rightObj instanceof Float) {
				LOGGER.warning("Comparing float " + (Float)leftObj + ", " + (Float)rightObj);
				int comp = ((Float)leftObj).compareTo((Float)rightObj);
				if(comp != 0)
					return comp;
			} else {
				// If not comparable, let the next attribute decide.
				LOGGER.warning("Oddness.  Both are neither string nor number.");
			}
		}
		/* 
		 * anything after the sort attributes is irrelevant to order, so we 
		 * do something arbitrary.  We can't, after all, have the set thinking
		 * they're equal.
		 */
		return -1;
	}
}