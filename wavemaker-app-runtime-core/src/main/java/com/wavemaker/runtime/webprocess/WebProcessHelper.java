package com.wavemaker.runtime.webprocess;

import com.wavemaker.runtime.WMObjectMapper;
import com.wavemaker.runtime.webprocess.model.WebProcess;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class WebProcessHelper {
    public static final String WEB_PROCESS_COOKIE_NAME = "WM_WEB_PROCESS";
    public static final String WEB_PROCESS_OUTPUT = "WEB_PROCESS_OUTPUT";
    public static final String UTF_8 = StandardCharsets.UTF_8.toString();
    private static final String ENCRYPTION_ALG = "AES";
    private static final int WEB_PROCESS_COOKIE_MAX_AGE = 10 * 60 * 1000;

    public static Cookie getCookie(Cookie[] cookies, String cookieName) {
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(cookieName)) {
                    return cookie;
                }
            }
        }
        return null;
    }

    public static void addWebProcessCookie(HttpServletRequest request, HttpServletResponse response, String webProcessJSON) {
        Cookie cookie = new Cookie(WEB_PROCESS_COOKIE_NAME, webProcessJSON);
        cookie.setPath(request.getServletContext().getContextPath());
        cookie.setMaxAge(WEB_PROCESS_COOKIE_MAX_AGE);
        cookie.setHttpOnly(true);
        response.addCookie(cookie);
    }

    public static String encode(String key, String data) throws Exception {
        SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(UTF_8), ENCRYPTION_ALG);
        Cipher cipher = Cipher.getInstance(ENCRYPTION_ALG);
        cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec);
        return Base64.getEncoder().encodeToString(cipher.doFinal(data.getBytes()));
    }

    public static String decode(String key, String encodedData) throws Exception {
        SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(UTF_8), ENCRYPTION_ALG);
        Cipher cipher = Cipher.getInstance(ENCRYPTION_ALG);
        cipher.init(Cipher.DECRYPT_MODE, secretKeySpec);
        byte[] bytes = Base64.getDecoder().decode(encodedData);
        return new String(cipher.doFinal(bytes));
    }

    public static WebProcess decodeWebProcess(String process) throws IOException {
        process = new String(Base64.getDecoder().decode(process.getBytes(UTF_8)), UTF_8);
        return WMObjectMapper.getInstance().readValue(process, WebProcess.class);
    }

    public static String encodeWebProcess(WebProcess process) throws IOException {
        String webProcessJSON = WMObjectMapper.getInstance().writeValueAsString(process);
        return Base64.getEncoder().encodeToString(webProcessJSON.getBytes(UTF_8));
    }
}
