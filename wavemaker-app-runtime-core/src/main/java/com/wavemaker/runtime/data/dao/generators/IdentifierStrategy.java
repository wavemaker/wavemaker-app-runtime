package com.wavemaker.runtime.data.dao.generators;

import java.util.Map;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 30/11/17
 */
public interface IdentifierStrategy<Entity, Identifier> {

    Map<String, Object> extract(Identifier identifier);
}
