package com.wavemaker.runtime.report.helper;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

import org.apache.commons.lang3.StringUtils;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.wavemaker.runtime.report.export.ReportExporter;
import com.wavemaker.runtime.report.model.ExportType;
import com.wavemaker.runtime.report.model.ReportContext;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.classloader.ClassLoaderUtils;
import com.wavemaker.studio.common.io.DeleteTempFileOnCloseInputStream;
import com.wavemaker.studio.common.util.IOUtils;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.design.JasperDesign;
import net.sf.jasperreports.engine.xml.JRXmlLoader;

/**
 * Created by kishorer on 18/5/16.
 */
public class JasperReportHelper {

    public static final String REPORT_FILE_SUFFIX = "_Report.jrxml";

    private final Cache<String, JasperReport> jasperReportCache = CacheBuilder.newBuilder().expireAfterAccess(10, TimeUnit.MINUTES).build();

    private static final JasperReportHelper INSTANCE = new JasperReportHelper();

    private JasperReportHelper() {
    }

    public static JasperReportHelper getInstance() {
        return INSTANCE;
    }

    public JasperReport compileReport(final String reportName) {
        try {
            return jasperReportCache.get(reportName, new Callable<JasperReport>() {
                @Override
                public JasperReport call() throws Exception {
                    InputStream inputStream = loadReportTemplateXml(reportName);
                    return compileReport(inputStream);
                }
            });
        } catch (ExecutionException e) {
            throw new WMRuntimeException(e);
        }
    }

    public InputStream exportAsStream(ReportContext reportContext) {
        try {
            ExportType reportExportType = ExportType.PDF;
            String exportType = reportContext.getExportType();
            if (StringUtils.isNotBlank(exportType)) {
                reportExportType = ExportType.getExportTypeByValue(exportType);
            }
            String reportName = reportContext.getReportName();
            JasperReport jasperReport = compileReport(reportName);
            JasperPrint jasperPrint = fillTheReport(jasperReport, reportContext.getParameters());
            File tempFile = File.createTempFile(reportName + "_temp.", reportExportType.getExtension());
            ReportExporter reportExporter = reportExportType.getReportExporter();
            reportExporter.exportToFile(jasperPrint, tempFile);
            return new DeleteTempFileOnCloseInputStream(tempFile);
        } catch (JRException e) {
            throw new WMRuntimeException(e);
        } catch (IOException e) {
            throw new WMRuntimeException(e);
        }
    }

    private InputStream loadReportTemplateXml(String reportName) {
        String reportTemplateFile = getReportTemplateFileName(reportName);
        return ClassLoaderUtils.getResourceAsStream(reportTemplateFile);
    }

    private JasperReport compileReport(InputStream xmlInputStream) {
        try {
            JasperDesign jasperDesign = JRXmlLoader.load(xmlInputStream);
            return JasperCompileManager.compileReport(jasperDesign);
        } catch (JRException e) {
            throw new WMRuntimeException(e);
        } finally {
            IOUtils.closeSilently(xmlInputStream);
        }
    }

    private JasperPrint fillTheReport(JasperReport jasperReport, Map<String, Object> parameters) {
        try {
            return JasperFillManager.fillReport(jasperReport, parameters);
        } catch (JRException e) {
            throw new WMRuntimeException(e);
        }
    }

    private String getReportTemplateFileName(String reportName) {
        return reportName + REPORT_FILE_SUFFIX;
    }
}
