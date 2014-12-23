/**
 * Copyright (c) 2013 - 2014 WaveMaker Inc. All Rights Reserved.
 *
 * This software is the confidential and proprietary information of WaveMaker Inc.
 * You shall not disclose such Confidential Information and shall use it only in accordance
 * with the terms of the source code license agreement you entered into with WaveMaker Inc.
 */
package com.wavemaker.common.util;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import com.wavemaker.common.CommonConstants;

public class MD5SumCalculator
{
    private static final MD5SumCalculator instance = new MD5SumCalculator();

    private static ThreadLocal<MessageDigest> threadLocal = new ThreadLocal<MessageDigest>()
    {
        @Override
        protected MessageDigest initialValue()
        {
            try {
                return MessageDigest.getInstance("MD5");
            } catch (NoSuchAlgorithmException e) {
                return null;
            }
        }
    };

    public static MD5SumCalculator getInstance()
    {
        return instance;
    }

    public MD5SumCalculator()
    {
    }

    public String checksum(String txt)
    {
        try {
            return checksum(txt.getBytes(CommonConstants.UTF8));
        } catch (UnsupportedEncodingException e) {
            throw new AssertionError("UTF-8 should be a supported encoding");
        }
    }

    public String checksum(byte[] bytes)
    {
        threadLocal.get().reset();
        byte[] digest = threadLocal.get().digest(bytes);
        return toHex(digest);
    }

    public String checksum(InputStream is) throws IOException
    {
        threadLocal.get().reset();
        byte[] bytes = new byte[8192];
        int read = 0;
        while ((read = is.read(bytes)) != -1) {
            threadLocal.get().update(bytes, 0, read);
        }
        return toHex(threadLocal.get().digest());
    }

    public String checksum(File file) throws IOException
    {
        FileInputStream fis = new FileInputStream(file);
        try {
            return checksum(fis);
        } finally {
            fis.close();
        }
    }

    private static String toHex(byte[] digest)
    {
    	StringBuilder hexString = new StringBuilder();
        for (byte b : digest) {
            toHex((char) ((b >> 4) & 0xf), hexString);
            toHex((char) (b & 0xf), hexString);
        }

        return hexString.toString();
    }

    private static void toHex(char c, StringBuilder hexString)
    {
        if (c > 9) {
            c = (char) ((c - 10) + 'a');
        } else {
            c = (char) (c + '0');
        }

        hexString.append(c);
    }
}