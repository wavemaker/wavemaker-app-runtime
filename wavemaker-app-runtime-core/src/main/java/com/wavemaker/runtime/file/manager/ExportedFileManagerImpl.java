package com.wavemaker.runtime.file.manager;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.function.Consumer;

import org.springframework.stereotype.Service;

import com.wavemaker.commons.WMRuntimeException;

@Service
public class ExportedFileManagerImpl implements ExportedFileManager {

    private File exportsDir;

    @Override
    public String registerFile(String prefix, String suffix, Consumer<OutputStream> consumer) {
        OutputStream outputStream = null;
        try {
            File exportedFile = File.createTempFile(prefix, suffix, exportsDir);
            outputStream = new FileOutputStream(exportedFile);
            consumer.accept(outputStream);
            return exportedFile.getName();
        } catch (Exception e) {
            throw new WMRuntimeException("Exception while writing to export file.", e);
        } finally {
            try {
                if(outputStream != null) {
                    outputStream.close();
                }
            } catch (IOException e) {
                throw new WMRuntimeException("Error while closing the output stream.", e);
            }
        }
    }

    @Override
    public File getFile(String name) {
        return new File(exportsDir.getAbsolutePath() + File.separator + name);
    }

    public void setExportsDir(File exportsDir) {
        this.exportsDir = exportsDir;
    }
}
