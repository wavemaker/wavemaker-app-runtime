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
package com.wavemaker.common;

/**
 * @author Sunil Kumar
 */
public class FileFormatNotSupportedException extends FormatNotSupportedException{

    public FileFormatNotSupportedException(MessageResource resource) {
        super(resource);
    }

    public FileFormatNotSupportedException(MessageResource resource, Throwable cause) {
        super(resource, cause);
    }

    public FileFormatNotSupportedException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public FileFormatNotSupportedException(MessageResource resource, Throwable cause, Object... args) {
        super(resource, cause, args);
    }

    public FileFormatNotSupportedException(String message) {
        super(message);
    }

    public FileFormatNotSupportedException(String message, Throwable cause) {
        super(message, cause);
    }

    public FileFormatNotSupportedException(String message, String detailedMessage) {
        super(message, detailedMessage);
    }

    public FileFormatNotSupportedException(String message, String detailedMessage, Integer msgId) {
        super(message, detailedMessage, msgId);
    }

    public FileFormatNotSupportedException(String message, String detailedMessage, Throwable cause) {
        super(message, detailedMessage, cause);
    }

    public FileFormatNotSupportedException(String message, String detailedMessage, Integer msgId, Throwable cause) {
        super(message, detailedMessage, msgId, cause);
    }

    public FileFormatNotSupportedException(Throwable cause) {
        super(cause);
    } 
}
