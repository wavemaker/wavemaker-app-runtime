package com.wavemaker.runtime.data.export.nativesql;

import java.io.ByteArrayOutputStream;
import java.sql.ResultSet;

import org.apache.poi.ss.usermodel.Workbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.runtime.data.export.DataExporter;
import com.wavemaker.runtime.data.export.ExportType;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 7/11/16
 */
public class NativeSQLDataExporter extends DataExporter {


    private static final Logger logger = LoggerFactory.getLogger(NativeSQLDataExporter.class);

    private ResultSet results;

    public NativeSQLDataExporter(ResultSet results) {
        this.results = results;
    }


    @Override
    public ByteArrayOutputStream export(ExportType exportType) {
        logger.info(
                "Exporting all Records matching the given input query to the given exportType format " + exportType);
        Workbook workbook = NativeSQLExportBuilder.build(results);
        return exportWorkbook(workbook, exportType);
    }
}
