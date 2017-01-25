package com.wavemaker.runtime.data.interceptors;

import java.beans.PropertyDescriptor;
import java.io.Serializable;
import java.lang.reflect.InvocationTargetException;
import java.util.Map;

import org.hibernate.EmptyInterceptor;
import org.hibernate.type.Type;

import com.wavemaker.runtime.data.replacers.EntityValueReplacer;
import com.wavemaker.runtime.data.replacers.ListenerContext;
import com.wavemaker.runtime.data.replacers.Scope;
import com.wavemaker.commons.WMRuntimeException;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 20/6/16
 */
public class WMEntityInterceptor extends EmptyInterceptor {

    private InterceptorContext context;

    public WMEntityInterceptor() {
        this.context = new InterceptorContext();
    }

    @Override
    public void onDelete(
            final Object entity, final Serializable id, final Object[] state, final String[] propertyNames,
            final Type[] types) {
//        final EntityValueReplacer valueOverrider = getEntityValueOverrider(entity.getClass());
//        valueOverrider.apply(new ListenerContext(entity, Scope.DELETE));
    }

    @Override
    public boolean onFlushDirty(
            final Object entity, final Serializable id, final Object[] currentState, final Object[] previousState,
            final String[] propertyNames,
            final Type[] types) {
        final EntityValueReplacer valueReplacer = context.getEntityValueOverrider(entity.getClass());
        final boolean applied = valueReplacer.apply(new ListenerContext(entity, Scope.UPDATE));
        if (applied) {
            updateState(entity, currentState, propertyNames, valueReplacer.getPropertyDescriptorMap());
        }

        return applied;
    }

    @Override
    public boolean onLoad(
            final Object entity, final Serializable id, final Object[] state, final String[] propertyNames,
            final Type[] types) {
        final EntityValueReplacer valueReplacer = context.getEntityValueOverrider(entity.getClass());
        final Map<String, PropertyDescriptor> descriptorMap = valueReplacer.getPropertyDescriptorMap();
        try {
            for (int i = 0; i < propertyNames.length; i++) {
                final String propertyName = propertyNames[i];
                final PropertyDescriptor descriptor = descriptorMap.get(propertyName);
                if (descriptor != null && descriptor.getWriteMethod() != null) {
                    descriptor.getWriteMethod().invoke(entity, state[i]);
                }
            }
        } catch (IllegalAccessException | InvocationTargetException e) {
            throw new WMRuntimeException("Error while loading entity", e);
        }

        final boolean applied = valueReplacer.apply(new ListenerContext(entity, Scope.READ));
        if (applied) {
            updateState(entity, state, propertyNames, descriptorMap);
        }
        return applied;
    }

    @Override
    public boolean onSave(
            final Object entity, final Serializable id, final Object[] state, final String[] propertyNames,
            final Type[] types) {
        final EntityValueReplacer valueReplacer = context.getEntityValueOverrider(entity.getClass());
        final boolean applied = valueReplacer.apply(new ListenerContext(entity, Scope.INSERT));
        if (applied) {
            updateState(entity, state, propertyNames, valueReplacer.getPropertyDescriptorMap());
        }
        return applied;
    }

    private void updateState(
            Object entity, Object[] state, String[] propertyNames, Map<String, PropertyDescriptor>
            descriptorMap) {
        try {
            for (int i = 0; i < propertyNames.length; i++) {
                final PropertyDescriptor descriptor = descriptorMap.get(propertyNames[i]);
                if (descriptor != null && descriptor.getReadMethod() != null) {
                    final Object value = descriptor.getReadMethod().invoke(entity);
                    state[i] = value;
                }
            }
        } catch (IllegalAccessException | InvocationTargetException e) {
            throw new WMRuntimeException("Error while updating state parameters", e);
        }
    }
}
