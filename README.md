# monmykisten

**Monitor your Kisten!** A simple cloud function to store pings from clients
into a Firestore collection. The stored pings can be used in monitoring scripts
to trigger warnings if the client stops sending new pings.

## Real World Example

<img src="https://github.com/botic/monmykisten/blob/master/docs/example.png" alt="Deployment with Raspberry Pi computers" width="650" />

## Configuration

* Set the `MONITOR_SECRET` and `GCP_PROJECTID` environment variables in your `.env.yaml` configuration.
* Publish the cloud function.
* Set up a client, e.g. a Raspberry Pi, to ping the cloud function in regular intervals.
* Your monitoring can access the latest pings for each client, e.g. `curl -X GET "https://<PROJECT_SUBDDOMAIN>.cloudfunctions.net/monitor?client_id=<CLIENT_ID>"`


## Adding a client

### Preparing the Raspberry Pi

* Write the image onto the SD card.
* Enable SSH support: `touch /Volumes/boot/ssh`
* Set up the wireless config: `touch /Volumes/boot/wpa_supplicant.conf`

Here is an example wireless config:

```
country=de
update_config=1
ctrl_interface=/var/run/wpa_supplicant

network={
    ssid="MY_NETWORK"
    psk="SUPER_SECRET_PASSWORD"
}
```

### On the Raspberry Pi

```
# add to crontab
*/3 * * * * curl --connect-timeout 25 --max-time 30 -X POST "https://<PROJECT_SUBDDOMAIN>.cloudfunctions.net/monitor?client_id=<CLIENT_ID>&secret=<SECRET_PASSWORD>" >/dev/null 2>&1
```

## License

Apache 2.0
