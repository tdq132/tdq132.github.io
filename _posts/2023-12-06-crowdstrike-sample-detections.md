---
layout: post
title:  "Generating sample CrowdStrike detections"
date:   2023-12-06 17:00:00 +1300
---

Here is a nice and easy way of generating test CrowdStrike Falcon detections on a Linux instance. 

Simply run one (or all) of the below. You'll get a `no such file or directory` error which is fine, CrowdStrike should still have caught ya. 

``` bash
bash crowdstrike_test_informational
bash crowdstrike_test_low
bash crowdstrike_test_medium
bash crowdstrike_test_high
bash crowdstrike_test_critical
```

![img1](/assets/2023-12-06-crowdstrike-detections.png)


For Windows detections, [look here](https://www.crowdstrike.com/blog/tech-center/generate-your-first-detection/).