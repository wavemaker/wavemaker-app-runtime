package com.wavemaker.runtime;

import java.io.InputStream;
import java.util.Properties;

import com.wavemaker.studio.common.util.PropertiesFileUtils;

/**
 * Created by srujant on 29/12/16.
 */
public class AppRuntimeProperties {


    private static boolean appProxyEnabled;
    private static String appProxyHost;
    private static int appProxyPort;
    private static String appProxyUsername;
    private static String appProxyPassword;


    static {
        InputStream inputStream = AppRuntimeProperties.class.getClassLoader().getResourceAsStream("app.properties");
        Properties properties = PropertiesFileUtils.loadProperties(inputStream);
        String isEnabled = properties.getProperty("app.proxy.enabled");
        String port = properties.getProperty("app.proxy.port");
        appProxyHost = properties.getProperty("app.proxy.host");
        appProxyUsername = properties.getProperty("app.proxy.username");
        appProxyPassword = properties.getProperty("app.proxy.password");
        if (isEnabled != null && !("".equals(isEnabled))) {
            appProxyEnabled = Boolean.valueOf(isEnabled);
        }
        if (port != null && !("".equals(port))) {
            appProxyPort = Integer.valueOf(port);
        }
    }

    public static boolean isAppProxyEnabled() {
        return appProxyEnabled;
    }

    public static String getAppProxyHost() {
        return appProxyHost;
    }

    public static int getAppProxyPort() {
        return appProxyPort;
    }

    public static String getAppProxyUsername() {
        return appProxyUsername;
    }

    public static String getAppProxyPassword() {
        return appProxyPassword;
    }
}
