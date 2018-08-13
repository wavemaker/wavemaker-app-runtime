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
package com.wavemaker.runtime.security.model;

import java.util.Arrays;
import java.util.Map;

/**
 * Created by ArjunSahasranam on 13/1/16.
 */
public class UserInfo {
    private String userId;
    private String userName;
    private String[] userRoles;
    private String landingPage;
    private Map<String,Object> userAttributes;

    public String getUserId() {
        return userId;
    }

    public void setUserId(final String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(final String userName) {
        this.userName = userName;
    }

    public String[] getUserRoles() {
        return userRoles;
    }

    public void setUserRoles(final String[] userRoles) {
        this.userRoles = userRoles;
    }

    public String getLandingPage() {
        return landingPage;
    }

    public void setLandingPage(final String landingPage) {
        this.landingPage = landingPage;
    }

    public Map<String, Object> getUserAttributes() {
        return userAttributes;
    }

    public void setUserAttributes(Map<String, Object> userAttributes) {
        this.userAttributes = userAttributes;
    }

    @Override
    public String toString() {
        return "UserInfo{" +
                "userId='" + userId + '\'' +
                ", userName='" + userName + '\'' +
                ", userRoles=" + Arrays.toString(userRoles) +
                ", landingPage='" + landingPage + '\'' +
                '}';
    }
}
