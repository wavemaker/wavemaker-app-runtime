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

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 1/3/16
 */
public class QueryMetaData extends MetaData {

    @Override
    public Object constructMetadata(final List data) {
        Map<String, String> result = new HashMap<String, String>();
        if (data.size() == 0) {
            return result;
        }
        Object res = data.get(0);
        //A join result gives response an array
        if (res instanceof Object[]) {
            Object[] joinRes = (Object[]) res;
            for (Object ob : joinRes) {
                prepareBaseOnType(ob, result);
            }
        } else {
            prepareBaseOnType(res, result);
        }
        return result;
    }

    private void prepareBaseOnType(Object queryResonse, Map<String, String> result) {
        if (queryResonse instanceof Map) {
            prepareFromMap((Map) queryResonse, result);
        } else {
            prepareFromObject(queryResonse, result);
        }
    }

    private void prepareFromMap(Map queryResMap, Map result) {

        Set<Map.Entry> mapSet = queryResMap.entrySet();
        for (Map.Entry entr : mapSet) {
            String type = entr.getValue() == null ? String.class.getName() : entr.getValue().getClass().getName();
            result.put(entr.getKey().toString(), type);
        }
    }

    private void prepareFromObject(Object queryResponse, Map result) {
        Field[] fields = queryResponse.getClass().getDeclaredFields();
        for (Field field : fields) {
            String fieldName = field.getName();
            if (result.containsKey(field.getName())) {
                fieldName = queryResponse.getClass().getSimpleName() + "." + fieldName;
            }
            result.put(fieldName, field.getType().getName());
        }
    }
}
