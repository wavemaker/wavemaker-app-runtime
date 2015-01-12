/**
 * Copyright (c) 2013 - 2014 WaveMaker Inc. All Rights Reserved.
 *
 * This software is the confidential and proprietary information of WaveMaker Inc.
 * You shall not disclose such Confidential Information and shall use it only in accordance
 * with the terms of the source code license agreement you entered into with WaveMaker Inc.
 */
package com.wavemaker.studio.common.util;


import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.apache.commons.codec.binary.Base64;

public class HMACCalculator {

    public static final String HMAC_SHA256_ALGORITHM = "HmacSHA256";
    public static final String HMAC_SHA1_ALGORITHM = "HmacSHA1";

    public static  String computeHMAC(String baseString, String key, String algorithm) throws InvalidKeyException, NoSuchAlgorithmException {
        if(algorithm == null || algorithm.isEmpty()) {
            algorithm = HMAC_SHA1_ALGORITHM;
        }
        Mac mac = Mac.getInstance(algorithm);
        SecretKeySpec secret = new SecretKeySpec(key.getBytes(), mac.getAlgorithm());
        mac.init(secret);
        byte[] digest = mac.doFinal(baseString.getBytes());

        return Base64.encodeBase64String(digest);
    }
}
