---
layout: post
title:  "CloudWatch log streaming to a centralised S3 bucket 🪣"
date:   2023-12-21 15:00:00 +1300
---

Recently, I was tasked with getting CloudWatch logs into our SIEM for monitoring and analysis.

## Architecture

I designed the following high-level architecture to support this integration:
![ArchitectureDiagram](/assets/2023-12-21-architecture.drawio.png)

The process flow looks something like this:
1. Various processes write their logs to CloudWatch Log Groups
1. CloudWatch Log Group has subscription filter attached, referencing a Kinesis Firehose
1. Kinesis Firehose batches logs, and writes them to a centralised S3 bucket for retention
1. S3 `PutObject` event is fired for each object landing in the bucket, which publishes a message to a dedicated SQS queue
1. SIEM polls the SQS Queue for new messages
1. SIEM deletes the message from the SQS Queue when it has retrieved the object from S3
1. SIEM parses the log data and retaines it for a defined time-period


To achieve this integration, I wrote two CDK stacks which I've outlined below.


## CDK Stack - Centralised Logging

The centralised logging stack is intended to be deployed once, to our logging account, and it deploys the following components:

![LoggingStack](/assets/2023-12-21-logging.drawio.png)

The stack creates:
- an S3 bucket, with a bucket policy to allow our AWS Organization to write to it
- an SQS Queue with the relevant policies
- an IAM role for our SIEM to assume, to get at the SQS Queue and S3 bucket/objects

The stack also creates a KMS key in a centralised KMS account. 
The policy on the key allows the `s3.amazonaws.com` and `logs.amazonaws.com` service principals to use the key, with a condition on the `aws:SourceOrgId` (read more about that condition [here](https://thomasquirke.com/2023/11/22/aws-sourceorgid-condition-key.html)!).

I won't go into the CDK code for this stack in too much detail - it's actually relatively simple - lots of IAM `add_to_policy` calls to provide access between the resources. 


## CDK Stack - Kinesis Firehose

The Firehose stack is intended to be deployed to any account (within our organization) where we want to stream the logs to our centralised bucket. 

The stack deploys the following components:
![FirehoseStack](/assets/2023-12-21-firehose.drawio.png)

The CDK stack takes a few parameters, such as what bucket the logs should be written to, what KMS Key to use for the Kinesis Firehose, and what CloudWatch Log Groups should have the Firehose subscription added. 

The two stacks are deployed in the same CodePipeline, which makes it super easy to reference things like KMS Key details or the S3 bucket that was created in a previous pipeline stage.

The Firehose stack creates:
 - a CloudWatch Log Group and Stream for any Firehose errors
 - an IAM role for Firehose to access the KMS key and S3 bucket
 - the Kinesis Firehose, with all it's config to point to our cross-account S3 bucket
 - an IAM role for our CloudWatch Log Groups to assume to allow PutRecord to the Firehose
 - a custom resource that executes the `cloudwatchlogs` `putSubscriptionFilter` SDK call

Most of those components are pretty simple, and don't have anything too special about them, but I will provide the code for the custom resource that enables the CloudWatch Log Group Subscription Filter. 

``` python 
# prior code snipped for brevity

filter_name = "centralised-logs-kinesis"

# Loop over each provided log group name and create the subscription filter
for log_group in config.log_groups:
    custom_resources.AwsCustomResource(
        self,
        f"ConfigureLogSub{log_group.name}",
        resource_type="Custom::ConfigureLogSubscription",
        on_create=custom_resources.AwsSdkCall(
            physical_resource_id=custom_resources.PhysicalResourceId.of(
                f"ConfigureLogSub{log_group.name}"
            ),
            parameters={
                "destinationArn": firehose_stream.attr_arn,   # This is our Firehose ARN
                "filterName": filter_name,   # A name for the subscription that shows against the Log Group
                "filterPattern": "",   # Filter pattern if you want to filter what is sent to the Firehose
                "logGroupName": log_group.name,   # Log Group we are adding the subscription to
                "roleArn": cw_iam_role.role_arn,   # Role that provides access to the Firehose
            },
            service="cloudwatchlogs",
            action="putSubscriptionFilter",
        ),
        # Revert the changes if this CR is ever removed
        on_delete=custom_resources.AwsSdkCall(
            parameters={
                "filterName": filter_name,   # A name for the subscription that shows against the Log Group,
                "logGroupName": log_group.name,   # Log Group we are adding the subscription to
            },
            service="cloudwatchlogs",
            action="deleteSubscriptionFilter",
        ),
        role=cr_iam_role,   # IAM role to allow the CR to do the needful
    )
```

## The SIEM

Our SIEM helpfully comes with an AWS S3 connector to enable easy data ingestion. 

All I needed to do was create a role in the logging account with a trust relationship specifying our SIEM's AWS account, specify an external ID, and then provide the SIEM with our Role ARN and SQS Queue URL. 

Easy as! 
