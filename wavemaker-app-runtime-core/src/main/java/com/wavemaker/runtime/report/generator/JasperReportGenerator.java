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
