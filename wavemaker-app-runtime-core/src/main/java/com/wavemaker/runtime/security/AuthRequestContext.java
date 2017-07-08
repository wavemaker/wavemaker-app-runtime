/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
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
package com.wavemaker.runtime.security;

import java.io.Serializable;

import javax.servlet.http.HttpServletRequest;

/**
 * @author Uday Shankar
 */
public class AuthRequestContext implements Serializable {

    private String username;

    private String password;

    private HttpServletRequest httpServletRequest;

    public AuthRequestContext(HttpServletRequest httpServletRequest) {
        this(null, null, httpServletRequest);
    }

    public AuthRequestContext(String username, String password, HttpServletRequest httpServletRequest) {
        this.username = username;
        this.password = password;
        this.httpServletRequest = httpServletRequest;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public HttpServletRequest getHttpServletRequest() {
        return httpServletRequest;
    }
}
