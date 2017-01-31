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
package com.wavemaker.studio.prefab.core;

import org.apache.commons.lang3.Validate;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

/**
 * prefab class, holds a {@link ClassLoader} that can load packaged {@link Class}es.
 * <p/>
 *
 * @author Dilip Kumar
 */
public class Prefab {

    private final String name;
    private ClassLoader classLoader;

    /**
     * Creates a new <code>Prefab</code> with the specified name and classloader.
     *
     * @param name        name, usually the name of the source
     * @param classLoader {@link ClassLoader} to be used to load packaged classes
     */
    public Prefab(final String name, final ClassLoader classLoader) {
        Validate.notEmpty(name, "Prefab: Prefab name should not be empty");
        Validate.notNull(classLoader, "Prefab: ClassLoader should not be null");

        this.name = name;
        this.classLoader = classLoader;
    }

    /**
     * @return the name
     */
    public String getName() {
        return name;
    }

    /**
     * @return the class loader
     */
    public ClassLoader getClassLoader() {
        return classLoader;
    }

    public void setClassLoader(ClassLoader classLoader) {
        this.classLoader = classLoader;
    }


    @Override
    public int hashCode() {
        return new HashCodeBuilder().append(name)
                .append(classLoader)
                .toHashCode();
    }

    @Override
    public boolean equals(final Object that) {
        if (that == this) {
            return true;
        } else if (that == null || that.getClass() != this.getClass()) {
            return false;
        }

        Prefab prefab = (Prefab) that;

        return new EqualsBuilder().append(name, prefab.name)
                .append(classLoader, prefab.classLoader)
                .isEquals();
    }

    @Override
    public String toString() {
        return "Prefab{" +
                "name='" + name + '\'' +
                ", classLoader=" + classLoader +
                '}';
    }
}
