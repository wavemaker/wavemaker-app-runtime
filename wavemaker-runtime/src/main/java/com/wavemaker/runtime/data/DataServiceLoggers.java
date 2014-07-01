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
package com.wavemaker.runtime.data;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Simon Toens
 */
public class DataServiceLoggers {

    private DataServiceLoggers() {
    }

    public static final Logger taskLogger = LoggerFactory.getLogger("com.wavemaker.runtime.data.work");

    public static final Logger transactionLogger = LoggerFactory.getLogger("com.wavemaker.runtime.data.tx");

    public static final Logger eventLogger = LoggerFactory.getLogger("com.wavemaker.runtime.data.event");

    public static final Logger metaDataLogger = LoggerFactory.getLogger("com.wavemaker.data.metadata");

    public static final Logger connectionLogger = LoggerFactory.getLogger("com.wavemaker.data.connection");

    public static final Logger fileControllerLogger = LoggerFactory.getLogger("com.wavemaker.runtime.fileController");
}
