package com.wavemaker.runtime.data.metadata;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.wavemaker.studio.common.WMRuntimeException;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 1/3/16
 */
public class ProcedureMetaData extends MetaData {

    public static final String LIST_SUFFIX = "_list";
    private DataObject parentDataObject;

    public ProcedureMetaData(final String parentDataObjectName) {
        this.parentDataObject = buildParentDataObject(parentDataObjectName);
    }

    @Override
    public List<DataObject> constructMetadata(final List data) {
        List<DataObject> dataObjects = new ArrayList<>();
        dataObjects.add(parentDataObject);
        Object object = data.get(0);
        if (object != null) {
            if (object instanceof Map) {
                constructDataObjectsForMap(parentDataObject, (Map) object, dataObjects);
            } else {
                throw new WMRuntimeException("Find unsupported object type " + object.getClass().getName() + " to generate procedure metadata");
            }
        } else {
            throw new WMRuntimeException("Failed to generate procedure metadata for the given response");
        }
        return dataObjects;
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
        if (value instanceof List) {
            final DataObject.Element element = new DataObject.Element();
            element.setName(key);
            final String typeRef = key + LIST_SUFFIX;
            element.setTypeRef(typeRef);
            element.setIsList(true);
            parentDataObject.getElement().add(element);
            List list = (List) value;
            if (list.get(0) != null && list.get(0) instanceof Map) {
                DataObject dataObject = new DataObject();
                dataObject.setName(typeRef);
                dataObject.setJavaType(typeRef);
                constructDataObjectsForMap(dataObject, (Map) list.get(0), dataObjects);
            }
        } else {
            final DataObject.Element element = new DataObject.Element();
            element.setName(key);
            element.setIsList(false);
            element.setTypeRef(value.getClass().getName());
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
