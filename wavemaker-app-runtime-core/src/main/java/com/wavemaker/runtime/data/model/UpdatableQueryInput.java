package com.wavemaker.runtime.data.model;

import java.util.Map;

/**
 * @author Dilip Kumar
 * @since 1/6/18
 */
public class UpdatableQueryInput extends QueryProcedureInput<Integer> {
    public UpdatableQueryInput(
            final String name, final Map<String, Object> parameters) {
        super(name, parameters, Integer.class);
    }
}
