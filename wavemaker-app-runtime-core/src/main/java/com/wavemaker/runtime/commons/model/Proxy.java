package com.wavemaker.runtime.commons.model;

/**
 * Created by srujant on 1/11/16.
 */
public class Proxy {

    private String hostname;
    private int port;
    private String username;
    private String password;

    public Proxy() {
    }

    public Proxy(Proxy proxy) {
        this.hostname = proxy.hostname;
        this.port = proxy.port;
        this.username = proxy.username;
        this.password = proxy.password;
    }

    public Proxy(String hostname, int port, String username, String password) {
        this.hostname = hostname;
        this.port = port;
        this.username = username;
        this.password = password;
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public String getHostname() {
        return hostname;
    }

    public void setHostname(String hostname) {
        this.hostname = hostname;
    }


    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    @Override
    public String toString() {
        return "Proxy{" +
                "hostname='" + hostname + '\'' +
                ", port=" + port +
                ", username='" + username + '\'' +
                ", password='" + password + '\'' +
                '}';
    }
}
