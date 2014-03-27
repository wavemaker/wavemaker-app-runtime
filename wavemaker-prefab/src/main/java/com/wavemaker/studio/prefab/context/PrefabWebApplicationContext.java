package com.wavemaker.studio.prefab.context;

import javax.servlet.ServletContext;

import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.beans.factory.support.GenericBeanDefinition;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.support.XmlWebApplicationContext;
import org.springframework.web.servlet.DispatcherServlet;
import org.springframework.web.servlet.mvc.SimpleControllerHandlerAdapter;
import org.springframework.web.servlet.mvc.annotation.AnnotationMethodHandlerExceptionResolver;

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

        DefaultListableBeanFactory beanFactory  = (DefaultListableBeanFactory) getAutowireCapableBeanFactory();
        registerHandlerBean(beanFactory, DispatcherServlet.HANDLER_ADAPTER_BEAN_NAME,
                SimpleControllerHandlerAdapter.class);
        registerHandlerBean(beanFactory, DispatcherServlet.HANDLER_EXCEPTION_RESOLVER_BEAN_NAME,
                AnnotationMethodHandlerExceptionResolver.class);
    }

    /**
     * Registers handler bean using bean defintions from the parent context.
     *
     * @param beanName  bean name
     * @param beanClass bean class
     */
    private void registerHandlerBean(DefaultListableBeanFactory beanFactory, final String beanName, final Class<?> beanClass) {
        GenericBeanDefinition beanDefinition = new GenericBeanDefinition();

        beanDefinition.setBeanClass(beanClass);
        beanDefinition.setLazyInit(false);
        beanDefinition.setAbstract(false);

        beanFactory.registerBeanDefinition(beanName, beanDefinition);
    }
}
