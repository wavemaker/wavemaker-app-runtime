package com.wavemaker.runtime.report.export;

import java.io.File;

import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperPrint;

/**
 * Created by kishorer on 18/5/16.
 */
public interface ReportExporter {

    /**
     * @param jasperPrint printable report object to export as associated format
     * @param file the destination file to export
     */
    void exportToFile(JasperPrint jasperPrint, File file) throws JRException;
}
