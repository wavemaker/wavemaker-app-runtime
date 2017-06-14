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

import java.util.Map;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Controller;
import org.springframework.web.context.support.SpringBeanAutowiringSupport;
import org.springframework.web.servlet.DispatcherServlet;
import org.springframework.web.servlet.HandlerAdapter;
import org.springframework.web.servlet.HandlerExceptionResolver;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.util.UrlPathHelper;
import org.springframework.web.util.WebUtils;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.prefab.context.PrefabThreadLocalContextManager;
import com.wavemaker.runtime.prefab.core.PrefabRegistry;
import com.wavemaker.runtime.prefab.util.PrefabConstants;

/**
 * Front controller to handle service requests directed at Spring prefabs. This servlet
 * receives service requests for prefabs, matches it with one of the registered contexts
 * and forwards it to the appropriate {@link Controller}.
 *
 * To integrate prefab library with a web application include the following snippet in
 * <tt>web.xml</tt>.
 *
 * <code>
 * <br/>
 * &lt;servlet&gt;
 * <br/>
 *   &lt;servlet-name&gt;prefabs&lt;/servlet-name&gt;
 * <br/>
 *   &lt;servlet-class&gt;com.wavemaker.runtime.prefab.web.PrefabControllerServlet&lt;/servlet-class&gt;
 * <br/>
 *   &lt;init-param&gt;
 * <br/>
 *       &lt;param-name&gt;contextClass&lt;/param-name&gt;
 * <br/>
 *       &lt;param-value&gt;org.springframework.web.context.support.AnnotationConfigWebApplicationContext&lt;/param-value&gt;
 * <br/>
 *   &lt;/init-param&gt;
 * <br/>
 *   &lt;init-param&gt;
 * <br/>
 *       &lt;param-name&gt;contextConfigLocation&lt;/param-name&gt;
 * <br/>
 *       &lt;param-value&gt;com.wavemaker.runtime.prefab.PrefabServletConfig&lt;/param-value&gt;
 * <br/>
 *   &lt;/init-param&gt;
 * <br/>
 *   &lt;load-on-startup&gt;1&lt;/load-on-startup&gt;
 * <br/>
 * &lt;/servlet&gt;
 * <br/>
 * &lt;servlet-mapping&gt;
 * <br/>
 *   &lt;servlet-name&gt;prefabs&lt;/servlet-name&gt;
 * <br/>
 *   &lt;url-pattern&gt;/prefabs/*&lt;/url-pattern&gt;
 * &lt;/servlet-mapping&gt;
 * </code>
 *
 * @author Dilip Kumar
 */
@SuppressWarnings("serial")
public class PrefabControllerServlet extends DispatcherServlet {

    private UrlPathHelper urlPathHelper = new UrlPathHelper();
    
