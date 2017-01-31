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
package com.wavemaker.runtime.javaservice;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.runtime.service.annotations.ExposeToClient;
import com.wavemaker.runtime.service.annotations.HideFromClient;

/**
 * @author Michael Kantor
 */
@ExposeToClient
@Deprecated
public class JavaServiceSuperClass {

    public static final int FATAL = 0;

    public static final int ERROR = 1;

    public static final int WARN = 2;

    public static final int INFO = 3;

    public static final int DEBUG = 4;

    private static final Logger logger = LoggerFactory.getLogger(JavaServiceSuperClass.class);

    public JavaServiceSuperClass() {
    }

    public JavaServiceSuperClass(int logLevel) {
    }

    protected void log(int level, String message, Exception e) {
        switch (level) {
            case DEBUG:
                this.logger.debug(message, e);
                break;
            case ERROR:
                this.logger.error(message, e);
                break;
            case INFO:
                this.logger.info(message, e);
                break;
            case WARN:
                this.logger.warn(message, e);
                break;
            case FATAL:
                this.logger.error(message, e);
                break;
        }
    }

    protected void log(int level, String message) {
        switch (level) {
            case DEBUG:
                this.logger.debug(message);
                break;
            case ERROR:
                this.logger.error(message);
                break;
            case INFO:
                this.logger.info(message);
                break;
            case WARN:
                this.logger.warn(message);
                break;
            case FATAL:
                this.logger.error(message);
                break;
        }
    }

    @HideFromClient
    public void setLogLevel(int level) {
    }
}
