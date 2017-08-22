package com.wavemaker.runtime.data.util;

import java.util.Optional;

import org.hibernate.TypeHelper;
import org.hibernate.type.Type;
import org.joda.time.LocalDateTime;

import com.wavemaker.commons.data.type.WMPersistentLocalDateTime;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 22/8/17
 */
public class HibernateUtils {

    public static Optional<Type> findType(TypeHelper typeHelper, String classOrType) {
        Optional<Type> typeOptional = Optional.ofNullable(typeHelper.basic(classOrType));

        if (!typeOptional.isPresent()) {
            if (LocalDateTime.class.getCanonicalName().equals(classOrType)) {
                typeOptional = Optional.ofNullable(typeHelper.custom(WMPersistentLocalDateTime.class));
            } else {
                typeOptional = Optional.ofNullable(typeHelper.heuristicType(classOrType));
            }
        }

        return typeOptional;
    }
}
