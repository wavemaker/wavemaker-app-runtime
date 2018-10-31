/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.util;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.query.Query;
import org.hibernate.type.AbstractStandardBasicType;

import com.wavemaker.runtime.data.model.ReferenceType;
import com.wavemaker.runtime.data.model.returns.FieldType;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;
import com.wavemaker.runtime.data.transform.WMResultTransformer;

public class HQLQueryUtils {

    public static List<ReturnProperty> extractMetaForHql(final Query query) {
        final org.hibernate.type.Type[] returnTypes = query.getReturnTypes();
        final String[] returnAliases = query.getReturnAliases();
        List<ReturnProperty> properties = new ArrayList<>(returnTypes.length);
        for (int i = 0; i < returnTypes.length; i++) {
            final org.hibernate.type.Type type = returnTypes[i];

            ReturnProperty property = new ReturnProperty();

            property.setName(WMResultTransformer.getAlias(returnAliases, i));

            FieldType fieldType = new FieldType();
            String typeRef = type.getName();
            if (type.isCollectionType()) {
                fieldType.setList(true);
            }
            if (type.isAssociationType()) {
                fieldType.setType(ReferenceType.ENTITY);
            } else {
                fieldType.setType(ReferenceType.PRIMITIVE);
            }
            if (type instanceof AbstractStandardBasicType) {
                final Class typeClass = ((AbstractStandardBasicType) type).getJavaTypeDescriptor().getJavaTypeClass();
                typeRef = typeClass.getCanonicalName();
            }

            fieldType.setTypeRef(typeRef);
            property.setFieldType(fieldType);

            if (i == 0 && (returnAliases == null || returnAliases.length == 1) && (fieldType.getType() == ReferenceType.ENTITY)) {
                // setting property name to for avoiding creating new model class
                // in case of query returning only entity.
                property.setName(null);
            }

            properties.add(property);
        }
        return properties;
    }


}
