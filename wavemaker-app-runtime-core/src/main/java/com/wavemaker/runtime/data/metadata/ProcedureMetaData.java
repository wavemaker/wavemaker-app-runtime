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
package com.wavemaker.runtime.data.metadata;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.wavemaker.commons.WMRuntimeException;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 1/3/16
 */
public class ProcedureMetaData extends MetaData {

    public static final String CURSOR_TYPE_PREFIX = "com.types.CURSOR.";

    private DataObject parentDataObject;

    public ProcedureMetaData(final String parentDataObjectName) {
        this.parentDataObject = buildParentDataObject(parentDataObjectName);
    }

    @Override
    public List<DataObject> constructMetadata(final List data) {
        List<DataObject> dataObjects = new ArrayList<>();
        dataObjects.add(parentDataObject);
        if (data.size() == 0) {
            return dataObjects;
        }
        Object object = data.get(0);
        if (object instanceof Map) {
            constructDataObjectsForMap(parentDataObject, (Map) object, dataObjects);
            return dataObjects;
        } else {
            throw new WMRuntimeException("Find unsupported object type " + object.getClass().getName() + " to generate procedure metadata");
        }
    }

    private void constructDataObjectsForMap(final DataObject parentDataObject, final Map map, List<DataObject> dataObjects) {
        for (Map.Entry entry : (Set<Map.Entry>) map.entrySet()) {
            constructElement(entry, parentDataObject, dataObjects);
            if (!dataObjects.contains(parentDataObject)) {
                dataObjects.add(parentDataObject);
            }
        }
    }

    private void constructElement(final Map.Entry entry, final DataObject parentDataObject, final List<DataObject> dataObjects) {
        String key = (String) entry.getKey();
        Object value = entry.getValue();
        if (value != null && value instanceof List) {
            final DataObject.Element element = new DataObject.Element();
            element.setName(key);
            final String typeRef = CURSOR_TYPE_PREFIX + key;
            element.setTypeRef(typeRef);
            element.setIsList(true);
            parentDataObject.getElement().add(element);
            List list = (List) value;
            if (list.size() != 0 && list.get(0) instanceof Map) {
                DataObject dataObject = new DataObject();
                dataObject.setName(typeRef);
                dataObject.setJavaType(typeRef);
                constructDataObjectsForMap(dataObject, (Map) list.get(0), dataObjects);
            }
        } else {
            final DataObject.Element element = new DataObject.Element();
            element.setName(key);
            element.setIsList(false);
            final String typeRef = (value == null) ? String.class.getName() : value.getClass().getName();
            element.setTypeRef(typeRef);
            parentDataObject.getElement().add(element);
        }
    }

    private DataObject buildParentDataObject(final String parentDataObjectName) {
        DataObject dataObject = new DataObject();
        dataObject.setName(parentDataObjectName);
        dataObject.setJavaType(parentDataObjectName);
        return dataObject;
    }
}
