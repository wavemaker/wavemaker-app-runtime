package com.wavemaker.runtime.data.util;

import java.io.IOException;

import org.springframework.core.type.classreading.MetadataReader;
import org.springframework.core.type.classreading.MetadataReaderFactory;
import org.springframework.core.type.filter.TypeFilter;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 2/1/18
 */
public class NegatingTypeFilter implements TypeFilter {

    private final TypeFilter target;

    public NegatingTypeFilter(final TypeFilter target) {
        this.target = target;
    }

    @Override
    public boolean match(
            final MetadataReader metadataReader, final MetadataReaderFactory metadataReaderFactory) throws IOException {
        return !target.match(metadataReader, metadataReaderFactory);
    }
}
