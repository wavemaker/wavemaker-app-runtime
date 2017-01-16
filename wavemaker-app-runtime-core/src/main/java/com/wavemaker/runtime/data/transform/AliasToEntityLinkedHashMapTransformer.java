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


    private AliasToEntityLinkedHashMapTransformer() {
    }

    @Override
    public Object transformTuple(Object[] tuple, String[] aliases) {
        Map result = new LinkedHashMap(tuple.length);
        for (int i = 0; i < tuple.length; i++) {
            String alias = aliases[i];
            if (alias != null) {
                result.put(alias, tuple[i]);
            }
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