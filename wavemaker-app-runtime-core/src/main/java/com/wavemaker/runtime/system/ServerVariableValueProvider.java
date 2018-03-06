package com.wavemaker.runtime.system;

import java.sql.Date;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Calendar;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedCaseInsensitiveMap;

import com.wavemaker.runtime.security.SecurityService;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 10/7/17
 */
@Component
public class ServerVariableValueProvider implements VariableValueProvider {

    private final SecurityService securityService;

    private Map<String, VariableValue> keyVsValueMap;

    @Autowired
    public ServerVariableValueProvider(final SecurityService securityService) {
        this.securityService = securityService;
        keyVsValueMap = new LinkedCaseInsensitiveMap<>();

        keyVsValueMap.put("date", key -> new Date(Calendar.getInstance().getTime().getTime()));
        keyVsValueMap.put("time", key -> new Time(Calendar.getInstance().getTime().getTime()));
        keyVsValueMap.put("date_time", key -> LocalDateTime.now()); // use java LocalDateTime
        keyVsValueMap.put("timestamp", key -> new Timestamp(Calendar.getInstance().getTime().getTime()));

        keyVsValueMap.put("user_id", key -> securityService.getUserId());
        keyVsValueMap.put("user_name", key -> securityService.getUserName());
    }

    @Override
    public Object getValue(final String variableName) {
        // XXX support for custom properties
        if (keyVsValueMap.containsKey(variableName)) {
            return keyVsValueMap.get(variableName).valueFor(variableName);
        }

        throw new IllegalArgumentException("No system variable matching with given name: " + variableName);
    }

}
