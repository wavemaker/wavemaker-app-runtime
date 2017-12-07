package com.wavemaker.runtime.data.annotations;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 27/11/17
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface TableTemporal {

    TemporalType[] value();

    enum TemporalType {
        SYSTEM,
        APPLICATION {
            @Override
            public String asHqlKeyword() {
                return "business_time";
            }
        };

        public String asHqlKeyword() {
            return this.name().toLowerCase() + "_time";
        }
    }
}
