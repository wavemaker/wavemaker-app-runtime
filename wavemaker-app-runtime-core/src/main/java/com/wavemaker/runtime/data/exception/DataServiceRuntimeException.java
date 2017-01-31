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
package com.wavemaker.runtime.data.exception;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;

@SuppressWarnings("serial")
public class DataServiceRuntimeException extends WMRuntimeException {

    public DataServiceRuntimeException(String msg) {
        super(msg);
    }

    public DataServiceRuntimeException(Throwable th) {
        super(th);
    }

    public DataServiceRuntimeException(String msg, Throwable th) {
        super(msg, th);
    }

    public DataServiceRuntimeException(Throwable th, MessageResource resource, Object... args) {
        super(resource, th, args);
    }

    public DataServiceRuntimeException(MessageResource resource, Object... args) {
        super(resource, args);
    }

}
