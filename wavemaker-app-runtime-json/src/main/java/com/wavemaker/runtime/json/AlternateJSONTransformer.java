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
package com.wavemaker.runtime.json;

import java.lang.reflect.InvocationTargetException;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Stack;

import org.apache.commons.beanutils.PropertyUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.util.Tuple;
import com.wavemaker.runtime.json.type.FieldDefinition;
import com.wavemaker.runtime.json.type.ListTypeDefinition;
import com.wavemaker.runtime.json.type.MapTypeDefinition;
import com.wavemaker.runtime.json.type.ObjectTypeDefinition;
import com.wavemaker.runtime.json.type.PrimitiveTypeDefinition;
import com.wavemaker.runtime.json.type.TypeState;
import com.wavemaker.runtime.json.type.converters.ReadObjectConverter;
import com.wavemaker.runtime.json.type.reflect.ReflectTypeUtils;

/**
 * Alternate JSONObject -&gt; Object transformers.
 * 
 * @author Matt Small
 */
public class AlternateJSONTransformer {

    public static final char PROP_SEP = '.';

    protected static final Logger logger = LoggerFactory.getLogger(AlternateJSONTransformer.class);

    public static Object toObject(JSONObject obj, Class<?> klass) {
        return toObject(new JSONState(), obj, klass);
    }

    public static Object toObject(JSONState jsonState, Object obj, Class<?> klass) {

        TypeState typeState = jsonState.getTypeState();
        FieldDefinition fieldDefinition = ReflectTypeUtils.getFieldDefinition(klass, typeState, false, null);

        return toObjectInternal(jsonState, obj, obj, fieldDefinition, typeState, 0, new Stack<>());
    }

    public static Object toObject(JSONState jsonState, Object obj, FieldDefinition fieldDefinition) {

        return toObjectInternal(jsonState, obj, obj, fieldDefinition, jsonState.getTypeState(), 0, new Stack<>());
    }

    /**
     * Main recursive call; every level should go through this method.
     */
    private static Object toObjectInternal(JSONState jsonState, Object obj, Object root, FieldDefinition fieldDefinition, TypeState typeState,
        int arrayLevel, Stack<String> setterQueue) {

        if (fieldDefinition == null) {
            throw new IllegalArgumentException("fieldDefinition cannot be null");
        }

        Object ret;

        if (jsonState.getValueTransformer() != null) {
            Tuple.Three<Object, FieldDefinition, Integer> tuple = jsonState.getValueTransformer().transformToJava(obj, fieldDefinition, arrayLevel,
                root, getPropertyFromQueue(setterQueue), jsonState.getTypeState());

            if (tuple != null) {
                obj = tuple.v1;
                fieldDefinition = tuple.v2;
                arrayLevel = tuple.v3;
            }
        }

        if (obj != null && fieldDefinition.getDimensions() == arrayLevel && fieldDefinition.getTypeDefinition() == null) {
            fieldDefinition = ReflectTypeUtils.getFieldDefinition(obj.getClass(), typeState, false, null);
        }

        try {
            if (fieldDefinition.getTypeDefinition() == null) {
                ret = obj;
            } else if (arrayLevel == fieldDefinition.getDimensions() && fieldDefinition.getTypeDefinition() instanceof ReadObjectConverter) {
                ret = ((ReadObjectConverter) fieldDefinition.getTypeDefinition()).readObject(obj, root, getPropertyFromQueue(setterQueue));
            } else if (obj == null) {
                ret = null;
            } else if (arrayLevel < fieldDefinition.getDimensions()) {
                ret = toCollectionOrArray(jsonState, obj, root, fieldDefinition, typeState, arrayLevel, setterQueue);
            } else if (fieldDefinition.getTypeDefinition() instanceof PrimitiveTypeDefinition) {
                ret = fieldDefinition.getTypeDefinition().newInstance(obj);
            } else if (fieldDefinition.getTypeDefinition() instanceof MapTypeDefinition) {
                ret = toMap(jsonState, obj, root, fieldDefinition, typeState, arrayLevel, setterQueue);
            } else if (obj instanceof JSONObject && fieldDefinition.getTypeDefinition() instanceof ObjectTypeDefinition) {
                ret = toObjectInternal(jsonState, (JSONObject) obj, root, fieldDefinition, typeState, arrayLevel, setterQueue);
            } else {
                throw new WMRuntimeException(MessageResource.JSON_UNKNOWN_OBJECT_TYPE, obj, obj.getClass(), fieldDefinition);
            }
        } catch (InstantiationException e) {
            throw new WMRuntimeException(e);
        } catch (IllegalAccessException e) {
            throw new WMRuntimeException(e);
        } catch (InvocationTargetException e) {
            throw new WMRuntimeException(e);
        } catch (NoSuchMethodException e) {
            throw new WMRuntimeException(e);
        }

        return ret;
    }

