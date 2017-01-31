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
package com.wavemaker.runtime.exception.swagger;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;

/**
 * Created by sunilp on 6/6/15.
 */
public class SwaggerException extends WMRuntimeException {

    public SwaggerException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public SwaggerException(String message, Throwable cause) {
        super(message, cause);
    }

    public SwaggerException(String message) {
        super(message);
    }
}

