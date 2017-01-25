package com.wavemaker.runtime.data.replacers;

import java.beans.PropertyDescriptor;
import java.lang.reflect.InvocationTargetException;

import com.wavemaker.commons.WMRuntimeException;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/6/16
 */
public class FieldValueReplacer {

    private final PropertyDescriptor descriptor;
    private final ValueProvider provider;


    public FieldValueReplacer(final PropertyDescriptor descriptor, final ValueProvider provider) {
        this.descriptor = descriptor;
        this.provider = provider;
    }

    public void apply(ListenerContext context) {
        try {
            descriptor.getWriteMethod().invoke(context.getEntity(), provider.getValue(context));
        } catch (IllegalAccessException | InvocationTargetException e) {
            throw new WMRuntimeException("Error while overriding property value", e);
        }
    }

}
