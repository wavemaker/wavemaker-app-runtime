/*
 * Copyright (C) 2012-2013 CloudJee, Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.wavemaker.common;

/**
 * @author Sunil Kumar
 */
public class DeploymentException extends WMRuntimeException {

    private static final long serialVersionUID = 6041241082015545250L;

    public DeploymentException(MessageResource resource) {
        super(resource);
    }

    public DeploymentException(MessageResource resource, Throwable cause) {
        super(resource, cause);
    }

    public DeploymentException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public DeploymentException(MessageResource resource, Throwable cause, Object... args) {
        super(resource, cause, args);
    }

    public DeploymentException(String message) {
        super(message);
    }

    public DeploymentException(String message, Throwable cause) {
        super(message, cause);
    }

    public DeploymentException(String message, String detailedMessage) {
        super(message, detailedMessage);
    }

    public DeploymentException(String message, String detailedMessage, Integer msgId) {
        super(message, detailedMessage, msgId);
    }

    public DeploymentException(String message, String detailedMessage, Throwable cause) {
        super(message, detailedMessage, cause);
    }

    public DeploymentException(String message, String detailedMessage, Integer msgId, Throwable cause) {
        super(message, detailedMessage, msgId, cause);
    }

    public DeploymentException(Throwable cause) {
        super(cause);
    }
}
