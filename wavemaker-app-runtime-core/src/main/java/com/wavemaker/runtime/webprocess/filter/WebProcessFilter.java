package com.wavemaker.runtime.webprocess.filter;

import com.wavemaker.runtime.webprocess.WebProcessHelper;
import com.wavemaker.runtime.webprocess.model.WebProcess;
import org.springframework.web.filter.GenericFilterBean;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public abstract class WebProcessFilter extends GenericFilterBean {

    private String processName;

    public WebProcessFilter(String processName) {
        this.processName = processName;
    }

    @Override
    public final void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        Cookie[] cookies = request.getCookies();
        Cookie webProcessCookie = WebProcessHelper.getCookie(cookies, WebProcessHelper.WEB_PROCESS_COOKIE_NAME);
        if (webProcessCookie != null) {
            WebProcess webProcess = WebProcessHelper.decodeWebProcess(webProcessCookie.getValue());
            if (webProcess.getProcessName().equals(this.processName)) {
                String processOutput = endProcess(request, response);
                if (processOutput != null) {
                    request.setAttribute(WebProcessHelper.WEB_PROCESS_OUTPUT, processOutput);
                    request.getRequestDispatcher("/services/webprocess/end").forward(servletRequest, servletResponse);
                    return;
                }
            }
        }
        filterChain.doFilter(servletRequest, servletResponse);
    }

    public abstract String endProcess(HttpServletRequest request, HttpServletResponse response);
}
