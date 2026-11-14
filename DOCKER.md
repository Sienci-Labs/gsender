# Running gSender headless in a container

`Dockerfile.server` builds an image that runs the gSender server directly
under Node.js and serves the web UI over the network. It does not use
Electron, so it needs no display, X server or Xvfb. This suits a Raspberry Pi
or other small computer that sits next to the CNC and is used from a browser
on another device.

Images are published for `linux/amd64` and `linux/arm64` (Raspberry Pi with a
64-bit OS) as `ghcr.io/sienci-labs/gsender`, tagged `latest` for master and by
version for releases.

## Docker

```bash
docker run -d --name gsender \
  --restart unless-stopped \
  -p 8000:8000 \
  --device /dev/ttyUSB0 \
  -v /run/udev:/run/udev:ro \
  -v gsender-data:/data \
  ghcr.io/sienci-labs/gsender:latest
```

Then open `http://<host-address>:8000` and connect to the machine from the
gSender UI as usual.

- `--device` passes the CNC's serial port into the container. Replace
  `/dev/ttyUSB0` with your device; `ls /dev/serial/by-id/` shows it.
- `/run/udev` lets gSender read USB device details when listing ports.
- `/data` holds settings, macros and uploads. Without a volume there, they are
  lost when the container is removed.

## Docker Compose

```yaml
services:
  gsender:
    image: ghcr.io/sienci-labs/gsender:latest
    container_name: gsender
    restart: unless-stopped
    ports:
      - "8000:8000"
    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0
    volumes:
      - ./data:/data
      - /run/udev:/run/udev:ro
```

## Notes

- Arguments placed after the image name are passed to the gSender server.
- With rootless Podman, add `--group-add keep-groups` so the container keeps
  the host user's `dialout` group for the serial port.
- gSender serves the UI without TLS and, unless you add users, without a
  login. Only expose it on a network you trust.
