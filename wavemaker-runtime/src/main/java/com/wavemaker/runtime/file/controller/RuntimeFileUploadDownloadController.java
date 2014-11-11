package com.wavemaker.runtime.file.controller;

import java.io.IOException;
import java.net.URLDecoder;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import com.wavemaker.runtime.server.upload.FileUploadDownload;

/**
 * @author Uday Shankar
 */
@Controller
public class RuntimeFileUploadDownloadController {

    @Autowired
    private FileUploadDownload fileUploadDownload;

    @RequestMapping(value = "/resources/upload",method = RequestMethod.POST)
    @ResponseBody
    public void uploadFile(@RequestParam(value = "relativePath", required = false) String relativePath,
                           HttpServletRequest httpServletRequest) throws IOException {
        relativePath = URLDecoder.decode(relativePath);
        MultipartHttpServletRequest multipartHttpServletRequest = (MultipartHttpServletRequest) httpServletRequest;
        Map<String, MultipartFile> fileMap = multipartHttpServletRequest.getFileMap();
        for (String fileName : fileMap.keySet()) {
            fileUploadDownload.uploadFile(fileMap.get(fileName), relativePath);
        }
    }
}
