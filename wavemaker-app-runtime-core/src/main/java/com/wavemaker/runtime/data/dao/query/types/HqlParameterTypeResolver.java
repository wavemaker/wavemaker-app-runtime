package com.wavemaker.runtime.data.dao.query.types;

import java.util.Optional;

import org.hibernate.type.Type;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 26/7/17
 */
public class HqlParameterTypeResolver implements ParameterTypeResolver {

    // Hibernate internally resolves the type.
    @Override
    public Optional<Type> resolveType(final String name) {
        return Optional.empty();
    }
}
