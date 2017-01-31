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

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Properties;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

/**
 * Created by nileshk on 16/12/14.
 */
public class DemoUserDetailsManager extends InMemoryUserDetailsManager {

    public DemoUserDetailsManager() {
        super(Collections.EMPTY_LIST);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserDetails userDetails = super.loadUserByUsername(username);
        return new WMUser(userDetails.getUsername(), userDetails.getUsername(), userDetails.getPassword(), userDetails.getUsername(), 1, true, true, true,
                true, userDetails.getAuthorities(), System.currentTimeMillis());
    }

    public void setUsers(List<WMUser> users) {
        for (WMUser user : users) {
            createUser(user);
        }
    }
}
