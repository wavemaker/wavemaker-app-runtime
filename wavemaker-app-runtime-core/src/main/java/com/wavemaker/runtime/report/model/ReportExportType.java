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
package com.wavemaker.runtime.report.model;

import com.wavemaker.runtime.report.export.CsvReportExporter;
import com.wavemaker.runtime.report.export.DocxReportExporter;
import com.wavemaker.runtime.report.export.PdfReportExporter;
import com.wavemaker.runtime.report.export.ReportExporter;
import com.wavemaker.runtime.report.export.XmlReportExporter;

/**
 * Created by kishorer on 18/5/16.
 */
public enum ReportExportType {

    CSV("csv", ".csv", new CsvReportExporter()),
    DOCX("docx", ".docx", new DocxReportExporter()),
    PDF("pdf", ".pdf", new PdfReportExporter()),
    XML("xml", ".xml", new XmlReportExporter());

    ReportExportType(String value, String extension, ReportExporter reportExporter) {
        this.value = value;
        this.extension = extension;
        this.reportExporter = reportExporter;
    }

    private String value;
    private String extension;
    private ReportExporter reportExporter;

    public String getValue() {
        return value;
    }

    public String getExtension() {
        return extension;
    }

    public ReportExporter getReportExporter() {
        return reportExporter;
    }

    public static ReportExportType getExportTypeByValue(String value) {
        for (ReportExportType reportExportType : ReportExportType.values()) {
            if (reportExportType.getValue().equals(value)) {
                return reportExportType;
            }
        }
        throw new IllegalArgumentException("Export type [" + value + "] not supported");
    }
}
