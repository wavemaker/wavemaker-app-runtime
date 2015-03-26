package com.wavemaker.runtime.feed;

import com.wavemaker.runtime.service.reflect.ReflectServiceType;

/**
 * Created by sunilp on 11/3/15.
 */
public class FeedServiceType extends ReflectServiceType {

    public static final String TYPE_NAME = "FeedService";

    @Override
    public String getTypeName() {
        return TYPE_NAME;
    }
}