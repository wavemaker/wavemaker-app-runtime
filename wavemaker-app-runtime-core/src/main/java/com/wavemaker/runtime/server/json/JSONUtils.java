/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
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
package com.wavemaker.runtime.server.json;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.runtime.server.JSONParameterTypeField;
import com.wavemaker.runtime.service.ParsedServiceArguments;
import com.wavemaker.studio.common.MessageResource;
import com.wavemaker.studio.common.WMException;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.json.AlternateJSONTransformer;
import com.wavemaker.studio.json.JSONArray;
import com.wavemaker.studio.json.JSONObject;
import com.wavemaker.studio.json.JSONState;
import com.wavemaker.studio.json.type.FieldDefinition;
import com.wavemaker.studio.json.type.TypeState;
import com.wavemaker.studio.json.type.reflect.ReflectTypeUtils;

/**
 * JSON utility methods.
 * 
 * @author Matt Small
 */
public class JSONUtils {

    private JSONUtils() {
    }

    private static final Logger logger = LoggerFactory.getLogger(JSONUtils.class);

    /**
     * Convert a JSONArray into an array of objects, with types as specified in the paramTypes argument.
     * 
     * @param params JSONArray of data to convert.
     * @return An array of Objects; data is from params, and the types match those of paramTypes.
     * @throws WMException
     */
    public static ParsedServiceArguments convertJSONToObjects(JSONArray params, Method method, JSONState jsonState) {

        return convertJSONToObjects(params, getParameterTypes(method, params, jsonState.getTypeState()), jsonState);
    }

    /**
     * Convert a JSONArray into an array of objects, with types as specified in the paramTypes argument.
     * 
     * @param params JSONArray of data to convert.
     * @param fieldDefinitions A List of FieldDefinitions, specifying the type of each argument (in an order matching
     *        that of the arguments).
     * @return An array of Objects; data is from params, and the types match those of paramTypes.
     * @throws WMException
     */
    public static ParsedServiceArguments convertJSONToObjects(JSONArray params, List<FieldDefinition> fieldDefinitions, JSONState jsonState) {

        Object[] objects = new Object[fieldDefinitions.size()];
        List<List<String>> deserializedProps = new ArrayList<List<String>>(fieldDefinitions.size());

        for (int i = 0; i < fieldDefinitions.size(); i++) {
            Object elem = params.get(i);
            FieldDefinition fieldDefinition = fieldDefinitions.get(i);

            objects[i] = AlternateJSONTransformer.toObject(jsonState, elem, fieldDefinition);

            deserializedProps.add(i, jsonState.getSettersCalled());
            jsonState.setSettersCalled(new ArrayList<String>());
        }

        logger.debug("Deserialized properties {}", deserializedProps);

        ParsedServiceArguments psa = new ParsedServiceArguments();
        psa.setArguments(objects);
        psa.setGettersCalled(deserializedProps);
        return psa;
    }

    public static List<FieldDefinition> getParameterTypes(Method m, JSONArray params, TypeState typeState) {

        List<FieldDefinition> fieldDefinitions = new ArrayList<FieldDefinition>();
        for (Type type : m.getGenericParameterTypes()) {
            fieldDefinitions.add(ReflectTypeUtils.getFieldDefinition(type, typeState, false, null));
        }

        Annotation[][] paramAnnotations = m.getParameterAnnotations();

        for (int i = 0; i < paramAnnotations.length; i++) {
            for (Annotation ann : paramAnnotations[i]) {
                if (ann instanceof JSONParameterTypeField) {

                    JSONParameterTypeField paramTypeField = (JSONParameterTypeField) ann;
                    int pos = paramTypeField.typeParameter();
                    String typeString = (String) params.get(pos);

                    try {
                        Class<?> newType = org.springframework.util.ClassUtils.forName(typeString, null);

                        if (Collection.class.isAssignableFrom(newType)) {
                            throw new WMRuntimeException(MessageResource.JSONUTILS_PARAMTYPEGENERIC, i, m.getName());
                        }

                        fieldDefinitions.set(i, ReflectTypeUtils.getFieldDefinition(newType, typeState, false, null));
                    } catch (ClassNotFoundException e) {
                        throw new WMRuntimeException(MessageResource.JSONPARAMETER_COULD_NOTLLOAD_TYPE, e, typeString, m.getName(), i);
                    } catch (LinkageError e) {
                        throw new WMRuntimeException(e);
                    }
                }
            }
        }

        return fieldDefinitions;
    }

    public static Object toBean(JSONObject jo, Class<?> klass) {

        return AlternateJSONTransformer.toObject(jo, klass);
    }

    public static Object toBean(Object jo, Class<?> klass) {

        return AlternateJSONTransformer.toObject(new JSONState(), jo, klass);
    }

    public static Object toBean(Object jo, FieldDefinition fieldDefinition, JSONState jsonState) {

        return AlternateJSONTransformer.toObject(jsonState, jo, fieldDefinition);
    }
}
