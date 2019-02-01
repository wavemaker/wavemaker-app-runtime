package com.wavemaker.runtime.webprocess.model;

public class WebProcess {
    private String processName;
    private String communicationKey;
    private String hookUrl;
    private String requestSourceType;

    public String getProcessName() {
        return processName;
    }

    public void setProcessName(String processName) {
        this.processName = processName;
    }

    public String getCommunicationKey() {
        return communicationKey;
    }

    public void setCommunicationKey(String communicationKey) {
        this.communicationKey = communicationKey;
    }

    public String getHookUrl() {
        return hookUrl;
    }

    public void setHookUrl(String hookUrl) {
        this.hookUrl = hookUrl;
    }

    public String getRequestSourceType() {
        return requestSourceType;
    }

    public void setRequestSourceType(String requestSourceType) {
        this.requestSourceType = requestSourceType;
    }

    @Override
    public String toString() {
        return "WebProcess{" +
                "processName='" + processName + '\'' +
                ", communicationKey='" + communicationKey + '\'' +
                ", hookUrl='" + hookUrl + '\'' +
                ", requestSourceType='" + requestSourceType + '\'' +
                '}';
    }
}
