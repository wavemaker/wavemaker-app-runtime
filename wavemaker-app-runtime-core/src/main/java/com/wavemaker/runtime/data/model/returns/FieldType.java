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
package com.wavemaker.runtime.data.model.returns;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.wavemaker.runtime.data.model.ReferenceType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 26/10/16
 */
public class FieldType {

    private ReferenceType type;
    private String typeRef;

    private boolean list;
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private List<ReturnProperty> properties;

    public FieldType() {
        this.properties = new ArrayList<>();
    }

    public FieldType(final ReferenceType type, final String typeRef) {
        this();
        this.type = type;
        this.typeRef = typeRef;
    }

    public ReferenceType getType() {
        return type;
    }

    public void setType(final ReferenceType type) {
        this.type = type;
    }

    public String getTypeRef() {
        return typeRef;
    }

    public void setTypeRef(final String typeRef) {
        this.typeRef = typeRef;
    }

    public List<ReturnProperty> getProperties() {
        return properties;
    }

    public void setProperties(final List<ReturnProperty> properties) {
        this.properties = properties;
    }

    public boolean isList() {
        return list;
    }

    public void setList(final boolean list) {
        this.list = list;
    }
}
