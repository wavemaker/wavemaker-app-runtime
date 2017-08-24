package com.wavemaker.runtime.data.replacers.providers;

import org.junit.Test;

import com.wavemaker.commons.util.Tuple;

import static org.junit.Assert.assertEquals;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 12/7/17
 */
public class VariableTypeTest {

    @Test
    public void fromAppVariableName() throws Exception {
        final Tuple.Two<VariableType, String> result = VariableType
                .fromVariableName("APP_ENVIRONMENT__myProperty__name");
        assertEquals(VariableType.APP_ENVIRONMENT, result.v1);
        assertEquals("myProperty", result.v2);
    }

    @Test
    public void fromServerVariableName() throws Exception {
        final Tuple.Two<VariableType, String> result = VariableType
                .fromVariableName("SERVER__time__name");
        assertEquals(VariableType.SERVER, result.v1);
        assertEquals("time", result.v2);
    }

    @Test
    public void fromPromptVariableName() throws Exception {
        final Tuple.Two<VariableType, String> result = VariableType
                .fromVariableName("name");
        assertEquals(VariableType.PROMPT, result.v1);
        assertEquals("name", result.v2);
    }

}