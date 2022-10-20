---
layout: post
title:  "Activating an AWS DataSync instance"
date:   2022-10-20 14:00:00 +1300
---

This has been a slightly annoying process and it always catches me out (the three times I've had to do it previously). 

This is a quick blog on how to activate a DataSync agent that is running on EC2 by retrieving the activation key manually. 


# What to do

1. Deploy your DataSync VPC endpoint in the VPC where the DataSync instance will be running. You'll need to make sure the security group allows the required ports/protocols/sources/destinations. 

1. Deploy your shiny new DataSync EC2 instance, again with the correct security group rules. SSM parameter `/aws/service/datasync/ami` has the latest AMI. 

1. Spin up (if you don't have one already) and open connectivity between a jumphost-type EC2 instance and the new DataSync instance you've deployed on EC2. You'll need to open port 80 in the security groups. Unfortunately the DataSync agent does not come with SSM out of the box, so no SSM port forwarding here 😢

1. It's important to get the URL correct, as you only have one shot to get the DataSync activation code from the new DataSync instance. If you screw it up, kill the DataSync instance and spin it up again. 

1. Grab the URL below and populate it with the correct values for your environment: 
`http://<datasync-instance-IP>/?gatewayType=SYNC&activationRegion=ap-southeast-2&endpointType=PRIVATE_LINK&privateLinkEndpoint=<vpc-endpoint-IP>&no_redirect`

1. Paste the URL into your jumphost browser and hope the DataSync instance returns the activation code. 

1. If you were given the activation code, chuck it in the DataSync console when setting up a new agent. If all is well, the agent should show up green and ready to use. 


![img1](https://raw.githubusercontent.com/tdq132/tdq132.github.io/master/_media/2022-10-20-datasync-activation-img1.png)


[This page](https://aws.amazon.com/premiumsupport/knowledge-center/datasync-cross-activate-agent/) has roughly the same as above with a little more detail, if you need more. 

















