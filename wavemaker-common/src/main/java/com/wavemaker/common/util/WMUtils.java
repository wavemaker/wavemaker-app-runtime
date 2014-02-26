package com.wavemaker.common.util;

/**
 * @author Uday Shankar
 */
public class WMUtils {

    public static String getFileExtensionFromFileName(String fileName) {
        int indexOfDot = fileName.lastIndexOf(".");
        return (indexOfDot == -1) ? "":fileName.substring(indexOfDot + 1);
    }

}
