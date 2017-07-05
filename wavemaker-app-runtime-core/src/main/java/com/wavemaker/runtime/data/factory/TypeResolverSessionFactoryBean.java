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
package com.wavemaker.runtime.data.factory;

import org.hibernate.SessionFactory;
import org.springframework.orm.hibernate5.LocalSessionFactoryBean;
import org.springframework.orm.hibernate5.LocalSessionFactoryBuilder;

import com.wavemaker.runtime.data.CustomType;

/**
 * Created by sunilp on 26/7/15.
 */
public class TypeResolverSessionFactoryBean extends LocalSessionFactoryBean {

    private CustomType[] customTypes;

    @Override
    protected SessionFactory buildSessionFactory(LocalSessionFactoryBuilder sfb) {
        if(customTypes != null) {
            registerCustomTypes(sfb);
        }
        return sfb.buildSessionFactory();
    }

    protected void registerCustomTypes(LocalSessionFactoryBuilder sfb) {
        for (CustomType customType : customTypes) {
            sfb.registerTypeOverride(customType.getType(), customType.getKeys());
        }
    }

    public void setCustomTypes(CustomType[] customTypes) {
        this.customTypes = customTypes;
    }
}
