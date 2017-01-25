package com.wavemaker.runtime.util;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.spec.AlgorithmParameterSpec;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.KeySpec;
import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.PBEParameterSpec;

import com.wavemaker.commons.WMRuntimeException;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 21/6/16
 */
public class CryptoHelper {

    // 8-byte Salt
    private static final byte[] salt = {
            (byte) 0xA9, (byte) 0x9B, (byte) 0xC8, (byte) 0x32,
            (byte) 0x56, (byte) 0x35, (byte) 0xE3, (byte) 0x03
    };
    // Iteration count
    private static final int iterationCount = 19;

    private String algorithm;
    private String key;

    private Cipher encrypter;
    private Cipher decrypter;

    public CryptoHelper(String algorithm, String key) {
        this.algorithm = algorithm;
        this.key = key;
    }

    private Cipher getCipher(int mode) {
        //Key generation for enc and desc
        KeySpec keySpec = new PBEKeySpec(key.toCharArray(), salt, iterationCount);
        try {
            SecretKey key = SecretKeyFactory.getInstance(algorithm).generateSecret(keySpec);
            // Prepare the parameter to the ciphers
            AlgorithmParameterSpec paramSpec = new PBEParameterSpec(salt, iterationCount);

            //Enc process
            final Cipher cipher = Cipher.getInstance(key.getAlgorithm());
            cipher.init(mode, key, paramSpec);

            return cipher;
        } catch (InvalidKeySpecException | NoSuchAlgorithmException | InvalidAlgorithmParameterException | NoSuchPaddingException | InvalidKeyException e) {
            throw new WMRuntimeException("Error while creating cipher", e);
        }
    }


    protected Cipher getEncryptor() {
        if (encrypter == null) {
            encrypter = getCipher(Cipher.ENCRYPT_MODE);
        }
        return encrypter;
    }

    protected Cipher getDecrypter() {
        if (decrypter == null) {
            decrypter = getCipher(Cipher.DECRYPT_MODE);
        }
        return decrypter;
    }

    /**
     * @param plainText Text input to be encrypted
     * @return Returns encrypted text
     */
    public String encrypt(String plainText) {

        byte[] in = plainText.getBytes(StandardCharsets.UTF_8);
        try {
            byte[] out = getEncryptor().doFinal(in);
            return new sun.misc.BASE64Encoder().encode(out);
        } catch (IllegalBlockSizeException | BadPaddingException e) {
            throw new WMRuntimeException("Error while encrypting value", e);
        }
    }

    /**
     * @param encryptedText encrypted text input to decrypt
     * @return Returns plain text after decryption
     */
    public String decrypt(String encryptedText) {
        try {
            byte[] enc = new sun.misc.BASE64Decoder().decodeBuffer(encryptedText);
            byte[] utf8 = getDecrypter().doFinal(enc);
            return new String(utf8, StandardCharsets.UTF_8);
        } catch (BadPaddingException | IllegalBlockSizeException | IOException e) {
            throw new WMRuntimeException("Error while decrypting value", e);
        }
    }
}
