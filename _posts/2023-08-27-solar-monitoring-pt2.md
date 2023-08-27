---
layout: post
title:  "Solar Monitoring - Part 2 - Storage and Ingestion"
date:   2023-08-27 11:00:00 +1200
---

This is part 2 of a series of posts I'm writing on how I'm monitoring my solar energy production and consumption at my home in Marlborough, New Zealand. 

# InfluxDB for the storage

[InfluxDB](https://www.influxdata.com/products/influxdb-overview/) is an open-source, high speed, time series database. It's super easy to write data to, and it requires very little hands-on action to keep it running smoothly. 

I chose InfluxDB for a couple of reasons - I have worked with it in the past, and it's super easy to set up and configure. 

I haven't really done anything fancy with the InfluxDB set up, it's a pretty standard install on a Raspberry Pi 4B (4GB) running Ubuntu server 22.04. 

The database is writing data to my NAS to avoid excessive wear on the Pi's SD card, and latency doesn't appear to be an issue. 

Currently data in the DB is not aged out. This makes it possible to do seasonality comparisons over multiple years. 


# Telegraf for the ingestion 

Similar to the above, I chose Telegraf for the data ingestion. Telegraf plays nicely with InfluxDB and I have used it in the past for system monitoring. 

I have the Telegraf agent running on all my machines to send basic OS metrics up to InfluxDB. This enables me to do some pretty basic system monitoring in Grafana, like CPU/memory consumption, uptime, disk usage and utilisation, etc. 

On one of the Pi's (I have a few to split up the workloads), I have dropped in a few more Telegraf config files to enable extracting data from the Fronius inverter/meter. The additional config files live in `/etc/telegraf/telegraf.d/`, and are just `.conf` text files, so they are source controlled in Github for easy storage and versioning. 

I currently have 4 config files that I am dropping into the Telegraf config directory - these represent 4 API endpoints on the Fronius side that I want to extract data from. 

Each config file is pretty much the same, except the target URL that is being hit, and some json elements that I'm not interested in (which are excluded and not sent on to InfluxDB).

This is a copy of the `fronius-flow.conf` file, which contains the API endpoint which details high level electricity flow and totals, such as how much energy the PV panels are producing, how much is coming in/out from/to the grid, what our current demand is, etc. 

``` yaml
# Fronius Inverter - Flow
[[inputs.http]]
  urls = [
    "http://fronius/solar_api/v1/GetPowerFlowRealtimeData.fcgi"
  ]
  method = "GET"
  data_format = "json_v2"
  tagexclude = ["Head.RequestArguments", "Head.Status"]

  [[inputs.http.json_v2]]
        measurement_name = "thomas_inverterTotals"
        timestamp_path = "Head.Timestamp"
        timestamp_format="2006-01-02T15:04:05-07:00"
        timestamp_timezone="Pacific/Auckland"
        [[inputs.http.json_v2.object]]
            path = "Body.Data.Site" 
```

... and this is what the json response looks like for the above request:
``` json
{
   "Body" : {
      "Data" : {
         "Inverters" : {
            "1" : {
               "DT" : 75,
               "E_Day" : 8964,
               "E_Total" : 11332559,
               "E_Year" : 4719089.5,
               "P" : 1692
            }
         },
         "Site" : {
            "E_Day" : 8964,
            "E_Total" : 11332559,
            "E_Year" : 4719089.5,
            "Meter_Location" : "grid",
            "Mode" : "meter",
            "P_Akku" : null,
            "P_Grid" : 1720.6400000000001,
            "P_Load" : -3412.6400000000003,
            "P_PV" : 1692,
            "rel_Autonomy" : 49.580383515401557,
            "rel_SelfConsumption" : 100
         },
         "Version" : "12"
      }
   },
   "Head" : {
      "RequestArguments" : {},
      "Status" : {
         "Code" : 0,
         "Reason" : "",
         "UserMessage" : ""
      },
      "Timestamp" : "2023-08-27T13:09:46+12:00"
   }
}
```

The other 3 config files are hitting the below API endpoints to pull some additional data - 

|Fronius Endpoint|What does it give me?|
|------------|-----------------|
|http://fronius/solar_api/v1/GetMeterRealtimeData.cgi?Scope=System|This provides lots of technical values. I don't know what a lot of it means.|
|http://fronius/solar_api/v1/GetInverterRealtimeData.cgi?Scope=Device&DataCollection=CommonInverterData&DeviceId=1|Common inverter data. This provides the current status of the inverter, today/this year/lifetime energy generation, voltage, amps, frequency, etc.|
|http://fronius/solar_api/v1/GetInverterInfo.cgi|Provides relatively static information about the system such as the device name, status code, error code, and total wattage of the attached panels.|
|http://fronius/solar_api/v1/GetPowerFlowRealtimeData.fcgi|Power flow information. How much power is being imported and exported, percentage of autonomy and self consumption, grid/load/PV wattages, and totals again for day, year, and all time.|


The [Fronius API documentation](https://www.fronius.com/en/solar-energy/installers-partners/technical-data/all-products/system-monitoring/open-interfaces/fronius-solar-api-json-) is reasonably detailed, which helps to explain what each API endpoint provides. I used the documentation alongside the stats in the Fronius app to make sure I was fudging the numbers in the correct way. 😎 


# That's it for now! 
Part 3 will probably dig into the nitty gritty of the Grafana Dashboard. Thanks for reading!



<br>

_This blog will be updated with links to future parts as they are published_ 😄


# In this series

- [Solar monitoring part 1](https://thomasquirke.com/2023/03/12/solar-monitoring-pt1.html)
- Solar monitoring part 2 - _you are here_
