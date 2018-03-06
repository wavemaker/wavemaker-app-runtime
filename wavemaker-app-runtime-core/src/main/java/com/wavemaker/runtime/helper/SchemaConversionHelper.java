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
package com.wavemaker.runtime.helper;

import java.util.Iterator;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.XML;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.util.Tuple;

/**
 * @author Uday Shankar
 */
public class SchemaConversionHelper {

    private SchemaConversionHelper(){}

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
