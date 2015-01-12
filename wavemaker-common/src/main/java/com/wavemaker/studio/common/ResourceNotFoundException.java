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
package com.wavemaker.studio.common;

/**
 * @author Uday Shankar
 */
public class ResourceNotFoundException extends WMRuntimeException {

    private static final long serialVersionUID = -3920445885731314103L;

    public ResourceNotFoundException(WMRuntimeException e) {
        super(e);
    }

    public ResourceNotFoundException(MessageResource resource) {
        super(resource);
    }

    public ResourceNotFoundException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public ResourceNotFoundException(MessageResource resource, Throwable cause, Object... args) {
        super(resource, cause, args);
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
