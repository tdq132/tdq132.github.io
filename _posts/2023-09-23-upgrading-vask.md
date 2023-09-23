---
layout: post
title:  "Migrating and upgrading VASK"
date:   2023-09-23 11:00:00 +1200
---

Last week, I migrated a car club forum from an old hosting provider to a new one. Post migration, I also upgraded the forum software from a version that was released in 2011, to the latest (2023). 

The forum had been ticking away nicely with no major issues, but it was well and truly time for a refresh!

## The forum software

In the old host, the forum was running on the Simple Machines Forum platform - version `2.0.x`. This consisted of a bunch of php scripts, and a MySQL 4 database holding all the user content and forum settings. 

The old forum was relatively stable, but due to limitations with the hosting provider, things like images (which are quite popular in a car focused forum) had to be hosted elsewhere and then linked on the forum. With the new hosting provider, we're paying a very reasonable yearly fee and have unlimited disk space. This means we can host all the images on the forum itself, which makes for a much better user experience. 

The old hosting provider offered very little in terms of security, so we had to use Simple Machine Forum mods to achieve a basic level of protection against spammers. 


## Hello, Cloudflare

The new forum is fronted by [Cloudflare](https://www.cloudflare.com/). 

Cloudflare offer us WAF functionality, bot protection, caching, analytics, and more. This has enabled us to provide a much more secure, stable, and fast platform for our users.

To ensure nobody can bypass Cloudflare and connect to the site directly, the sites `.htaccess` has restrictions in place to only permit connections originating from Cloudflare's IP ranges. This ensures all traffic is routed through Cloudflare for inspection. 

I've also set up additional WAF rules to ensure key actions on the site (for example, accessing the admin section, registration page, login page) are protected with a Cloudflare [managed challenge](https://blog.cloudflare.com/tag/managed-challenge/). This helps weed out any bad traffic before they can attempt to do anything harmful. 



## The migration

Here is the plan I made for the migration. 
This plan was refined over 5 dry runs, which made the production cutover go relatively straightforward. 

   1. Put old forum into maintenance mode to prevent any changes
   1. Download old forum config and attachments
   1. Download old forum database backup
   1. Execute local database modifications to enable the DB to be imported into the new MySQL DB
      ``` bash 
      sed -i 's%TYPE=MyISAM%ENGINE=MyISAM%g' vask_20230916.sql
      sed -i 's%timestamp(14)%timestamp%g' vask_20230916.sql
      sed -i 's%/var/users/vask/vask.org.nz/htdocs/%/home/vask/test.vask.org.nz/%g' vask_20230916.sql
      sed -i 's%Database: vask%Database: vask_vask_test%g' vask_20230916.sql
      ```
   1. Restore DB into new provider DB 
   1. Create DB user and assign required privileges 
   1. Update local site config to point to new DB
   1. Upload site config to host 
   1. Download [full upgrade package](https://download.simplemachines.org/) and upload to host 
   1. Uncompress the full upgrade package
   1. Download [repair_settings.php](https://wiki.simplemachines.org/smf/Repair_settings.php) and upload to host
   1. Execute `repair_settings.php` and update all URLs to HTTPS
   1. Run the upgrade wizard
   1. Test access to the forum
   1. Delete all mods
   1. Delete all unnecessary (old, garbage) files from the host
   1. Configure forum settings:
      - Nicer limits for attachments, add jpeg to whitelist
      - Enable likes
      - Enable @ mentions
      - Set `max-width` to `1800px` in `themes/default/index.css` because most screens are wider these days
      - Upload and install [Pretty URLs](https://custom.simplemachines.org/index.php?mod=636) mod
      - Check `.htaccess` to ensure the CloudFlare IPs are the only ones allowed to connect direct
   1. Install [the mod I created](https://github.com/tdq132/smf-cf-retain-source-ip) to retain source IP address when Cloudflare is proxying traffic
   1. Health check the forum, fix any obvious issues
   1. Delete any outstanding user registrations that are bogus
   1. Execute all forum maintenance jobs
   1. Enable Google reCAPTCHA to protect new registrations
   1. Send test email, ensure received
   1. Update DNS to point to the new host
   1. Execute pre go-live full backup
   1. Remove forum maintenance, enabling users to access the site again
   1. Post completion message to discussion
   1. Decommission old forum


## Issues encountered

Since I did 5 dry runs of the migration before the production one, most of the kinks were worked out fairly quickly. 

One of the issues that cropped up after cutover was intermittent `403 Forbidden` messages being presented to the users. 

After thorough investigation, I couldn't figure out what was causing the issue. I logged a ticket with the hosting provider, and it turns out they enable ModSecurity by default, and this was picking up some forum standard functionality as a potential attack, and blocking the request. 

With ModSecurity disabled, the forum is functioning as it should with no trouble. I am comfortable with ModSecurity being disabled, as Cloudflare are doing the hard work to protect the forum. 


## We're live!

Woo! The updated forum is live and serving traffic. No complaints so far, and it seems to be ticking along nicely. 

From the changes I have made, this should help the forum live on for many more years to come 😎

Overall, it took about 5 solid days to pull together the migration plan, do 5x dry runs, and the final production run. That isn't too bad considering I had never worked behind the scenes of a Simple Machines Forum before! 

The forum is a great way to retain and share knowledge, so I am more than happy to volunteer my weekends to help keep it happy and healthy! 


## Visit and contribute!

Whether you own or just admire Volkswagen Group vehicles, join us! 

Visit [https://www.vask.org.nz](https://www.vask.org.nz) and register for an account. 