    private static Object toObjectInternal(JSONState jsonState, JSONObject obj, Object root, FieldDefinition fieldDefinition, TypeState typeState,
        int arrayLevel, Stack<String> setterQueue) throws InstantiationException, IllegalAccessException, InvocationTargetException,
        NoSuchMethodException {

        if (fieldDefinition == null) {
            throw new IllegalArgumentException("fieldDefinition cannot be null");
        } else if (fieldDefinition.getTypeDefinition() == null) {
            throw new WMRuntimeException(MessageResource.JSON_TYPEDEF_REQUIRED);
        } else if (!(fieldDefinition.getTypeDefinition() instanceof ObjectTypeDefinition)) {
            throw new WMRuntimeException(MessageResource.JSON_OBJECTTYPEDEF_REQUIRED, fieldDefinition.getTypeDefinition(),
                fieldDefinition.getTypeDefinition().getClass());
        }

        ObjectTypeDefinition otd = (ObjectTypeDefinition) fieldDefinition.getTypeDefinition();

        Object instance = otd.newInstance();

        for (Object entryO : obj.entrySet()) {
            Entry<?, ?> entry = (Entry<?, ?>) entryO;
            String key = (String) entry.getKey();

            FieldDefinition nestedFieldDefinition = otd.getFields().get(key);
            if (nestedFieldDefinition == null) {
                throw new WMRuntimeException(MessageResource.JSON_NO_PROP_MATCHES_KEY, key, fieldDefinition);
            }
            if (!PropertyUtils.isWriteable(instance, key)) {
                logger.warn(MessageResource.JSON_NO_WRITE_METHOD.getMessage(fieldDefinition, key));
                continue;
            }

            // setter list support
            setterQueue.push(key);
            jsonState.getSettersCalled().add(getPropertyFromQueue(setterQueue));

            Object paramValue = toObjectInternal(jsonState, entry.getValue(), root, nestedFieldDefinition, typeState, 0, setterQueue);
            PropertyUtils.setProperty(instance, key, paramValue);

            // end setter list support
            setterQueue.pop();
        }

        return instance;
    }

    private static Object toCollectionOrArray(JSONState jsonState, Object obj, Object root, FieldDefinition fieldDefinition, TypeState typeState,
        int arrayLevel, Stack<String> setterQueue) throws InstantiationException, IllegalAccessException {

        if (fieldDefinition == null) {
            throw new IllegalArgumentException("fieldDefinition cannot be null");
        }

        ListTypeDefinition ltd = fieldDefinition.getArrayTypes().get(arrayLevel);

        JSONArray jsonArray = (JSONArray) obj;
        Object listObject = ltd.newInstance(jsonArray.size());

        for (int i = 0; i < jsonArray.size(); i++) {
            Object arrayElement = toObjectInternal(jsonState, jsonArray.get(i), root, fieldDefinition, typeState, arrayLevel + 1, setterQueue);

            ltd.add(listObject, i, arrayElement);
        }

        return listObject;
    }

    @SuppressWarnings("unchecked")
    private static Map<?, ?> toMap(JSONState jsonState, Object obj, Object root, FieldDefinition fieldDefinition, TypeState typeState,
        int arrayLevel, Stack<String> setterQueue) throws InstantiationException, IllegalAccessException, InvocationTargetException,
        NoSuchMethodException {

        if (fieldDefinition == null) {
            throw new IllegalArgumentException("fieldDefinition cannot be null");
        }

        // upgrade to concrete types
        MapTypeDefinition mtd = (MapTypeDefinition) fieldDefinition.getTypeDefinition();

        // now, convert our object
        if (!(obj instanceof JSONObject)) {
            throw new WMRuntimeException(MessageResource.JSON_OBJECT_REQUIRED_FOR_MAP_CONVERSION, obj, obj != null ? obj.getClass() : obj);
        }

        JSONObject jsonObject = (JSONObject) obj;
        Map<Object, Object> ret = (Map<Object, Object>) fieldDefinition.getTypeDefinition().newInstance();

        FieldDefinition keyFD = mtd.getKeyFieldDefinition();
        FieldDefinition valueFD = mtd.getValueFieldDefinition();

        for (Object entryObject : jsonObject.entrySet()) {
            Entry<?, ?> entry = (Entry<?, ?>) entryObject;
            Object key = toObjectInternal(jsonState, entry.getKey(), root, keyFD, typeState, 0, setterQueue);
            Object value = toObjectInternal(jsonState, entry.getValue(), root, valueFD, typeState, 0, setterQueue);
            ret.put(key, value);
        }

        return ret;
    }

    protected static String getPropertyFromQueue(Stack<String> setterQueue) {
        return StringUtils.join(setterQueue, PROP_SEP);
    }
}
