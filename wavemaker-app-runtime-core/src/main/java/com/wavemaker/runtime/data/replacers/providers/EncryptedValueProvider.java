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
package com.wavemaker.runtime.data.replacers.providers;

import java.beans.PropertyDescriptor;
import java.lang.reflect.InvocationTargetException;
import java.util.Set;

import com.google.common.collect.Sets;
import com.wavemaker.runtime.data.replacers.ListenerContext;
import com.wavemaker.runtime.data.replacers.Scope;
import com.wavemaker.runtime.data.replacers.ValueProvider;
import com.wavemaker.runtime.util.CryptoHelper;
import com.wavemaker.commons.WMRuntimeException;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/6/16
 */
public class EncryptedValueProvider implements ValueProvider {

    private PropertyDescriptor descriptor;
    private CryptoHelper helper;

    public EncryptedValueProvider(PropertyDescriptor descriptor, CryptoHelper helper) {
        this.descriptor = descriptor;
        this.helper = helper;
    }

    @Override
    public Object getValue(final ListenerContext context) {
        try {
            final String value = (String) descriptor.getReadMethod().invoke(context.getEntity());

            return context.getPhase() == Scope.READ ? helper.decrypt(value) : helper.encrypt(value);

        } catch (IllegalAccessException | InvocationTargetException e) {
            throw new WMRuntimeException("Error while reading value", e);
        }
    }

    @Override
    public Set<Scope> scopes() {
        return Sets.newHashSet(Scope.INSERT, Scope.UPDATE, Scope.READ);
    }
}
