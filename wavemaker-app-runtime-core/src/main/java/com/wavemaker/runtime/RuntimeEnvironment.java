package com.wavemaker.runtime;

import org.apache.commons.lang3.StringUtils;

/**
 * @author Uday Shankar
 */
public class RuntimeEnvironment {

    private static final String WMAPP_ENVIRONMENT_KEY="wmapp.environment";

    private static final String environment;

    static {
        String property = System.getProperty(WMAPP_ENVIRONMENT_KEY);
        property = (StringUtils.isNotBlank(property)) ? property : System.getenv(WMAPP_ENVIRONMENT_KEY);
        environment = (StringUtils.isNotBlank(property)) ? property : "production";
    }

    public static boolean isTestRunEnvironment() {
        return "testRun".equalsIgnoreCase(environment);
    }
}