    @Autowired
    private PrefabThreadLocalContextManager prefabThreadLocalContextManager;

    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        SpringBeanAutowiringSupport.processInjectionBasedOnServletContext(this,
                config.getServletContext());
    }

    /**
     * Creates a new <code>PrefabControllerServlet</code>.
     */
    public PrefabControllerServlet() {
        setDetectAllHandlerMappings(false);
        setDetectAllHandlerAdapters(false);
        setDetectAllHandlerExceptionResolvers(false);
    }

    @Override
    protected void doDispatch(final HttpServletRequest request, final HttpServletResponse response) throws Exception {
        ApplicationContext context = null;
        ClassLoader previous = null;
        try {
            context = lookupContext(request);
            HttpServletRequest updatedRequest = request;
            if (context != null) {
                prefabThreadLocalContextManager.setContext(context);
                previous = Thread.currentThread().getContextClassLoader();
                Thread.currentThread().setContextClassLoader(context.getClassLoader());
                updatedRequest = new PrefabAwareHttpRequestWrapper(request, context.getId());
            }
            super.doDispatch(updatedRequest, response);
        } finally {
            if(context != null) {
                Thread.currentThread().setContextClassLoader(previous);
            }
            prefabThreadLocalContextManager.clearContext();
        }
    }

    /**
     * Returns the qualified servlet path with prefab name.
     *
     * @param servletPath
     * @param prefabName
     * @return
     */
    private String getServletPathWithPrefabName(String servletPath, String prefabName) {
    	servletPath = (servletPath.endsWith("/") ? servletPath.substring(0, (servletPath.length() - 1)) : servletPath);
    	prefabName = (prefabName.startsWith("/") ? servletPath.substring(1) : prefabName);
    	return servletPath + "/" + prefabName;
    }

    @Override
    protected HandlerExecutionChain getHandler(final HttpServletRequest request) throws Exception {
        ApplicationContext context = lookupContext(request);

        if (context != null) {
            Map<String, HandlerMapping> handlerMappingMap = context.getBeansOfType(HandlerMapping.class);
            for (HandlerMapping hm : handlerMappingMap.values()) {
                if (logger.isTraceEnabled()) {
                    logger.trace(
                            "Testing handler map [" + hm + "] in DispatcherServlet with name '" + getServletName() + "'");
                }
                HandlerExecutionChain handler = hm.getHandler(request);
                if (handler != null) {
                    return handler;
                }
            }
        }

        return null;
    }

    /**
     * Returns the prefab name from the lookupPath i.e uri path.
     * @param lookupPath
     * @return prefab name or null, if no prefab name specified.
     */
	private String extractPrefabName(final String lookupPath) {
		if (lookupPath != null && !(lookupPath.isEmpty() || lookupPath.equals("/"))) {
			int startIndex = (lookupPath.startsWith("/") ? 1 : 0);
			int endIndex = lookupPath.indexOf("/", startIndex);
			if(endIndex != -1) {
				return lookupPath.substring(startIndex, lookupPath.indexOf("/", startIndex));
			} else {
				return lookupPath.substring(startIndex);
			}
		}
        return null;
	}

    /**
     * Looks up applicable prefab context for the given request.
     *
     *
     * @param request HTTP request object
     * @return prefab context or null, if no context is registered for the URL path
     */
	private ApplicationContext lookupContext(final HttpServletRequest request) {
        // checking if any already initialized prefab context is there.
		ApplicationContext prefabContext = (ApplicationContext) request.getAttribute(PrefabConstants.REQUEST_PREFAB_CONTEXT);
        if(prefabContext == null) {
            String urlPath = urlPathHelper.getLookupPathForRequest(request);
            String prefabName = extractPrefabName(urlPath);
            if(prefabName == null)
                throw new WMRuntimeException("invalid url for accessing prefab : " + urlPath);

            PrefabRegistry prefabRegistry = getWebApplicationContext().getBean(PrefabRegistry.class);
            prefabContext = prefabRegistry.getPrefabContext(prefabName);

            if(prefabContext == null) {
                throw new WMRuntimeException(" prefab [" + prefabName + "] does not exist in the application");
            }
            // setting prefab name in request object
            request.setAttribute(WebUtils.INCLUDE_SERVLET_PATH_ATTRIBUTE,
                    getServletPathWithPrefabName(request.getServletPath(), prefabContext.getId()));
            request.setAttribute(PrefabConstants.REQUEST_PREFAB_CONTEXT, prefabContext);
        }
        return prefabContext;
	}

    /**
     * Returns the {@link HandlerAdapter} from the prefab context.
     *
     * @param handler
     * @return
     * @throws ServletException
     */
    @Override
    protected HandlerAdapter getHandlerAdapter(final Object handler) throws ServletException {
        Map<String, HandlerAdapter> handlerAdapterMap = prefabThreadLocalContextManager.getContext().getBeansOfType(HandlerAdapter.class);
        for (HandlerAdapter ha : handlerAdapterMap.values()) {
            if (logger.isTraceEnabled()) {
                logger.trace("Testing handler adapter [" + ha + "]");
            }
            if (ha.supports(handler)) {
                return ha;
            }
        }
        throw new ServletException("No adapter for handler [" + handler +
                "]: Does your handler implement a supported interface like Controller?");
    }

    @Override
    protected ModelAndView processHandlerException(final HttpServletRequest request, final HttpServletResponse response,
                                                   final Object handler, final Exception ex) throws Exception {
		ApplicationContext context = lookupContext(request);
        ModelAndView exMv = null;
        if (context != null) {
            Map<String, HandlerExceptionResolver> handlerExceptionResolversMap = context.getBeansOfType(HandlerExceptionResolver.class);
            for (HandlerExceptionResolver handlerExceptionResolver : handlerExceptionResolversMap.values()) {
                exMv = handlerExceptionResolver.resolveException(request, response, handler, ex);
                if (exMv != null) {
                    break;
                }
            }
            if (exMv != null) {
                if (exMv.isEmpty()) {
                    return null;
                }
                if (!exMv.hasView()) {
                    exMv.setViewName(getDefaultViewName(request));
                }

                WebUtils.exposeErrorRequestAttributes(request, ex, getServletName());
                return exMv;
            }
        }

        throw ex;
    }
}
