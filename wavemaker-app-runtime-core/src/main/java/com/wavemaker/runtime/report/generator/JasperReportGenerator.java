package com.wavemaker.runtime.report.generator;

import com.wavemaker.runtime.file.model.DownloadResponse;
import com.wavemaker.runtime.report.model.ReportContext;

/**
 * Created by kishorer on 23/5/16.
 */
public interface JasperReportGenerator {

    /**
     * @param reportContext This object holds context information such as report-name, export-format to
     * generate the report.
     * @return DownloadResponse includes stream, contentType, fileName of generate report
     */
    DownloadResponse generateReport(ReportContext reportContext);

}
