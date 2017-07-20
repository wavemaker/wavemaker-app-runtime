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
package com.wavemaker.runtime.report.helper;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.classloader.ClassLoaderUtils;
import com.wavemaker.commons.io.DeleteTempFileOnCloseInputStream;
import com.wavemaker.commons.util.WMIOUtils;
import com.wavemaker.runtime.report.export.ReportExporter;
import com.wavemaker.runtime.report.model.ReportContext;
import com.wavemaker.runtime.report.model.ReportExportType;
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
            return jasperReportCache.get(reportName, () -> {
                InputStream inputStream = loadReportTemplateXml(reportName);
                return compileReport(inputStream);
            });
        } catch (ExecutionException e) {
            throw new WMRuntimeException(e);
        }
    }

    public InputStream exportAsStream(ReportContext reportContext) {
        try {
            ReportExportType reportExportType = reportContext.getReportExportType();
            String reportName = reportContext.getReportName();
            JasperReport jasperReport = compileReport(reportName);
            JasperPrint jasperPrint = fillTheReport(jasperReport, reportContext.getParameters());
            File tempFile = File.createTempFile(reportName + "_temp.", reportExportType.getExtension());
            ReportExporter reportExporter = reportExportType.getReportExporter();
            reportExporter.exportToFile(jasperPrint, tempFile);
            return new DeleteTempFileOnCloseInputStream(tempFile);
        } catch (JRException | IOException e) {
            throw new WMRuntimeException(e);
        }
    }

    private InputStream loadReportTemplateXml(String reportName) {
        String reportTemplateFile = getReportTemplateFileName(reportName);
        return ClassLoaderUtils.getResourceAsStream(reportTemplateFile);
    }

    public JasperReport compileReport(InputStream xmlInputStream) {
        try {
            JasperDesign jasperDesign = JRXmlLoader.load(xmlInputStream);
            return JasperCompileManager.compileReport(jasperDesign);
        } catch (JRException e) {
            throw new WMRuntimeException(e);
        } finally {
            WMIOUtils.closeSilently(xmlInputStream);
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
