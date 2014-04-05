package com.wavemaker.studio.prefab.config;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

import com.wavemaker.studio.prefab.util.PrefabConstants;

/**
 * @author Dilip Kumar
 */
@Configuration
@PropertySource("classpath:" + PrefabConstants.PREFABS_PROP_FILE)
public class PrefabsConfig {
    private static final Logger LOGGER = Logger.getLogger(PrefabsConfig.class);

    private static final String PREFAB_HOME_DIR_PROP = "prefabs.home.dir";
    private static final String PREFAB_LIB_DIR_PROP = "prefabs.lib.dir";
    private static final String PREFAB_CONFIG_DIR_PROP = "prefabs.config.dir";

    private String prefabsHomeDir;
    private String prefabLibDir;
    private String prefabConfigDir;

    @Autowired
    public void setPrefabsHomeDir(@Value("${" + PREFAB_HOME_DIR_PROP + "}") String prefabsHomeDir) {
        this.prefabsHomeDir = defaultOnEmpty(prefabsHomeDir, PrefabConstants.PREFAB_DEFAULT_DIRECTORY, PREFAB_HOME_DIR_PROP);
    }

    @Autowired
    public void setPrefabLibDir(@Value("${" + PREFAB_LIB_DIR_PROP + "}") String prefabLibDir) {
        this.prefabLibDir = defaultOnEmpty(prefabLibDir, PrefabConstants.PREFAB_DEFAULT_LIB_DIR, PREFAB_LIB_DIR_PROP);
    }

    @Autowired
    public void setPrefabConfigDir(@Value("${" + PREFAB_CONFIG_DIR_PROP + "}") String prefabConfigDir) {
        this.prefabConfigDir = defaultOnEmpty(prefabConfigDir, PrefabConstants.PREFAB_DEFAULT_CONF_DIR, PREFAB_CONFIG_DIR_PROP);
    }


    public String getPrefabsHomeDir() {
        return prefabsHomeDir;
    }

    public String getPrefabLibDir() {
        return prefabLibDir;
    }

    public String getPrefabConfigDir() {
        return prefabConfigDir;
    }

    private String defaultOnEmpty(String value, String defaultValue, String propKey) {
        if (value != null && !value.isEmpty()) {
            return value;
        }
        LOGGER.info("Property:'" + propKey + "', Not found in properties file. Using default value:" + defaultValue);
        return defaultValue;
    }
}
