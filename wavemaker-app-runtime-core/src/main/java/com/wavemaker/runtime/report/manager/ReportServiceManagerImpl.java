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
package com.wavemaker.runtime.report.manager;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;

import com.wavemaker.runtime.file.model.DownloadResponse;
import com.wavemaker.runtime.report.model.ReportContext;
import com.wavemaker.runtime.report.generator.JasperReportGenerator;

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
