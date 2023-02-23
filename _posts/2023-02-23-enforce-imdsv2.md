---
layout: post
title:  "Enforcing IMDSv2 on your CDK deployed EC2 instances"
date:   2023-02-23 14:30:00 +1300
---

## Enforcing IMDSv2… 

…is a quick and easy way of earning [Schrute bucks](https://youtu.be/vPeRElll3Hw) from your security team.

Essentially, IMDSv2 lowers the risk of getting caught up in an SSRF-type cybersecurity incident. 
The AWS docs do a better job of explaining the nitty gritty, so you can read more about it [here](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html). 

During my exploration of enforcing IMDSv2 on a bunch of EC2 instances, I noticed that the [CDK construct](https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_ec2/Instance.html) that creates EC2 instances (`ec2.Instance`) has an optional parameter called `require_imdsv2`. 

Easy! So all I need to do is flick the switch to `true` and all will be well! 


## Whomp whomp 👎️

Not so fast. Unfortunately, flicking that switch in the standard construct causes __EC2 instance replacement__ on existing instances!

That’s _ok_-ish for brand new instances being deployed, but it’s not really ideal when you have lots of pets running production (and soon to be) workloads 🙃


## Custom Resources to the rescue! 

Thanks to the AWS SDK, we have _heaps_ of APIs available that we can consume within our CDK stack to help do things that are a little fiddly out of the box with CDK. 

For this task, I created a new construct. It had two functions: 

- `on_create`: Execute an SDK API call to `modifyInstanceMetadataOptions`, setting `HttpTokens` to `required`, when an optional parameter in the CDK stack is set to `true`.
- `on_delete`: Execute the same SDK API call reverting the `modifyInstanceMetadataOptions` `HttpTokens` parameter back to `optional` (allowing IMDSv1 calls). This is to cover removal of the optional parameter in the CDK stack. 

In the end, this is what my new construct looks like - 

``` python
from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    custom_resources,
)

class EnforceImdsv2(Construct):
    """ This construct enforces the use of IMDSv2, without causing the EC2 instance to be replaced on update.
    """
    def __init__(
        self,
        context: Construct,
        construct_id: str,
        *,
        instance_id: str,
    ) -> None:

        super().__init__(context, construct_id)

        custom_resources.AwsCustomResource(
            self,
            f"enforce_imdsv2",
            resource_type="Custom::RetroEnforceImdsV2",
            on_create=custom_resources.AwsSdkCall(
                physical_resource_id=custom_resources.PhysicalResourceId.of("{instance_id}_retro_enforce_imdsv2"),
                parameters={ 
                    "InstanceId": instance_id,
                    "HttpTokens": "required",
                    "InstanceMetadataTags": "enabled"
                },
                service="EC2",
                action="modifyInstanceMetadataOptions",
            ),
            # Revert the changes if this custom resource is ever removed
            on_delete=custom_resources.AwsSdkCall(
                parameters={ 
                    "InstanceId": instance_id,
                    "HttpTokens": "optional",
                    "InstanceMetadataTags": "disabled"
                },
                service="EC2",
                action="modifyInstanceMetadataOptions",
            ),
            policy=custom_resources.AwsCustomResourcePolicy.from_sdk_calls(
                resources=["*"],
            ),
        )
```

## Can we really see what impact we've made by enforcing IMDSv2? 

Well yeah, kind of. We can see how many instances are interacting with IMDS with _no token_ by looking at `MetadataNoToken` metric in CloudWatch. 

This is a snippet of CloudWatch before I enforced IMDSv2 on a bunch of instances: 
![img1](/assets/2023-02-23-metadata-no-token-before.png)

... and this is a day later, showing a vast decrease of calls to IMDS without a token:
![img1](/assets/2023-02-23-metadata-no-token-after.png)

Here's the CloudWatch metric graph source for the above (or click [here](https://ap-southeast-2.console.aws.amazon.com/cloudwatch/home?region=ap-southeast-2#metricsV2:graph=~(metrics~(~(~(expression~'SELECT*20SUM*28MetadataNoToken*29*20FROM*20*22AWS*2fEC2*22~label~'MetadataNoToken~id~'q1~period~60~stat~'Sum)))~view~'timeSeries~stacked~true~region~'ap-southeast-2~stat~'Sum~period~60~start~'-PT3H~end~'P0D~legend~(position~'bottom)~yAxis~(left~(min~0~max~280)));query=~'*7bAWS*2fEC2*2cInstanceId*7d*20metadata) for even less effort): 
``` json
{
    "metrics": [
        [ { "expression": "SELECT SUM(MetadataNoToken) FROM \"AWS/EC2\"", "label": "MetadataNoToken", "id": "q1", "period": 60, "stat": "Sum" } ]
    ],
    "view": "timeSeries",
    "stacked": true,
    "region": "ap-southeast-2",
    "stat": "Sum",
    "period": 60,
    "legend": {
        "position": "bottom"
    },
    "yAxis": {
        "left": {
            "min": 0,
            "max": 280
        }
    }
}
```


Ciao for now! 👋
