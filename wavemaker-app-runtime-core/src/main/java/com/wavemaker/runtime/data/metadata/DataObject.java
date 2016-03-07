package com.wavemaker.runtime.data.metadata;

import java.util.ArrayList;
import java.util.List;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 19/2/16
 */
public class DataObject {

    protected List<DataObject.Element> element;

    protected String javaType;

    protected String name;

    public List<Element> getElement() {
        if (element == null) {
            element = new ArrayList<>();
        }
        return element;
    }

    public void setElements(final List<Element> element) {
        this.element = element;
    }

    public String getJavaType() {
        return javaType;
    }

    public void setJavaType(final String javaType) {
        this.javaType = javaType;
    }

    public String getName() {
        return name;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public static class Element {

        protected String name;

        protected String subType;


        protected String typeRef;

        protected Boolean isList;

        protected Boolean allowNull;

        public String getName() {
            return name;
        }

        public void setName(final String name) {
            this.name = name;
        }

        public String getSubType() {
            return subType;
        }

        public void setSubType(final String subType) {
            this.subType = subType;
        }

        public String getTypeRef() {
            return typeRef;
        }

        public void setTypeRef(final String typeRef) {
            this.typeRef = typeRef;
        }

        public Boolean getIsList() {
            return isList;
        }

        public void setIsList(final Boolean isList) {
            this.isList = isList;
        }

        public Boolean getAllowNull() {
            return allowNull;
        }

        public void setAllowNull(final Boolean allowNull) {
            this.allowNull = allowNull;
        }
    }


}
