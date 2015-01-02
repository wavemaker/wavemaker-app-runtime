package com.wavemaker.runtime.helper;

import java.util.Iterator;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.XML;

import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.common.util.Tuple;

/**
 * @author Uday Shankar
 */
public class SchemaConversionHelper {

    /**
     * returns a tuple consisting of xml root element name and converted json object
     * @param xmlContent
     * @return
     */
    public static Tuple.Two<String, Object> convertXmlToJson(String xmlContent) {
        try {
            JSONObject jsonObject = XML.toJSONObject(xmlContent);
            Iterator keys = jsonObject.keys();
            String rootKey = (String) keys.next();
            Object o = jsonObject.get(rootKey);
            return Tuple.tuple(rootKey, o);
        } catch (JSONException e) {
            throw new WMRuntimeException("Failed to convert to json from xml String " + xmlContent, e);
        }
    }

}
