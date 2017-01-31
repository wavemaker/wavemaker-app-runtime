/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.expression;


public class QueryFilter {

    private String attributeName;
    private Object attributeValue;
    private Type filterCondition;
    private AttributeType attributeType;


    public QueryFilter() {
        super();
    }

    public QueryFilter(final String attributeName, final Object attributeValue, final Type filterCondition, final AttributeType attributeType) {
        this.attributeName = attributeName;
        this.attributeValue = attributeValue;
        this.filterCondition = filterCondition;
        this.attributeType = attributeType;
    }

    public AttributeType getAttributeType() {
        return attributeType;
    }

    public void setAttributeType(AttributeType attributeType) {
        this.attributeType = attributeType;
    }

    public String getAttributeName() {
        return attributeName;
    }

    public void setAttributeName(String attributeName) {
        this.attributeName = attributeName;
    }

    public Object getAttributeValue() {
        return attributeValue;
    }

    public void setAttributeValue(Object attributeValue) {
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
