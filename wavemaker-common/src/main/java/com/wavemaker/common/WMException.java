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
public abstract class WMException extends Exception {

    private static final long serialVersionUID = 1L;

    private MessageResource messageResource;

    private Object args[];

    private String detailedMessage;

    public WMException(Throwable cause) {
        super(cause);
    }

    public WMException(String message) {
        super(message);
    }

    public WMException(String message, Throwable cause) {
        super(message, cause);
    }

    public WMException(MessageResource resource) {
        this(resource.getMessageKey());
        this.messageResource = resource;
    }

    public WMException(MessageResource resource, String detailedMessage) {
        this(resource);
        this.detailedMessage = detailedMessage;
    }

    public WMException(MessageResource resource, Throwable cause) {
        this(resource.getMessageKey(), cause);
        this.messageResource = resource;
    }

    public WMException(MessageResource resource, String detailedMessage, Throwable cause) {
        this(resource, cause);
        this.detailedMessage = detailedMessage;
    }

    public WMException(MessageResource resource, Object... args) {
        this(resource.getMessageKey());
        this.messageResource = resource;
        this.args = args;
    }

    public WMException(String detailedMessage, MessageResource resource, Object... args) {
        this(resource, args);
        this.detailedMessage = detailedMessage;
    }

    public WMException(MessageResource resource, Throwable cause, Object... args) {
        this(resource.getMessageKey(), cause);
        this.messageResource = resource;
        this.args = args;
    }

    public WMException(String detailedMessage, MessageResource resource, Throwable cause, Object... args) {
        this(resource, cause, args);
        this.detailedMessage = detailedMessage;
    }

    public MessageResource getMessageResource() {
        return messageResource;
    }

    public Object[] getArgs() {
        return args;
    }
}
