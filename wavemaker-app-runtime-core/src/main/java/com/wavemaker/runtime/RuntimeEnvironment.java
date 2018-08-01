/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime;

import org.apache.commons.lang3.StringUtils;

/**
 * @author Uday Shankar
 */
public class RuntimeEnvironment {

    private RuntimeEnvironment(){}

    private static final String WMAPP_ENVIRONMENT_KEY = "wmapp.environment";
    private static final String WM_STUDIO_URL = "wm.studioUrl";

    private static final String ENVIRONMENT;
    private static final String STUDIOURL;

    static {
        String property = System.getProperty(WMAPP_ENVIRONMENT_KEY);
        property = StringUtils.isNotBlank(property) ? property : System.getenv(WMAPP_ENVIRONMENT_KEY);
        ENVIRONMENT = StringUtils.isNotBlank(property) ? property : "production";

        String studioUrlValue = System.getProperty(WM_STUDIO_URL);
        STUDIOURL = StringUtils.isNotBlank(studioUrlValue) ? studioUrlValue : System.getenv(WM_STUDIO_URL);
    }

    public static boolean isTestRunEnvironment() {
        return "testRun".equalsIgnoreCase(ENVIRONMENT);
    }

    public static String getStudioUrl() {
        return isTestRunEnvironment() ? STUDIOURL : null;
    }
}
