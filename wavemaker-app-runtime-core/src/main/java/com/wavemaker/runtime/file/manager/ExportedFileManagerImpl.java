package com.wavemaker.runtime.file.manager;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.function.Consumer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.io.TempFilesStorageManager;
import com.wavemaker.commons.util.WMIOUtils;
import com.wavemaker.runtime.file.model.ExportedFileContentWrapper;

@Service
public class ExportedFileManagerImpl implements ExportedFileManager {

    @Autowired
    private TempFilesStorageManager tempFilesStorageManager;

    @Override
    public String registerFile(String fileName, Consumer<OutputStream> consumer) {
        OutputStream outputStream = null;
        try {
            String exportedFileId = tempFilesStorageManager.registerNewFile(fileName);
            outputStream = tempFilesStorageManager.getFileOutputStream(exportedFileId);
            consumer.accept(outputStream);
            return exportedFileId;
        } catch (Exception e) {
            throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.file.writing.exception"), e);
        } finally {
            WMIOUtils.closeSilently(outputStream);
        }
    }

    @Override
    public ExportedFileContentWrapper getFileContent(String fileId) {
        String fileName = tempFilesStorageManager.getFileName(fileId);
        InputStream inputStream = tempFilesStorageManager.getFileInputStream(fileId);
        return new ExportedFileContentWrapper(fileName, inputStream);
    }
}
