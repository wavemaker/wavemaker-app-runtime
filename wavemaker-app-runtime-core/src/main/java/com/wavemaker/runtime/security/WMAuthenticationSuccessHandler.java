/**
 * Copyright © 2015 WaveMaker, Inc.
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

import java.io.IOException;
import java.util.*;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.util.StringUtils;

import com.wavemaker.studio.common.CommonConstants;
import com.wavemaker.studio.common.model.RoleConfig;

public class WMAuthenticationSuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {

    public static final String ROLE_PREFIX = "ROLE_";
    public static final String MAIN_PAGE = "Main";
    private RequestCache requestCache = new HttpSessionRequestCache();

    public static final String LAND_PAGE_PREPEND = "#";
    public static final String ROLE_BASED_URL_PREFIX = "/index.html" + LAND_PAGE_PREPEND;

    private Map<String, RoleConfig> roleMap;

    public WMAuthenticationSuccessHandler() {
        super();
    }


    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response, Authentication authentication) throws IOException,
            ServletException {
        String redirectURL = null;
        SavedRequest savedRequest = null;
        if (!isAjaxRequest(request)) {
            super.onAuthenticationSuccess(request, response, authentication);
            return;
        } else {
            if (requestCache != null) {
                savedRequest = requestCache.getRequest(request, response);
            }
            if (savedRequest == null) {
                //TODO: this is getting the base url, but not the query params
                System.out.println("** NO saved request, using Target URL");
                String queryString = request.getQueryString();
                String redirectUrl = request.getContextPath();
                redirectURL = (queryString != null) ? redirectUrl + "/" + queryString : redirectUrl;
            } else {
                System.out.println("*** YES saved request, using redirect URL");
                redirectURL = savedRequest.getRedirectUrl();
            }

            redirectURL = getRoleBasedLandingPageUrl(redirectURL, authentication);

            String targetUrlParameter = getTargetUrlParameter();
            if (isAlwaysUseDefaultTargetUrl() || (targetUrlParameter != null && StringUtils.hasText(request.getParameter(targetUrlParameter)))) {
                System.out.println("have targetURL: " + targetUrlParameter + " Removing request");
                requestCache.removeRequest(request, response);
            }

            if (isAlwaysUseDefaultTargetUrl()) {
                redirectURL = getDefaultTargetUrl();
            }

            clearAuthenticationAttributes(request);

            if (redirectURL == null || redirectURL.isEmpty()) {
                System.out.println("No redirectUrl, throw");
                throw new IOException("Unable to determine a redirect URL");
            }
            System.out.println("redirect URL IS: " + redirectURL);
            Map<String, String> urlMap = new HashMap<String, String>();
            urlMap.put("url", redirectURL);

            request.setCharacterEncoding(CommonConstants.UTF8);
            response.setContentType("text/plain;charset=utf-8");
            response.setHeader("Cache-Control", "no-cache");
            response.setDateHeader("Expires", 0);
            response.setHeader("Pragma", "no-cache");
            //String jsonContent = "{\"url\":\"" +  redirectURL + "\"}";
            String jsonContent = new JSONObject(urlMap).toString();
            response.getWriter().print(jsonContent);
            response.getWriter().flush();
        }
    }

    private String getRoleBasedLandingPageUrl(String redirectURL, Authentication authentication) {
        final List<String> userRoles = getUserRoles(authentication.getAuthorities());
        String roleBasedPage = null;
        RoleConfig roleConfig = null;
        // iterating over userroles to find at least one role configuration.
        // Note : if it find at-least one role configuration then respective landing page will be redirected to user,else Main page will be redirected.
        for (int i = 0; i < userRoles.size(); i++) {
            String role = userRoles.get(i);
            role = role.startsWith(ROLE_PREFIX) ? role.substring(ROLE_PREFIX.length()) : role;
            roleConfig = roleMap.get(role);
            if (roleConfig != null && org.apache.commons.lang3.StringUtils.isNotBlank(roleConfig.getLandingPage())) {
               roleBasedPage = roleConfig.getLandingPage();
               break;
            }
        }

        if (roleBasedPage == null) {
            roleBasedPage = MAIN_PAGE;
        }

        redirectURL += ROLE_BASED_URL_PREFIX + roleBasedPage;
        return redirectURL;
    }

    private List<String> getUserRoles(final Collection<? extends GrantedAuthority> authorities) {
        List<String> roles = new ArrayList<>();
        for (GrantedAuthority a : authorities) {
            roles.add(a.getAuthority());
        }
        return roles;
    }

    private boolean isAjaxRequest(HttpServletRequest request) {
        return "XMLHttpRequest".equals(request.getHeader("X-Requested-With"));
    }

    public void setRoleMap(Map<String, RoleConfig> roleMap) {
        this.roleMap = roleMap;
    }
}

