package com.wavemaker.runtime.feed.controller;

import javax.validation.constraints.NotNull;

import org.hibernate.validator.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.wavemaker.runtime.feed.model.FeedConfigDetails;
import com.wavemaker.runtime.ws.Feed;
import com.wavemaker.runtime.ws.SyndFeedService;
import com.wordnik.swagger.annotations.ApiOperation;

/**
 * Created by sunilp on 11/3/15.
 */
@RestController
@RequestMapping(value = "/feed")
public class FeedServiceRuntimeController {

    @Autowired
    private SyndFeedService feedService;

    @RequestMapping(value = "", method = RequestMethod.GET)
    @ApiOperation(value = "Reads from the InputStream of the specified URL and builds the feed object from the returned XML.")
    public Feed getFeed(@RequestParam("url") @NotNull @NotBlank String url) {
        return feedService.getFeed(url);
    }

    @RequestMapping(value = "", method = RequestMethod.POST)
    @ApiOperation(value = "Reads from the InputStream of the specified URL & http auth and builds the feed object from the returned XML.")
    public Feed getFeedWithHttpConfig(@RequestBody FeedConfigDetails feedConfigDetails) {
        return feedService.getFeedWithHttpConfig(feedConfigDetails.getUrl(), feedConfigDetails.getHttpBasicAuthUsername(), feedConfigDetails.getHttpBasicAuthPassword(), feedConfigDetails.getConnectionTimeout());
    }

}
