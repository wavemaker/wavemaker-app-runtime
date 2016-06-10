package com.wavemaker.runtime.scheduler;

import com.wavemaker.runtime.service.reflect.ReflectServiceType;

/**
 * Created by saddhamp on 17/5/16.
 */
public class SchedulerServiceType extends ReflectServiceType {

    public static final String TYPE_NAME = "SchedulerService";

    @Override
    public String getTypeName() {
        return TYPE_NAME;
    }
}
