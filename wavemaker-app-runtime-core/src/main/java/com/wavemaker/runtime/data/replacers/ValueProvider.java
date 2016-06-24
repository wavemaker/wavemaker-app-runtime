package com.wavemaker.runtime.data.replacers;

import java.util.Set;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/6/16
 */
public interface ValueProvider {

    Object getValue(ListenerContext context);

    Set<Scope> scopes();
}
