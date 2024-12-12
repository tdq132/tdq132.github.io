---
layout: post
title:  "AWS New Zealand Region..."
date:   2024-12-12 22:00:00 +1300
---

It's almost here... `Asia Pacific (New Zealand) ap-southeast-6` - as seen when creating a Secret in Secrets Manager (under the Secret Replication section).

![cosole-screenshot](/assets/2024-12-12-aws-nz-region-console.png)


### Having a peek at CT logs...

Looking at the CT logs, we can see AWS follow [their own guidance](https://aws.amazon.com/builders-library/automating-safe-hands-off-deployments/#Test_deployments_in_pre-production_environments) of having multiple deployment environments. This is indicated by the `<service name>-gamma.ap-southeast-6.amazonaws.com` issued certificates. Seems most (not all) of the `-gamma` DNS records are private...

For the curious, here are CT logs - [https://crt.sh/?q=ap-southeast-6.amazonaws.com](https://crt.sh/?q=ap-southeast-6.amazonaws.com)


### DNS
Another interesting find - some DNS records look to be pointing to elastic load balancers within the Sydney (`ap-southeast-2`) region. 

For example - `cloudformation.ap-southeast-6.amazonaws.com` is a CNAME that points to `AKL-FacadeRegi-12DCA3E283-1831340791.ap-southeast-2.elb.amazonaws.com` which I assume to be "FacadeRegion". 

Would love to see how AWS spin up a new region under the hood and the testing that goes into it before launch!