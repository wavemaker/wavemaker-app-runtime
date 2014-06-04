package com.wavemaker.runtime.data.jpa.expression;

public class QueryFilter {

	private String attributeName;
	private String attributeValue;
	private Type filterCondition;

	public QueryFilter() {
		super();
	}

	public QueryFilter(String attributeName, String attributeValue,
			Type filterCondition) {
		super();
		this.attributeName = attributeName;
		this.attributeValue = attributeValue;
		this.filterCondition = filterCondition;
	}

	public String getAttributeName() {
		return attributeName;
	}

	public void setAttributeName(String attributeName) {
		this.attributeName = attributeName;
	}

	public String getAttributeValue() {
		return attributeValue;
	}

	public void setAttributeValue(String attributeValue) {
		this.attributeValue = attributeValue;
	}

	public Type getFilterCondition() {
		return filterCondition;
	}

	public void setFilterCondition(Type filterCondition) {
		this.filterCondition = filterCondition;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result
				+ ((attributeName == null) ? 0 : attributeName.hashCode());
		result = prime * result
				+ ((attributeValue == null) ? 0 : attributeValue.hashCode());
		result = prime * result
				+ ((filterCondition == null) ? 0 : filterCondition.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		QueryFilter other = (QueryFilter) obj;
		if (attributeName == null) {
			if (other.attributeName != null)
				return false;
		} else if (!attributeName.equals(other.attributeName))
			return false;
		if (attributeValue == null) {
			if (other.attributeValue != null)
				return false;
		} else if (!attributeValue.equals(other.attributeValue))
			return false;
		if (filterCondition == null) {
			if (other.filterCondition != null)
				return false;
		} else if (!filterCondition.equals(other.filterCondition))
			return false;
		return true;
	}

}
