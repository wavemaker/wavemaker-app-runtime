package com.wavemaker.runtime.report.manager;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.wavemaker.runtime.file.model.DownloadResponse;
import com.wavemaker.runtime.report.model.ReportContext;
import com.wavemaker.runtime.report.service.JasperReportGenerator;

/**
 * Created by kishorer on 2/5/16.
 */
public class ReportServiceManagerImpl implements ReportServiceManager {

    @Autowired
    private Map<String, JasperReportGenerator> reportGeneratorMap;

    public DownloadResponse generateReport(ReportContext reportContext) {
        String dataSourceType = reportContext.getDataSourceType();
        JasperReportGenerator jasperReportGenerator = reportGeneratorMap.get(dataSourceType);
        return jasperReportGenerator.generateReport(reportContext);
    }
}
