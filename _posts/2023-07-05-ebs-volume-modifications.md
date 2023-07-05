---
layout: post
title:  "EBS volume modifications"
date:   2023-07-05 12:00:00 +1200
---

Did you know that you can only modify an AWS EBS volume once every six hours?

Yeah, I didn't know this until I started experimenting different ways of dealing with EBS volume drift. I wanted to see what would happen if I used CDK/CloudFormation to modify an EBS volume in different ways that had been modified manually. 

[The limitation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/modify-volume-requirements.html#elastic-volumes-limitations), per the AWS EC2 documentation. 

## Some tests

1. Starting from an EBS volume of 6GiB. 

1. ClickOps the volume to 8GiB
    - CloudFormation stack drifts ✅

1. CDK Deploy with no changes - expect nothing to happen
   - Nothing happened ✅

1. CDK deploy with 7GiB volume - expect it to fail to update but not destroy anything
   - Update failed, volume untouched ✅
    ```
    Resource handler returned message: "New size cannot be smaller than existing size (Service: Ec2, Status Code: 400
    ```

1. CDK Deploy with 8GiB volume - expect no change
   - This is a little surprising - it has issued the `ModifyVolume` API call, and the API didn't immediately say no changes required - the API still went to process the `ModifyVolume` as if it was a change that could actually be made. 
    ```
    "errorCode": "Client.VolumeModificationRateExceeded",
    "errorMessage": "You've reached the maximum modification rate per volume limit. Wait at least 6 hours between modifications per EBS volume.",
    ```
   - _~6 hours later~_
   - CloudFormation span it's wheels for ~6 hours then eventually "resized" the volume to 8GiB (so it essentially did nothing, as it was already 8GiB). Slow but test successful ✅

1. ClickOps the volume bigger (10GiB), then CDK Deploy the volume even bigger (15GiB), expect the volume to be enlarged.
    - No can do mate, bugger off for 6 hours then try again. 
    - _~6 hours later~_
    - Volume resized successfully to 15GiB. 


6 hours feels like ages to wait when modifying an EBS volume. On the bright side, Code Pipeline and CloudFormation don't seem to mind waiting and retrying periodically - 
![img1](/assets/2023-07-05-ebs-volume-cfn.png)

![img2](/assets/2023-07-05-ebs-volume-pipeline.png)
