package com.wavemaker.runtime.data.interceptors;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.wavemaker.runtime.data.replacers.EntityValueReplacer;
import com.wavemaker.runtime.data.replacers.EntityValueReplacerBuilder;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 22/6/16
 */
public class InterceptorContext {

    private Map<Class<?>, EntityValueReplacer> typeVsValueOverrider;

    public InterceptorContext() {
        this.typeVsValueOverrider = new ConcurrentHashMap<>();
    }

    public EntityValueReplacer getEntityValueOverrider(Class<?> type) {
        if (!typeVsValueOverrider.containsKey(type)) {
            synchronized (type.getName().intern()) {
                if (!typeVsValueOverrider.containsKey(type)) {
                    EntityValueReplacerBuilder builder = new EntityValueReplacerBuilder();
                    typeVsValueOverrider.put(type, builder.build(type));
                }
            }
        }
        return typeVsValueOverrider.get(type);
    }
}
