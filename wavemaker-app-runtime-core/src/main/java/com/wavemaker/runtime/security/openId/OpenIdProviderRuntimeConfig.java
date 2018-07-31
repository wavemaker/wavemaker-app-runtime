package com.wavemaker.runtime.security.openId;

import java.util.List;

import com.wavemaker.commons.auth.openId.OpenIdProviderInfo;

/**
 * Created by srujant on 30/7/18.
 */
public class OpenIdProviderRuntimeConfig {

    private List<OpenIdProviderInfo> openIdProviderInfoList;

    public List<OpenIdProviderInfo> getOpenIdProviderInfoList() {
        return openIdProviderInfoList;
    }

    public void setOpenIdProviderInfoList(List<OpenIdProviderInfo> openIdProviderInfoList) {
        this.openIdProviderInfoList = openIdProviderInfoList;
    }
}
