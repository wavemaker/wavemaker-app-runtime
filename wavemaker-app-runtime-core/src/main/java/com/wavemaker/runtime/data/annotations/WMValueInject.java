package com.wavemaker.runtime.data.annotations;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import com.wavemaker.runtime.data.replacers.Scope;
import com.wavemaker.runtime.data.replacers.ValueType;

/**
 * @author Ravali Koppaka
 * @since 6/7/17
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface WMValueInject {

    ValueType type();

    String name();

    Scope[] scopes();
}