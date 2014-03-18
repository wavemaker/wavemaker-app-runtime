package com.wavemaker.runtime.ws;

import com.sun.syndication.feed.synd.SyndContent;
import com.sun.syndication.feed.synd.SyndEntry;

/**
 * Builder class used for building {@link Entry} object from {@link SyndEntry} object
 * @author Uday Shankar
 */
public class EntryBuilder {

    public static Entry getEntry(SyndEntry syndEntry) {
        Entry entry = new Entry();
        entry.setAuthor(syndEntry.getAuthor());
        SyndContent description = syndEntry.getDescription();
        entry.setDescription((description!=null)?description.getValue() : null);
        entry.setLink(syndEntry.getLink());
        entry.setPublishedDate(syndEntry.getPublishedDate());
        entry.setTitle(syndEntry.getTitle());
        entry.setUpdatedDate(syndEntry.getUpdatedDate());
        entry.setUri(syndEntry.getUri());
        return entry;
    }
}
