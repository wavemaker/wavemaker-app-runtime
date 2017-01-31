/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
