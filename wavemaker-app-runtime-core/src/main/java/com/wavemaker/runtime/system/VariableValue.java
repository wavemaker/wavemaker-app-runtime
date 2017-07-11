package com.wavemaker.runtime.system;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 10/7/17
 */
@FunctionalInterface
interface VariableValue {

    Object valueFor(String variableName);
}
