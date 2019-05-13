package com.wavemaker.runtime.web.listener;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.slf4j.MDC;

import com.wavemaker.runtime.RuntimeEnvironment;
import com.wavemaker.runtime.web.filter.WMRequestFilter;

/**
 * This works in conjuction with {@link LoggingInitializationListener} class which is the first class loaded in web.xml.
 * 
 * This is the last listener declared in the web.xml.
 * 
 * It removes the mdc value set by {@link LoggingInitializationListener} in its contextInitialized method as it will be the last method to be called.
 * 
 * Its contextDestroyed method is the first to be called during undeployment and it creates the mdc value which is removed in contextDestroye method of
 * {@link LoggingInitializationListener} class
 * 
 * 
 * @author Uday Shankar
 */
public class AppNameMDCStartStopListener implements ServletContextListener {
    
    @Override
    public void contextInitialized(ServletContextEvent sce) {
        if (RuntimeEnvironment.isTestRunEnvironment()) {
            MDC.remove(WMRequestFilter.APP_NAME_KEY);
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        if (RuntimeEnvironment.isTestRunEnvironment()) {
            MDC.put(WMRequestFilter.APP_NAME_KEY, sce.getServletContext().getContextPath());
        }
    }
}
