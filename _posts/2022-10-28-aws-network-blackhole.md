---
layout: post
title:  "Our EC2 network black hole"
date:   2022-10-28 15:00:00 +1300
---

This is a blog detailing an issue I encountered while attempting to connect an EC2 instance to an internet endpoint via a firewall. 


# The requirements

Nice and simple requirements. 

- We need to deploy two EC2 instances to AWS, one in AZ-A, and one in AZ-B. 

- Both instances must have static IP addresses assigned. 

- Both instances must be created from the same AMI. 

- They should connect out to the internet to reach the public AWS SSM endpoint (via their respective AZ firewall).

So they are pretty much identical, apart from the subnet (AZ) they are deployed to (and implicitly the firewall they are talking to).


# The problem 

For some reason, I find that the instance in AZ-A is not able to connect out to the public SSM endpoint (`ssm.ap-southeast-2.amazonaws.com`). The instance in AZ-B is connecting fine, so what's gone wrong? 

Time to check the usual suspects: 
- DNS  ✅
- Security group rules  ✅ 
- ufw  ✅
- proxy  ✅
- ssm agent - installed. Failing to connect to the AWS mothership obviously
- route tables  ✅
- NACLs  ✅

Hmmm, okay. The usual suspects are all fine. Maybe there is a rule missing from the firewall? 

Nope. All good there. Traffic is flowing and green. Weird. 


# Digging into it

tcpdump time! Let's see what happens when we run a tcpdump on the problem instance and attempt to curl `https://ssm.ap-southeast-2.amazonaws.com`... 

``` groovy
75	36.398945	10.130.105.12	99.82.187.47	TCP	76	55702 → 443 [SYN] Seq=0 Win=26883 Len=0 MSS=8961 SACK_PERM=1 TSval=421262246 TSecr=0 WS=128
79	37.428293	10.130.105.12	99.82.187.47	TCP	76	[TCP Retransmission] [TCP Port numbers reused] 55702 → 443 [SYN] Seq=0 Win=26883 Len=0 MSS=8961 SACK_PERM=1 TSval=421263276 TSecr=0 WS=128
80	39.476291	10.130.105.12	99.82.187.47	TCP	76	[TCP Retransmission] [TCP Port numbers reused] 55702 → 443 [SYN] Seq=0 Win=26883 Len=0 MSS=8961 SACK_PERM=1 TSval=421265324 TSecr=0 WS=128
81	43.508296	10.130.105.12	99.82.187.47	TCP	76	[TCP Retransmission] [TCP Port numbers reused] 55702 → 443 [SYN] Seq=0 Win=26883 Len=0 MSS=8961 SACK_PERM=1 TSval=421269356 TSecr=0 WS=128
101	51.700296	10.130.105.12	99.82.187.47	TCP	76	[TCP Retransmission] [TCP Port numbers reused] 55702 → 443 [SYN] Seq=0 Win=26883 Len=0 MSS=8961 SACK_PERM=1 TSval=421277548 TSecr=0 WS=128
```

Hmm okay, that's obviously not right - we're not getting an `ACK` back when connecting to the endpoint. 

I also got a tcpdump on the firewall run, and it was very similar to the above. No results sorry. 

On further troubleshooting, a simple ping was attempted from the firewall to the trouble instance. That was successful, as expected. Then something weird happened - our problem went away! The trouble instance was able to connect to SSM! 

Thanks to Phil for mentioning ARP, that was the hint I needed to go digging a little bit deeper. Found this [Hacker News](https://news.ycombinator.com/item?id=8730640) post with a quick "aws arp caching" google which led me to this [Clever blog post](https://engineering.clever.com/2014/12/10/when-your-ip-traffic-in-aws-disappears-into-a-black-hole/) which just reads exactly like the issue I've had. 



# The firewall ARP tables

On looking at the firewall ARP tables while the issue was happening, I noticed the MAC address for the problem instance was out of date!


_Firewall 1 ARP entry - showing the incorrect MAC address -_
``` bash
[root@FW01:0]$ arp | grep 10.130.105.12
ip-10-130-105-12.ap-sou ether 06:cf:a2:b2:c6:9e C eth2
```

_Firewall 2 ARP entry - this MAC address is correct -_
``` bash
[root@FW02:0]$ arp | grep 10.130.106.12
ip-10-130-106-12.ap-sou ether 02:73:56:60:d5:e6 C eth2
```


After another `ping` to "fix" the issue, this is what the ARP entries looked like: 

_Firewall 1 -_
``` bash
[root@FW01:0]$ arp | grep 10.130.105.12
ip-10-130-105-12.ap-sou ether 06:0c:03:1a:aa:fc C eth2
```

_Firewall 2 -_
``` bash
[root@FW02:0]$ arp | grep 10.130.106.12
ip-10-130-106-12.ap-sou ether 02:b4:40:4d:2c:6c C eth2
```

... and traffic was flowing smoothly again - the MACs had been updated. 


# The resolution 

The final resolution is pending. 

We have a ticket open with our firewall manufacturer to see what they think. I'm assuming there is a patch to apply, so it could be a little while for a permanent fix. 

In the meantime, `ping` is our friend to run if this pops up again. 



# Closing notes 

What first looked like a nice simple issue (hello missing security group rules!) turned out to be much more complex than thought (from a debugging perspective at least!).

It's been super interesting digging a little deeper into the networking side of things, but I think I'll leave networking to the pros 😄

