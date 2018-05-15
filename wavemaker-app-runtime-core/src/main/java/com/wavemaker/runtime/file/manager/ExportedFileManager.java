package com.wavemaker.runtime.file.manager;

import java.io.File;
import java.io.OutputStream;
import java.util.function.Consumer;

import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

public interface ExportedFileManager {
    default String registerAndGetURL(String prefix, String suffix, Consumer<OutputStream> callback) {
        String fileID = registerFile(prefix, suffix, callback);
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/services/files/exported/{path}")
                .buildAndExpand(fileID)
                .toUriString();
    }

    String registerFile(String prefix, String suffix, Consumer<OutputStream> callback);

    File getFile(String name);
}
