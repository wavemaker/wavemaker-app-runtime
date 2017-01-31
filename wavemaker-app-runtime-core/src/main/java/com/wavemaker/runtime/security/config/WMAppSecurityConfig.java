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
package com.wavemaker.runtime.security.config;

import com.wavemaker.commons.model.security.RolesConfig;
import com.wavemaker.commons.model.security.CSRFConfig;
import com.wavemaker.commons.model.security.LoginConfig;
import com.wavemaker.commons.model.security.RememberMeConfig;
import com.wavemaker.commons.model.security.SSLConfig;
import com.wavemaker.commons.model.security.XSSConfig;

/**
 * @author Ed Callahan
 *
 *         Stores security settings within project-security.xml
 *         No logic function here.
 */
public class WMAppSecurityConfig {

    private boolean enforceSecurity;

    private LoginConfig loginConfig;

    private RolesConfig rolesConfig;

    private RememberMeConfig rememberMeConfig;

    private SSLConfig sslConfig;

    private XSSConfig xssConfig;

    private CSRFConfig csrfConfig;

    public boolean isEnforceSecurity() {
        return enforceSecurity;
    }

    public void setEnforceSecurity(boolean enforceSecurity) {
        this.enforceSecurity = enforceSecurity;
    }

    public RolesConfig getRolesConfig() {
        return rolesConfig;
    }

    public void setRolesConfig(RolesConfig rolesConfig) {
        this.rolesConfig = rolesConfig;
    }

    public LoginConfig getLoginConfig() {
        return loginConfig;
    }

    public void setLoginConfig(final LoginConfig loginConfig) {
        this.loginConfig = loginConfig;
    }

    public RememberMeConfig getRememberMeConfig() {
        return rememberMeConfig;
    }

    public void setRememberMeConfig(final RememberMeConfig rememberMeConfig) {
        this.rememberMeConfig = rememberMeConfig;
    }

    public SSLConfig getSslConfig() {
        return sslConfig;
    }

    public void setSslConfig(final SSLConfig sslConfig) {
        this.sslConfig = sslConfig;
    }

    public XSSConfig getXssConfig() {
        return xssConfig;
    }

    public void setXssConfig(final XSSConfig xssConfig) {
        this.xssConfig = xssConfig;
    }

    public CSRFConfig getCsrfConfig() {
        return csrfConfig;
    }

    public void setCsrfConfig(final CSRFConfig csrfConfig) {
        this.csrfConfig = csrfConfig;
    }

    @Override
    public String toString() {
        return "WMAppSecurityConfig{" +
                "enforceSecurity=" + enforceSecurity +
                ", loginConfig=" + loginConfig +
                ", rememberMeConfig=" + rememberMeConfig +
                ", sslConfig=" + sslConfig +
                ", xssConfig=" + xssConfig +
                ", csrfConfig=" + csrfConfig +
                '}';
    }
}
