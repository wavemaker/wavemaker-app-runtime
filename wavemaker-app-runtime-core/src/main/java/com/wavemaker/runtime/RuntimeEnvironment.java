package com.wavemaker.runtime;

import org.apache.commons.lang3.StringUtils;

/**
 * @author Uday Shankar
 */
public class RuntimeEnvironment {

    private static final String environment;

    static {
        String property = System.getProperty("wmapp.environment");
        environment = (StringUtils.isNotBlank(property)) ? property : "production";
    }

    public static boolean isTestRunEnvironment() {
        return "testRun".equalsIgnoreCase(environment);
    }
}
