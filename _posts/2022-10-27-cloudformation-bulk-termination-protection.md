---
layout: post
title:  "Janky bash one-liner: enabling termination protection on a bunch of CloudFormation stacks"
date:   2022-10-27 11:15:00 +1300
---

A janky bash one-liner for today. This is a quick and dirty way of enabling termination protection on a bunch of CloudFormation stacks using the AWS CLI. 


# What to do

1. Spawn into an aws-vault subshell of the account you are wanting to target

1. Update and execute to suit:

``` bash
aws cloudformation describe-stacks --query 'Stacks[].StackName' | grep -v -i ssm | grep -i "thomas-" | sed 's/,//g' | xargs -I {} aws cloudformation update-termination-protection --enable-termination-protection --stack-name {}
```

# What it does

Let's break it down a bit. 

`aws cloudformation describe-stacks --query 'Stacks[].StackName'` this is getting a dump of all our CloudFormation stacks. 

`grep -v -i ssm` is doing an inverse grep search (case insensitive) on a term I want to exclude from the termination protection action.

`grep -i "thomas-"` is doing our grep (case insensitive) for the stacks I want to apply the termination protection to. 

`sed 's/,//g'` is removing an extra comma from the output.

`xargs -I {} aws cloudformation update-termination-protection --enable-termination-protection --stack-name {}` is doing a loop over the filtered list of staks and running the AWS CLI command for each. 














