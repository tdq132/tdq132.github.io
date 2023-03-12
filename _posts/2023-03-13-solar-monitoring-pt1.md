---
layout: post
title:  "Solar Monitoring - Part 1 - Introduction"
date:   2023-03-13 11:00:00 +1300
---

This is part 1 of a series of posts I'm writing on how I'm monitoring my solar energy production and consumption at my home in Marlborough, New Zealand. 

# Introduction

In March 2022, we decided to make the most of the Marlborough sun and have a PV system installed at our home. 

The system consists of: 
 - 14 * 390W Q Cells Q.Boost [PV panels](https://qcells.com/au/get-started/complete-energy-solution/solar-panel-detail?slrPnlId=SRPL211228165414049&look=002), which can generate a total of 5.46kW in ideal conditions
 - A Fronius Primo 6.0kW [string inverter](https://www.fronius.com/en-gb/uk/solar-energy/installers-partners/technical-data/all-products/inverters/fronius-primo/fronius-primo-6-0-1)
 - A Fronius [Smart Meter](https://www.fronius.com/en-gb/uk/solar-energy/installers-partners/technical-data/all-products/system-monitoring/hardware/10946/fronius-smart-meter-63a-1)

The PV panels are split into two strings - the first containing 8 panels, and the second having the remaining 6. All panels are installed on a single roof face, and are North facing (Southern Hemisphere 😉).

The system was commissioned on the __9th March 2022__, and (at the time of writing) has generated __8.49MWh__. 


I'm currently monitoring the production and consumption by using [Telegraf](https://www.influxdata.com/time-series-platform/telegraf/) to extract the data from the JSON API of the Fronius Inverter (which communicates with the Fronius Smart Meter) every 10 seconds. The Telegraf agent is writing the data to an [InfluxDB](https://www.influxdata.com/products/influxdb-overview/) time series database, which is queried and visualised using [Grafana](https://grafana.com/). This is all running on a Raspberry Pi 4B. 

Fronius also offer system monitoring out of the box. When connected to the internet, data is regularly sent up to their [Solar.web](https://www.solarweb.com/) service, which can be accessed using their web interface and mobile apps. Solar.web has a free version which allows viewing basic data about the PV system (generation, consumption, export, etc.). Solar.web also offer an optional premium version that has more features such as ROI, PV production forecast, extended reports, and more. 


Stay tuned for more! I plan on detailing more of the monitoring side of things over the next little while. 

&nbsp;
_This blog will be updated with links to future parts as they are published_ 😄

