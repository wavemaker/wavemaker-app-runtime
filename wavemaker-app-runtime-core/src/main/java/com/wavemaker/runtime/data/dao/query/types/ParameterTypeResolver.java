package com.wavemaker.runtime.data.dao.query.types;

import java.util.Optional;

import org.hibernate.type.Type;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 20/7/17
 */
public interface ParameterTypeResolver {

    Optional<Type> resolveType(String name);
}
