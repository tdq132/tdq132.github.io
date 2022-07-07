---
layout: post
title:  "AWS Image Builder - Setting the Timezone in a Windows Image"
date:   2022-07-07 16:30:00 +1200
---

AWS has a service called [EC2 Image Builder](https://aws.amazon.com/image-builder/) that makes it super easy
to create "golen image" type AMIs to use with EC2. 

You can create an Image Pipeline which has multiple components. A component is basically an AWS Task Orchestrator
document that does _stuff_. For example, you can have a component that runs a bash or PowerShell script that does _stuff_. 

One thing that caught me out recently was when I was attempting to set the Timezone for a Windows AMI creation. 

I thought it would be as easy as setting the timezone, like so: 

``` powershell
# Set the timezone to NZST
$new_timezone = "New Zealand Standard Time"
Set-TimeZone -Name $new_timezone
```

Unfortunately, when sysprep is run on the instance, the timezone is reverted to whatever is in the `Unattend.xml` 
sysprep configuration file. This happens to be `UTC`. 

Easy fix with a long PowerShell command! Don't judge too harshly, I'm not a PowerShell guy and this is what 
I cobbled together after a quick search 😅

``` powershell
# Set the timezone to NZST
(Get-Content "C:\ProgramData\Amazon\EC2-Windows\Launch\Sysprep\Unattend.xml").replace('<TimeZone>UTC</TimeZone>', '<TimeZone>New Zealand Standard Time</TimeZone>') | Set-Content "C:\ProgramData\Amazon\EC2-Windows\Launch\Sysprep\Unattend.xml"
```

Anyway - that's it for now. 

