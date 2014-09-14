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
 * @author Simon Toens
 */
public class WMRuntimeException extends RuntimeException {

    private MessageResource messageResource;

    private Object args[];

    private String detailedMessage;

    public WMRuntimeException(WMRuntimeException e) {
        super(e.getMessage(), e);
        this.messageResource = e.messageResource;
        this.args = e.args;
        this.detailedMessage = e.detailedMessage;
    }

    public WMRuntimeException(MessageResource resource) {
        this(resource.getMessageKey());
        this.messageResource = resource;
    }

    public WMRuntimeException(String detailedMessage, MessageResource resource) {
        this(resource);
        this.detailedMessage = detailedMessage;
    }

    public WMRuntimeException(MessageResource resource, Throwable cause) {
        this(resource, cause, null);
    }

    public WMRuntimeException(MessageResource resource, String detailedMessage, Throwable cause) {
        this(resource, detailedMessage, cause, null);
    }

    public WMRuntimeException(MessageResource resource, Object... args) {
        this(resource.getMessageKey());
        this.messageResource = resource;
        this.args = args;
    }

    public WMRuntimeException(String detailedMessage, MessageResource resource, Object... args) {
        this(resource, args);
        this.detailedMessage = detailedMessage;
    }

    public WMRuntimeException(MessageResource resource, Throwable cause, Object... args) {
        this(resource.getMessageKey(), cause);
        this.messageResource = resource;
        this.args = args;
    }

    public WMRuntimeException(MessageResource resource, String detailedMessage, Throwable cause, Object... args) {
        this(resource, cause, args);
        this.detailedMessage = detailedMessage;
    }

    public WMRuntimeException(String message) {
        super(message);
    }

    public WMRuntimeException(Throwable cause) {
        super(cause);
    }

    public WMRuntimeException(String message, Throwable cause) {
        super(message, cause);
        this.detailedMessage = message;
    }

    public MessageResource getMessageResource() {
        return messageResource;
    }

    public Object[] getArgs() {
        return args;
    }

    public String getDetailedMessage() {
        return detailedMessage;
    }
}
