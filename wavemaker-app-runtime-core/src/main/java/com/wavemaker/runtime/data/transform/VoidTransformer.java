package com.wavemaker.runtime.data.transform;

import java.util.Map;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/2/17
 */
public class VoidTransformer extends AliasToEntityLinkedHashMapTransformer {

    @Override
    public Object transformTuple(final Object[] tuple, final String[] aliases) {
        return null;
    }

    @Override
    public Object transformFromMap(final Map<String, Object> resultMap) {
        return null;
    }
}
