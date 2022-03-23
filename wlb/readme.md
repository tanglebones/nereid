# wlb

Beginnings of of local load balancer for windows dev to potentially replace nginx.

This is a PITA because:

1. The DotNet APIs for HttpListener and HttpClient don't agree on things. 
    * HttpClient attempts to type-ify the protocol and does so badly.
    * HttpListener is sane and leaves strings as strings.
3. WebSockets is non-trivial to support.

So for now stick with nginx.
