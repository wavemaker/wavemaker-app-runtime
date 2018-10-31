package com.wavemaker.runtime.app;

import java.io.InputStream;
import java.util.Set;

import javax.servlet.ServletContext;

import org.springframework.web.context.ServletContextAware;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.ResourceNotFoundException;

/**
 * Provides a virtual files system for accessing resources of the application.
 *
 * @author Kishore Routhu on 21/6/17 3:12 PM.
 */
public class AppFileSystem implements ServletContextAware {

    private ServletContext context;

    @Override
    public void setServletContext(ServletContext servletContext) {
        this.context = servletContext;
    }

    public String getAppContextRoot() {
        return this.context.getRealPath("/");
    }

    public InputStream getClasspathResourceStream(String resourcePath) {
        return context.getClassLoader().getResourceAsStream(resourcePath);
    }

    public InputStream getWebappResource(String resourcePath) {
        InputStream resourceStream = context.getResourceAsStream(resourcePath);
        if (resourceStream == null) {
            throw new ResourceNotFoundException(MessageResource.create("com.wavemaker.runtime.requested.resource.not.found"), resourcePath);
        }
        return resourceStream;
    }

    public Set<String> getWebappI18nLocaleFileNames() {
        Set<String> resourcePaths = context.getResourcePaths("/resources/i18n");
        if (resourcePaths == null) {
            throw new ResourceNotFoundException(MessageResource.create("com.wavemaker.runtime.requested.resource.not.found"));
        }
        return resourcePaths;
    }
}
