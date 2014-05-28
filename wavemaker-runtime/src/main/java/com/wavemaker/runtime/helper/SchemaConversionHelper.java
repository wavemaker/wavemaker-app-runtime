package com.wavemaker.runtime.helper;

import java.util.Iterator;

import com.wavemaker.common.util.Tuple;
import net.sf.json.JSONObject;
import net.sf.json.xml.XMLSerializer;

/**
 * @author Uday Shankar
 */
public class SchemaConversionHelper {

    /**
     * returns a tuple consisting of xml root element name and converted json object
     * @param xmlContent
     * @return
     */
    public static Tuple.Two<String, JSONObject> convertXmlToJson(String xmlContent) {
        XMLSerializer xmlSerializer = new XMLSerializer();
        xmlSerializer.setSkipNamespaces(true);
        xmlSerializer.setForceTopLevelObject(true);
        JSONObject rootJsonObject = (JSONObject) xmlSerializer.read(xmlContent);
        Iterator keys = rootJsonObject.keys();
        String rootKey = (String) keys.next();
        return Tuple.tuple(rootKey, rootJsonObject.getJSONObject(rootKey));
    }
}
