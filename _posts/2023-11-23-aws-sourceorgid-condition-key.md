---
layout: post
title:  "Secure your S3 buckets - new organization-wide IAM condition key 🥳"
date:   2023-11-23 11:00:00 +1200
---

Last week, AWS released a new organization-wide IAM condition key - [`aws:SourceOrgId`](https://aws.amazon.com/about-aws/whats-new/2023/11/organization-wide-iam-condition-keys-restrict-aws-service-to-service-requests/). 

This new IAM condition key is a great way of securing S3 buckets that receive objects written by **AWS services** (service principals), such as VPC flow logs or GuardDuty findings.

Since service principals are not a member of your AWS Organization, prior to the new `aws:SourceOrgId` condition key, you **could not** restrict where the logs came from, without being super specific with your `aws:SourceAccount` condition. This would be _super_ painful if you have more than a handful of accounts needing to log to your centralised bucket.

This means that my centralised VPC flow logs bucket, which allows the service principal `delivery.logs.amazonaws.com` to `s3:PutObject`, would accept VPC flow logs (among others) from **any other AWS account** (assuming they knew your bucket name).

It's not the end of the world - someone can write logs to your bucket - but they can't read anything (assuming you haven't done anything silly in your bucket policy...). But it's not ideal. 

With the new IAM condition key, we can modify our bucket policy to only accept VPC flow logs from AWS accounts that are a member of our organization, like so:

``` json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AWSLogDeliveryWrite",
            "Effect": "Allow",
            "Principal": {
                "Service": "delivery.logs.amazonaws.com"
            },
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::org-vpc-flow-logs/*",
            "Condition": {
                "StringEquals": {
                    "aws:SourceOrgId": "your-org-id",
                    "s3:x-amz-acl": "bucket-owner-full-control"
                }
            }
        },
        {
            "Sid": "AWSLogDeliveryAclCheck",
            "Effect": "Allow",
            "Principal": {
                "Service": "delivery.logs.amazonaws.com"
            },
            "Action": [
                "s3:GetBucketAcl",
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::org-vpc-flow-logs",
            "Condition": {
                "StringEquals": {
                    "aws:SourceOrgId": "your-org-id",
                }
            }
        }
    ]
}
```