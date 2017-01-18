package com.wavemaker.runtime.data.export;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import org.apache.poi.ss.usermodel.Workbook;

import com.wavemaker.runtime.data.export.util.CSVConverterUtil;
import com.wavemaker.studio.common.WMRuntimeException;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 8/11/16
 */
public abstract class DataExporter {

    public abstract ByteArrayOutputStream export(ExportType exportType, Class<?> responseType);

    protected ByteArrayOutputStream exportWorkbook(final Workbook workbook, final ExportType exportType) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            if (exportType == ExportType.EXCEL) {
                workbook.write(outputStream);
            } else if (exportType == ExportType.CSV) {
                CSVConverterUtil CSVConverterUtil = new CSVConverterUtil(workbook);
                CSVConverterUtil.convert(outputStream);
            }
            return outputStream;
        } catch (IOException e) {
            throw new WMRuntimeException("Error while exporting data", e);
        }
    }
}
