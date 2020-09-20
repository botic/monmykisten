# monmykisten

# Adding a client

## Preparing the Raspberry Pi

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

## On the Raspberry Pi

```
# add to crontab
*/3 * * * * curl --connect-timeout 25 --max-time 30 -X POST "https://<PROJECT_SUBDDOMAIN>.cloudfunctions.net/monitor?client_id=<CLIENT_ID>&secret=<SECRET_PASSWORD>" >/dev/null 2>&1
```
