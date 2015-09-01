/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
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
package com.wavemaker.runtime.service;

import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

/**
 * Type manager.
 * 
 * @author Matt Small
 */
public class TypeManager {

    private Map<String, List<String>> types;

    private ServiceManager serviceManager;

    public Map<String, List<String>> getTypes() {
        return this.types;
    }

    public void setTypes(Map<String, List<String>> types) {
        this.types = types;
    }

    public ServiceManager getServiceManager() {
        return this.serviceManager;
    }

    public void setServiceManager(ServiceManager serviceManager) {
        this.serviceManager = serviceManager;
    }
}