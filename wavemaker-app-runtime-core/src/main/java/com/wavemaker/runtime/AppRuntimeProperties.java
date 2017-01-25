package com.wavemaker.runtime;

import java.io.InputStream;
import java.util.Properties;

import com.wavemaker.commons.util.IOUtils;
import com.wavemaker.commons.util.PropertiesFileUtils;

/**
 * Created by srujant on 29/12/16.
 */
public class AppRuntimeProperties {


    private static Properties properties;

    static {
        InputStream inputStream = AppRuntimeProperties.class.getClassLoader().getResourceAsStream("app.properties");
        properties = PropertiesFileUtils.loadProperties(inputStream);
        IOUtils.closeSilently(inputStream);
    }

    public static String getProperty(String key) {
        return properties.getProperty(key);
    }


}
