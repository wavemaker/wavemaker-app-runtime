package com.wavemaker.runtime.resolver;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.wavemaker.runtime.WMAppContext;

/**
 * @author Uday Shankar
 */
public class ServiceBasedPageableHandlerMethodArgumentResolver extends WMPageableHandlerMethodArgumentResolver {

    private static final Logger logger = LoggerFactory.getLogger(ServiceBasedPageableHandlerMethodArgumentResolver.class);

    @Override
    public Pageable resolveArgument(MethodParameter methodParameter, ModelAndViewContainer mavContainer,
                                    NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
        HttpServletRequest servletRequest = (HttpServletRequest) webRequest.getNativeRequest();
        String pathInfo = servletRequest.getPathInfo();
        String serviceId = null;
        if (pathInfo.indexOf("/") != -1) {
            String temp = pathInfo.substring(1);
            if (temp.indexOf("/") == -1) {
                serviceId = temp;
            } else {
                serviceId = temp.substring(0, temp.indexOf("/"));
            }
        }
        if (StringUtils.isNotBlank(serviceId)) {
            try {
                HandlerMethodArgumentResolver handlerMethodArgumentResolver = WMAppContext.getInstance().getSpringBean(serviceId + "PageableHandlerMethodArgumentResolver");
                return (Pageable) handlerMethodArgumentResolver.resolveArgument(methodParameter, mavContainer, webRequest, binderFactory);
            } catch (NoSuchBeanDefinitionException e) {
                logger.debug("No service level pageableHandlerMethodResolver found for request url {}, using the app default resolver", servletRequest.getRequestURI());
            }
        }
        return super.resolveArgument(methodParameter, mavContainer, webRequest, binderFactory);
    }
}
