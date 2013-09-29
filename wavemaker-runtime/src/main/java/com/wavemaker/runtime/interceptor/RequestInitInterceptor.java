package com.wavemaker.runtime.interceptor;

import com.activegrid.runtime.AGRuntime;
import com.wavemaker.json.JSONState;
import com.wavemaker.json.type.reflect.converters.DateTypeDefinition;
import com.wavemaker.json.type.reflect.converters.FileTypeDefinition;
import com.wavemaker.runtime.RuntimeAccess;
import com.wavemaker.runtime.server.InternalRuntime;
import com.wavemaker.runtime.server.json.converters.BlobTypeDefinition;
import com.wavemaker.runtime.server.json.converters.ClobTypeDefinition;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.sql.Blob;
import java.sql.Clob;

/**
 * @author Uday Shankar
 */
public class RequestInitInterceptor implements HandlerInterceptor {


    private RuntimeAccess runtimeAccess;

    private InternalRuntime internalRuntime;

    private AGRuntime runtime;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        preHandle(request, response, runtimeAccess, internalRuntime, runtime);
        return true;
    }

    public static void preHandle(HttpServletRequest request, HttpServletResponse response, RuntimeAccess runtimeAccess, InternalRuntime internalRuntime, AGRuntime runtime) {
        RuntimeAccess.setRuntimeBean(runtimeAccess);
        InternalRuntime.setInternalRuntimeBean(internalRuntime);

        // when you remove this, also remove the SuppressWarnings anno
        AGRuntime.setRuntimeBean(runtime);

        runtimeAccess.setRequest(request);
        runtimeAccess.setResponse(response);
        initializeRuntimeController(request, internalRuntime);
    }

    /**
     * Perform runtime initialization, after the base runtime has been initialized.
     *
     * @param request The current request.
     * @param internalRuntime
     */
    private static void initializeRuntimeController(HttpServletRequest request, InternalRuntime internalRuntime) {
        JSONState jsonConfig = createJSONState();
        internalRuntime.setJSONState(jsonConfig);
    }

    /**
     * Create the default JSONState.
     *
     * @return
     */
    public static JSONState createJSONState() {

        JSONState jsonState = new JSONState();

        jsonState.setCycleHandler(JSONState.CycleHandler.NO_PROPERTY);

        // value conversions
        jsonState.getTypeState().addType(new DateTypeDefinition(java.util.Date.class));
        jsonState.getTypeState().addType(new DateTypeDefinition(java.sql.Date.class));
        jsonState.getTypeState().addType(new DateTypeDefinition(java.sql.Timestamp.class));
        jsonState.getTypeState().addType(new DateTypeDefinition(java.sql.Time.class));

        jsonState.getTypeState().addType(new FileTypeDefinition(File.class));
        jsonState.getTypeState().addType(new BlobTypeDefinition(Blob.class));
        jsonState.getTypeState().addType(new ClobTypeDefinition(Clob.class));

        return jsonState;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
    }

    public RuntimeAccess getRuntimeAccess() {
        return runtimeAccess;
    }

    public void setRuntimeAccess(RuntimeAccess runtimeAccess) {
        this.runtimeAccess = runtimeAccess;
    }

    public InternalRuntime getInternalRuntime() {
        return internalRuntime;
    }

    public void setInternalRuntime(InternalRuntime internalRuntime) {
        this.internalRuntime = internalRuntime;
    }

    public AGRuntime getRuntime() {
        return runtime;
    }

    public void setRuntime(AGRuntime runtime) {
        this.runtime = runtime;
    }
}
