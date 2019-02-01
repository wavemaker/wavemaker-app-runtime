package com.wavemaker.runtime.webprocess.filter;

import com.wavemaker.runtime.webprocess.WebProcessHelper;
import net.sf.json.JSONObject;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class LoginProcessFilter extends WebProcessFilter {

    public LoginProcessFilter() {
        super("LOGIN");
    }

    @Override
    public String endProcess(HttpServletRequest request, HttpServletResponse response) {
        SecurityContext ctx = SecurityContextHolder.getContext();
        if (ctx != null)  {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                JSONObject output = new JSONObject();
                for (Cookie c : request.getCookies()) {
                    if (c.getValue() != null
                            && !WebProcessHelper.WEB_PROCESS_COOKIE_NAME.equalsIgnoreCase(c.getName())) {
                        output.put(c.getName(), c.getValue());
                    }
                }
                return output.toString();
            }
        }
        return null;
    }
}
