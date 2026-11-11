#!/usr/bin/env bash
# Prints the release tag of the Node.js runtime matching this checkout's
# android/node/, e.g. node-v24.21.0-r1-3fa9c0d1e2b4.
#
#   android/scripts/node-runtime-tag.sh
#
# The runtime is built and published as a release of Sienci-Labs/node_24_APK
# (its build workflow runs this script against a gSender checkout), and
# android.yml downloads the release with this tag. The hash covers every file
# in android/node/, so any change to the build scripts or runtime.env needs a
# new runtime release.
set -euo pipefail

NODE_DIR="$(cd "$(dirname "$0")/../node" && pwd)"
# shellcheck disable=SC1091
source "$NODE_DIR/runtime.env"
hash=$(cd "$NODE_DIR" && LC_ALL=C sha256sum -- * | sha256sum | cut -c1-12)
echo "node-$NODE_VERSION-r$RUNTIME_REVISION-$hash"
