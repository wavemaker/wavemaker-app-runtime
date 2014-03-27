package com.wavemaker.studio.prefab.context;

import javax.servlet.ServletContext;

import org.springframework.context.ApplicationContext;
import org.springframework.web.context.support.XmlWebApplicationContext;

import com.wavemaker.studio.prefab.core.Prefab;

/**
 * @author Dilip Kumar
 */
public class PrefabWebApplicationContext extends XmlWebApplicationContext {

    public PrefabWebApplicationContext(final Prefab prefab, final ApplicationContext parent,
                                       final ServletContext servletContext) {
        setId(prefab.getName());
        setParent(parent);
        setClassLoader(prefab.getClassLoader());
        setServletContext(servletContext);
        setDisplayName("Prefab Context [" + prefab.getName() + "]");
        setConfigLocations(new String[]{"classpath:" + prefab.getName() + "-prefab-services.xml"});
        refresh();
    }
}
