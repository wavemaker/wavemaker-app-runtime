package com.wavemaker.runtime.data.replacers;

import java.beans.PropertyDescriptor;
import java.util.List;
import java.util.Map;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/6/16
 */
public class EntityValueReplacer {

    private final Map<String, PropertyDescriptor> propertyDescriptorMap;
    private final Map<Scope, List<FieldValueReplacer>> phaseVsOverridersMap;

    public EntityValueReplacer(
            final Map<String, PropertyDescriptor> propertyDescriptorMap,
            final Map<Scope, List<FieldValueReplacer>> phaseVsOverridersMap) {
        this.propertyDescriptorMap = propertyDescriptorMap;
        this.phaseVsOverridersMap = phaseVsOverridersMap;
    }

    public boolean apply(ListenerContext context) {
        boolean applied = false;
        if (!phaseVsOverridersMap.get(context.getPhase()).isEmpty()) {
            for (final FieldValueReplacer overrider : phaseVsOverridersMap.get(context.getPhase())) {
                overrider.apply(context);
                applied = true;
            }
        }
        return applied;
    }

    public Map<String, PropertyDescriptor> getPropertyDescriptorMap() {
        return propertyDescriptorMap;
    }
}
