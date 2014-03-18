package com.wavemaker.runtime.ws;

import java.util.ArrayList;
import java.util.List;

import com.sun.syndication.feed.synd.SyndEntry;
import com.sun.syndication.feed.synd.SyndFeed;

/**
 * Builder class used for building {@link Feed} object from {@link SyndFeed} object
 * @author Uday Shankar
 */
public class FeedBuilder {

    public static Feed getFeed(SyndFeed syndFeed) {
        Feed feed = new Feed();
        feed.setAuthor(syndFeed.getAuthor());
        feed.setCopyright(syndFeed.getCopyright());
        feed.setDescription(syndFeed.getDescription());
        feed.setEncoding(syndFeed.getEncoding());


        List<Entry> entryList = new ArrayList<Entry>();
        List<SyndEntry> syndEntryList = syndFeed.getEntries();
        if(syndEntryList != null) {
            for (SyndEntry syndEntry : syndEntryList) {
                entryList.add(EntryBuilder.getEntry(syndEntry));
            }
        }
        feed.setEntries(entryList.toArray(new Entry[entryList.size()]));

        feed.setFeedType(syndFeed.getFeedType());
        feed.setLanguage(syndFeed.getLanguage());
        feed.setLink(syndFeed.getLink());
        feed.setPublishedDate(syndFeed.getPublishedDate());
        feed.setTitle(syndFeed.getTitle());
        feed.setUri(syndFeed.getUri());
        return feed;
    }
}
