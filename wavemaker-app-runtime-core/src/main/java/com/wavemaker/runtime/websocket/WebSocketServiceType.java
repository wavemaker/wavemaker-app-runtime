package com.wavemaker.runtime.websocket;

import com.wavemaker.runtime.service.reflect.ReflectServiceType;

/**
 * Created by srujant on 7/10/16.
 */

public class WebSocketServiceType extends ReflectServiceType {

    public static final String TYPE_NAME = "WebSocketService";

    @Override
    public String getTypeName() {
        return TYPE_NAME;
    }
}
