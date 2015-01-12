package com.wavemaker.studio.common.util;

import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;

import org.apache.commons.io.FileUtils;

/**
 * @author Uday Shankar
 */
public class WMFileUtils {

    public static final Charset UTF_8_ENCODING = Charset.forName("UTF-8");

    public static String readFileToString(File file) throws IOException {
        return FileUtils.readFileToString(file, UTF_8_ENCODING);
    }

    public static void writeStringToFile(File file, String data) throws IOException {
        FileUtils.writeStringToFile(file, data, UTF_8_ENCODING, false);
    }
}
