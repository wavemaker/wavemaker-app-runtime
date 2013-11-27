package com.wavemaker.runtime;

import org.codehaus.jackson.map.DeserializationConfig;
import org.codehaus.jackson.map.ObjectMapper;

public class WMObjectMapper extends ObjectMapper {
    public WMObjectMapper() {
        configure(DeserializationConfig.Feature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }
}
