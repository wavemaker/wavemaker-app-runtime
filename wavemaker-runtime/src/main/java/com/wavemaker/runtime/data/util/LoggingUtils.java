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
package com.wavemaker.runtime.data.util;

import com.wavemaker.common.MessageResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * DataService logging convenience methods.
 * 
 * @author Simon Toens
 */
public class LoggingUtils {

    private static final Logger defaultLogger = LoggerFactory.getLogger("com.wavemaker.runtime.data");

    private LoggingUtils() {
    }

    /**
     * Logger error when it is impossible to roll back the current tx.
     */
    public static void logCannotRollbackTx(Throwable th) {
        logCannotRollbackTx(defaultLogger, th);
    }

    public static void logCannotRollbackTx(String loggerName, Throwable th) {
        logCannotRollbackTx(LoggerFactory.getLogger(loggerName), th);
    }

    public static void logCannotRollbackTx(Logger logger, Throwable th) {
        logger.error(MessageResource.CANNOT_ROLLBACK_TX.getMessage(), th);
    }

}
