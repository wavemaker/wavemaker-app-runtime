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
package com.wavemaker.runtime.prefab.web;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

/**
 * @author Uday Shankar
 */
public class PrefabAwareHttpRequestWrapper extends HttpServletRequestWrapper {

    private String prefabName;

    /**
     * Creates a new {@code HttpRequest} wrapping the given request object.
     *
     * @param request the request object to be wrapped
     * @param prefabName
     */
    public PrefabAwareHttpRequestWrapper(HttpServletRequest request, String prefabName) {
        super(request);
        this.prefabName = prefabName;
    }

    @Override
    public String getPathInfo() {
        String pathInfo = super.getPathInfo();
        if (pathInfo.startsWith("/" + prefabName)) {
            return pathInfo.substring(prefabName.length() + 1);
        } else {
            return pathInfo;
        }
    }


}
