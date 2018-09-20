package com.wavemaker.runtime.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.springframework.security.crypto.codec.Hex;

/**
 * Created by srujant on 20/9/18.
 */
public class MessageDigestUtil {

    private static byte[] salt = MessageDigestUtil.class.getSimpleName().getBytes();

    public static String getDigestedData(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            digest.update(salt);
            digest.update(data.getBytes());
            return new String(Hex.encode(digest.digest()));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("No MD5 algorithm available!");
        }
    }

}

