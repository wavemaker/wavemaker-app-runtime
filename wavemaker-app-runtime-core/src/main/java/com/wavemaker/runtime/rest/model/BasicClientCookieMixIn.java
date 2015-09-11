package com.wavemaker.runtime.rest.model;

import java.util.Date;

import org.apache.http.impl.cookie.BasicClientCookie;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Created by ArjunSahasranam on 10/9/15.
 */

public abstract class BasicClientCookieMixIn extends BasicClientCookie {
    @JsonCreator
    public BasicClientCookieMixIn(@JsonProperty("name") final String name, @JsonProperty("value") final String value) {
        super(name, value);
    }

}
