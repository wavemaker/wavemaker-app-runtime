/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.transform;

import java.util.LinkedHashMap;
import java.util.Map;

import org.hibernate.transform.AliasedTupleSubsetResultTransformer;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 27/6/16
 */
public class AliasToEntityLinkedHashMapTransformer extends AliasedTupleSubsetResultTransformer implements
        WMResultTransformer {

    public static final AliasToEntityLinkedHashMapTransformer INSTANCE = new AliasToEntityLinkedHashMapTransformer();


    AliasToEntityLinkedHashMapTransformer() {
    }

    @Override
    public Object transformTuple(Object[] tuple, String[] aliases) {
        Map<String, Object> result = new LinkedHashMap<>(tuple.length);
        for (int i = 0; i < tuple.length; i++) {
            result.put(WMResultTransformer.getAlias(aliases, i), tuple[i]);
        }
        return result;
    }

    @Override
    public Object transformFromMap(final Map<String, Object> resultMap) {
        Map<String, Object> result = resultMap;
        if (!(resultMap instanceof LinkedHashMap)) {
            result = new LinkedHashMap<>(resultMap);
        }
        return result;
    }

    @Override
    public String aliasToFieldName(final String columnName) {
        return columnName;
    }

    @Override
    public String aliasFromFieldName(final String fieldName) {
        return fieldName;
    }

    @Override
    public boolean containsField(final String fieldName) {
        return true;
    }

    @Override
    public boolean isTransformedValueATupleElement(String[] aliases, int tupleLength) {
        return false;
    }

    /**
     * Serialization hook for ensuring singleton uniqueing.
     *
     * @return The singleton instance : {@link #INSTANCE}
     */
    private Object readResolve() {
        return INSTANCE;
    }
}