package com.wavemaker.runtime.feed.controller;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;

import javax.validation.constraints.NotNull;

import org.hibernate.validator.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.wavemaker.runtime.feed.model.Feed;
import com.wavemaker.runtime.feed.service.FeedService;
import com.wavemaker.studio.common.CommonConstants;
import com.wordnik.swagger.annotations.ApiOperation;

/**
 * Created by sunilp on 11/3/15.
 */
@RestController
@RequestMapping(value = "/feed")
public class FeedServiceController {

    @Autowired
    private FeedService feedService;

    @RequestMapping(value = "", method = RequestMethod.GET)
    @ApiOperation(value = "Reads from the InputStream of the specified URL and builds the feed object from the returned XML.")
    public Feed getFeed(@RequestParam("feedURL") @NotNull @NotBlank String feedURL) throws UnsupportedEncodingException{
        return feedService.getFeed(URLDecoder.decode(feedURL, CommonConstants.UTF8));
    }

    @RequestMapping(value = "/auth", method = RequestMethod.GET)
    @ApiOperation(value = "Reads from the InputStream of the specified URL & http auth and builds the feed object from the returned XML.")
    public Feed getFeedWithHttpConfig(@RequestParam("feedURL") @NotNull @NotBlank String feedURL, @RequestParam("httpBasicAuthUsername") @NotNull @NotBlank String httpBasicAuthUsername, @RequestParam("httpBasicAuthPassword") @NotNull @NotBlank String httpBasicAuthPassword, @RequestParam("connectionTimeout") @NotNull @NotBlank int connectionTimeout) throws UnsupportedEncodingException{
        return feedService.getFeedWithHttpConfig(URLDecoder.decode(feedURL, CommonConstants.UTF8), httpBasicAuthUsername, httpBasicAuthPassword, connectionTimeout);
    }

}
