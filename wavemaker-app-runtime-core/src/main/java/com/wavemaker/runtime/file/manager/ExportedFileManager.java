package com.wavemaker.runtime.file.manager;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

import org.springframework.stereotype.Service;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.util.WMIOUtils;

@Service
public class ExportedFileManager {

    private File exportsDir;

    public File create(InputStream stream, String fileName, String extension) {
        try {
            File exportedFile = File.createTempFile(fileName, extension, exportsDir);
            WMIOUtils.copy(stream, new FileOutputStream(exportedFile));
            exportedFile.deleteOnExit();
            return exportedFile;
        } catch (IOException e) {
            throw new WMRuntimeException("Exception while writing to export file.", e);
        }
    }

    public File getFile(String name) {
        return new File(exportsDir.getAbsolutePath() + File.separator + name);
    }

    public void setExportsDir(File exportsDir) {
        this.exportsDir = exportsDir;
    }
}
