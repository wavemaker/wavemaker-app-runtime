package com.wavemaker.runtime.filter.compression;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import javax.servlet.FilterChain;
import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.web.filter.GenericFilterBean;

import com.wavemaker.runtime.filter.compression.gzip.GZipServletResponseWrapper;

/**
 * This filter enables the gzip compression of responses
 *
 * @author Kishore Routhu on 10/10/17 7:04 PM.
 */
public class WMCompressionFilter extends GenericFilterBean {

    public static final String GZIP_ENCODING = "gzip";
    public static final String BROTLI_ENCODING = "br";
    private static final List<String> BUILD_TIME_ENCODINGS = Arrays.asList(BROTLI_ENCODING, GZIP_ENCODING);
    @Autowired
    private CompressionFilterConfig filterConfig;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        HttpServletResponse httpServletResponse = (HttpServletResponse) response;
        String supportedEncodings = httpServletRequest.getHeader(HttpHeaders.ACCEPT_ENCODING);
        boolean processedCompressedFile = false;

        if (supportedEncodings != null && filterConfig.isEnableCompression()) {
            String accessingResource = httpServletRequest.getRequestURI().substring(httpServletRequest.getContextPath().length());
            for (String encodingType : BUILD_TIME_ENCODINGS) {
                if (supportedEncodings.toLowerCase().contains(encodingType)) {
                    String generatedCompressedFile = accessingResource.replaceAll("(.*)(\\..*)", "$1." + encodingType + "$2");
                    File compressedFile = new File(getServletContext().getRealPath(generatedCompressedFile));
                    if (compressedFile.exists() && compressedFile.isFile()) {
                        processedCompressedFile = true;
                        RequestDispatcher requestDispatcher = httpServletRequest.getRequestDispatcher("/" + generatedCompressedFile);
                        httpServletResponse.addHeader(HttpHeaders.CONTENT_ENCODING, encodingType);
                        requestDispatcher.forward(httpServletRequest, httpServletResponse);
                        break;
                    }
                }
            }
            if (!processedCompressedFile && supportedEncodings.toLowerCase().contains(GZIP_ENCODING)) {
                processedCompressedFile = true;
                GZipServletResponseWrapper gZipResponseWrapper = new GZipServletResponseWrapper(filterConfig, httpServletResponse);
                chain.doFilter(request, gZipResponseWrapper);
                gZipResponseWrapper.close();
            }
        }

        if (!processedCompressedFile) {
            chain.doFilter(request, response);
        }
    }
}
