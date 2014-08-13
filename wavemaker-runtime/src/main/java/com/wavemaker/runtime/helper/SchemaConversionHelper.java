package com.wavemaker.runtime.helper;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

import com.wavemaker.common.util.Tuple;
import net.sf.json.JSON;
import net.sf.json.JSONArray;
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
    public static Tuple.Two<String, JSON> convertXmlToJson(String xmlContent) {
        XMLSerializer xmlSerializer = new XMLSerializer();
        xmlSerializer.setSkipNamespaces(true);
        xmlSerializer.setForceTopLevelObject(true);
        JSONObject rootJsonObject = (JSONObject) xmlSerializer.read(xmlContent);
        normalizeJson(rootJsonObject);
        Iterator keys = rootJsonObject.keys();
        String rootKey = (String) keys.next();
        JSON v2 = (JSON) rootJsonObject.get(rootKey);
        return Tuple.tuple(rootKey, v2);
    }

    private static <T extends JSON> void normalizeJson(T json) {
        if(json instanceof JSONObject) {
            JSONObject jsonObject = (JSONObject) json;
            Set jsonKeys = new HashSet(jsonObject.keySet());
            for (Object obj : jsonKeys) {
                String key = (String) obj;
                Object value = jsonObject.get(key);
                if(key.startsWith("@")) {//Handling the xml attributes which are converted with @ prefix in the json object keys
                    jsonObject.remove(key);
                    key = "_" + key.substring(1);
                    jsonObject.put(key, value);
                }
                if(value instanceof JSON) {
                    normalizeJson((JSON) value);
                }
            }
        } else if (json instanceof JSONArray) {
            JSONArray jsonArray = (JSONArray) json;
            Iterator iterator = jsonArray.iterator();
            while (iterator.hasNext()) {
                Object obj = iterator.next();
                if(obj instanceof JSON) {
                    normalizeJson((JSON) obj);
                }
            }
        }
    }
}
