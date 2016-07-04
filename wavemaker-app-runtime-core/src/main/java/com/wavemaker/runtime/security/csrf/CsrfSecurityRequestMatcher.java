package com.wavemaker.runtime.security.csrf;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.util.matcher.RegexRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Created by kishorer on 25/8/15.
 */
public class CsrfSecurityRequestMatcher implements RequestMatcher {

    private Pattern allowedMethods = Pattern.compile("^(GET|HEAD|TRACE|OPTION)$");
    private List<RegexRequestMatcher> unprotectedMatchers;

    public CsrfSecurityRequestMatcher() {
    }

    public CsrfSecurityRequestMatcher(List<String> patterns) {
        unprotectedMatchers = new ArrayList<>(patterns.size());
        for(String pattern : patterns) {
            unprotectedMatchers.add(new RegexRequestMatcher(pattern, null));
        }
    }

    @Override
    public boolean matches(HttpServletRequest httpServletRequest) {
        if(allowedMethods.matcher(httpServletRequest.getMethod()).matches()) {
            return false;
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            return false;
        }
        if (unprotectedMatchers != null && !unprotectedMatchers.isEmpty()) {
            for(RegexRequestMatcher unprotectedMatcher : unprotectedMatchers) {
                if(unprotectedMatcher != null && unprotectedMatcher.matches(httpServletRequest))
                    return false;
            }
        }
        return true;
    }

}
