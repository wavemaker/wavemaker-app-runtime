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
package com.wavemaker.runtime.prefab.event;

import org.springframework.context.ApplicationEvent;

import com.wavemaker.runtime.prefab.core.Prefab;

/**
 * A {@link PrefabEvent} abstracts an event raised during {@link Prefab}'s lifecycle.
 * 
 * @author Frankline Francis
 */
@SuppressWarnings("serial")
public abstract class PrefabEvent extends ApplicationEvent {

    /**
     * Creates a new {@link PrefabEvent} with the specified source.
     * 
     * @param source event source
     */
    public PrefabEvent(final Object source) {
        super(source);
    }

}
