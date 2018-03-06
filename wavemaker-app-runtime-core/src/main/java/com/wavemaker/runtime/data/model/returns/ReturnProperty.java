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

import javax.validation.constraints.NotNull;

import org.hibernate.validator.constraints.NotEmpty;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wavemaker.runtime.data.model.JavaType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 26/10/16
 */
public class ReturnProperty {

    @NotEmpty
    private String name;
    private String fieldName;

    private boolean optional;

    @NotNull
    private FieldType fieldType;

    //Needed for jackson deserialization
    public ReturnProperty() {
    }


    public ReturnProperty(final String name, final FieldType fieldType) {
        this.name = name;
        this.fieldType = fieldType;
    }

    public ReturnProperty(final String name, final String fieldName, final FieldType fieldType) {
        this.name = name;
        this.fieldName = fieldName;
        this.fieldType = fieldType;
    }

    public ReturnProperty(final ReturnProperty other) {
        this.name = other.name;
        this.fieldName = other.fieldName;
        this.optional = other.optional;
        this.fieldType = other.fieldType;
    }

    public String getName() {
        return name;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public String getFieldName() {
        return fieldName;
    }

    public void setFieldName(final String fieldName) {
        this.fieldName = fieldName;
    }

    public FieldType getFieldType() {
        return fieldType;
    }

    public void setFieldType(final FieldType fieldType) {
        this.fieldType = fieldType;
    }

    public boolean isOptional() {
        return optional;
    }

    public void setOptional(final boolean optional) {
        this.optional = optional;
    }

    @JsonIgnore
    public boolean isBlobType() {
        return JavaType.BLOB.getClassName().equals(fieldType.getTypeRef());
    }

    @Override
    public ReturnProperty clone() {
        return new ReturnProperty(this);
    }
}
