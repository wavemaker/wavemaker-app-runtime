/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
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
package com.wavemaker.runtime.rest.model;

import java.util.Date;

import org.apache.http.impl.cookie.BasicClientCookie;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Created by ArjunSahasranam on 10/9/15.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class BasicClientCookieMixIn extends BasicClientCookie {
    @JsonCreator
    public BasicClientCookieMixIn(@JsonProperty("name") final String name, @JsonProperty("value") final String value) {
        super(name, value);
    }

}
