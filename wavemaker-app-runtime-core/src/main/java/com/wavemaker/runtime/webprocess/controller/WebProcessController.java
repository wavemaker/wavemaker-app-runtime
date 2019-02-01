package com.wavemaker.runtime.webprocess.controller;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.auth.oauth2.OAuth2Constants;
import com.wavemaker.commons.io.ClassPathFile;
import com.wavemaker.commons.json.JSONUtils;
import com.wavemaker.commons.util.WMIOUtils;
import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.app.AppFileSystem;
import com.wavemaker.runtime.webprocess.WebProcessHelper;
import com.wavemaker.runtime.webprocess.model.WebProcess;
import com.wordnik.swagger.annotations.Api;
import com.wordnik.swagger.annotations.ApiOperation;
import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.text.StringSubstitutor;
import org.apache.http.entity.ContentType;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Map;

@RestController
@Api(value = "/webprocess", description = "Exposes APIs to work with webprocess")
@RequestMapping(value = "/webprocess")
public class WebProcessController {

    private static final String WEB_PROCESS_RESPONSE_TEMPLATE = "templates/web_process_response.ftl";

    private static final int ENCRYPTION_KEY_SIZE = 128;

    private String customUrlScheme;

    @RequestMapping(value = "/prepare", method = RequestMethod.GET)
    @ApiOperation(value = "Returns a url to use to start the web process.")
    public String prepare(String hookUrl, String processName, String requestSourceType, HttpServletRequest request, HttpServletResponse response) {
        try {
            WebProcess webProcess = new WebProcess();
            webProcess.setProcessName(processName);
            webProcess.setHookUrl(hookUrl);
            webProcess.setCommunicationKey(RandomStringUtils.randomAlphanumeric(ENCRYPTION_KEY_SIZE / 8));
            webProcess.setRequestSourceType(requestSourceType);
            String webProcessJSON = WebProcessHelper.encodeWebProcess(webProcess);
            WebProcessHelper.addWebProcessCookie(request, response, webProcessJSON);
            return webProcessJSON;
        } catch (IOException e) {
            throw new WMRuntimeException(e);
        }
    }

    @RequestMapping(value = "/start", method = RequestMethod.GET)
    @ApiOperation(value = "starts a web process by redirecting the user to process hook url.")
    public void start(String process, HttpServletRequest request, HttpServletResponse response) throws Exception {
        WebProcessHelper.addWebProcessCookie(request, response, process);
        WebProcess webProcess = WebProcessHelper.decodeWebProcess(process);
        response.sendRedirect(request.getServletContext().getContextPath() + webProcess.getHookUrl());
    }

    @RequestMapping(value = "/end", method = RequestMethod.GET)
    @ApiOperation(value = "ends a web process and shows a page that has encoded output")
    public void end(HttpServletRequest request, HttpServletResponse response) throws Exception {
        Cookie cookie = WebProcessHelper.getCookie(request.getCookies(), WebProcessHelper.WEB_PROCESS_COOKIE_NAME);
        if (cookie != null) {
            WebProcess webProcess = WebProcessHelper.decodeWebProcess(cookie.getValue());
            String processOutput = (String) request.getAttribute(WebProcessHelper.WEB_PROCESS_OUTPUT);
            processOutput = WebProcessHelper.encode(webProcess.getCommunicationKey(), processOutput);
            String redirectUrl = "://services/webprocess/"+webProcess.getProcessName()+"?process_output=" + URLEncoder.encode(processOutput, WebProcessHelper.UTF_8);
            String urlScheme = "com.wavemaker.wavelens";
            if ("MOBILE".equals(webProcess.getRequestSourceType())) {
                urlScheme = getCustomUrlScheme();
            }
            Map<String, Object> input = new HashMap<>();
            input.put("appLink", urlScheme + redirectUrl);
            StringSubstitutor strSubstitutor = new StringSubstitutor(input);
            String processResponse =  strSubstitutor.replace(new ClassPathFile(WEB_PROCESS_RESPONSE_TEMPLATE).getContent().asString());
            response.setContentType(ContentType.TEXT_HTML.getMimeType());
            response.getWriter().write(processResponse);
        } else {
            throw new WMRuntimeException("Web Process cookie is not found");
        }
    }

    @RequestMapping(value = "/decode", method = RequestMethod.GET)
    @ApiOperation(value = "ends a web process and shows a page that has encoded output")
    public String decode(String encodedProcessdata, HttpServletRequest request, HttpServletResponse response) throws Exception {
        Cookie cookie = WebProcessHelper.getCookie(request.getCookies(), WebProcessHelper.WEB_PROCESS_COOKIE_NAME);
        if (cookie != null) {
            WebProcess webProcess = WebProcessHelper.decodeWebProcess(cookie.getValue());
            return WebProcessHelper.decode(webProcess.getCommunicationKey(), encodedProcessdata);
        } else {
            throw new WMRuntimeException("Web Process cookie is not found");
        }
    }


    private String getCustomUrlScheme() {
        if (customUrlScheme == null) {
            synchronized(this) {
                InputStream inputStream = null;
                try {
                    AppFileSystem appFileSystem = WMAppContext.getInstance().getSpringBean(AppFileSystem.class);
                    inputStream = appFileSystem.getWebappResource("config.json");
                    Map<String, String> configJsonObject = JSONUtils.toObject(inputStream, Map.class);
                    customUrlScheme = configJsonObject.get(OAuth2Constants.CUSTOM_URL_SCHEME);
                } catch (IOException e) {
                    throw new WMRuntimeException(e);
                } finally {
                    WMIOUtils.closeSilently(inputStream);
                }
            }
        }
        return customUrlScheme;
    }

    private String getFullPath(String relativePath, HttpServletRequest request) {
        String port = "";
        if (request.getServerPort() > 0) {
            port = ":" + request.getServerPort();
        }
        return request.getServerName() + port + request.getServletContext().getContextPath() + relativePath;
    }

}
