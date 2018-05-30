package com.wavemaker.runtime.file.manager;

import java.io.OutputStream;
import java.util.function.Consumer;

import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.wavemaker.runtime.file.model.ExportedFileContentWrapper;

public interface ExportedFileManager {
    default String registerAndGetURL(String fileName, Consumer<OutputStream> callback) {
        String fileID = registerFile(fileName, callback);
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/services/files/exported/{path}")
                .buildAndExpand(fileID)
                .toUriString();
    }

    String registerFile(String fileName, Consumer<OutputStream> callback);

    ExportedFileContentWrapper getFileContent(String fileId);
}
