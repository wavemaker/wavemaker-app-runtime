package com.wavemaker.runtime.report.export;

import java.io.File;

import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.export.JRXmlExporter;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleXmlExporterOutput;


/**
 * Created by kishorer on 18/5/16.
 */
public class XmlReportExporter implements ReportExporter {

    @Override
    public void exportToFile(JasperPrint jasperPrint, File file) throws JRException {
        JRXmlExporter exporter = new JRXmlExporter();
        exporter.setExporterInput(new SimpleExporterInput(jasperPrint));
        exporter.setExporterOutput(new SimpleXmlExporterOutput(file));
        exporter.exportReport();
    }
}
