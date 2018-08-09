package com.wavemaker.runtime.security.xss;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Use this annotation to disable XSS encoding for specific parts of application.
 * <ul>
 *     <li>Adding at Controller class level disable for all the API's in that controller</li>
 *     <li>Adding at Method level disable for that Method and all parameters</li>
 *     <li>Adding at Parameter level disable only for that parameter in that method</li>
 *     <li>Adding at any class level disable for all parameters with that type</li>
 *     <li>Adding at field level disable for that field for all API's</li>
 * </ul>
 *
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 31/7/18
 */
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.TYPE, ElementType.PARAMETER, ElementType.FIELD})
public @interface XssDisable {
}
