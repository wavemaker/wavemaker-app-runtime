package com.wavemaker.runtime.report;

import com.wavemaker.runtime.service.ServiceType;

/**
 * Created by kishorer on 14/5/16.
 */
public class ReportServiceType implements ServiceType {

    public static final String TYPE_NAME = "ReportService";


    @Override
    public String getTypeName() {
        return TYPE_NAME;
    }
}
