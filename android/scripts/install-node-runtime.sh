#!/usr/bin/env bash
# Unpacks the Node.js runtime tarballs produced by android/node/build-node.sh
# into android/node-runtime/jniLibs/<abi>/, which the app's Gradle build
# packages as native libs.
#
#   android/scripts/install-node-runtime.sh [dir with tarballs]
#   (yarn android:runtime [dir])
#
# Default dir: dist/android/node-runtime. In CI, android.yml downloads the
# runtime release from Sienci-Labs/node_24_APK and passes its dir here. Locally:
#   gh release download "$(bash android/scripts/node-runtime-tag.sh)" \
#       -R Sienci-Labs/node_24_APK -D dist/android/node-runtime
# or build it on Linux with android/node/build-node.sh.
set -euo pipefail

ANDROID_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="${1:-$ANDROID_DIR/../dist/android/node-runtime}"
# shellcheck disable=SC1091
source "$ANDROID_DIR/node/runtime.env"
DEST="$ANDROID_DIR/node-runtime"

rm -rf "$DEST" && mkdir -p "$DEST/jniLibs"
arch=arm64
abi=arm64-v8a
asset="node-$NODE_VERSION-android-$arch.tar.gz"
if [ ! -f "$SRC_DIR/$asset" ]; then
    echo "error: $SRC_DIR/$asset not found." >&2
    echo "Download it: gh release download \"\$(bash android/scripts/node-runtime-tag.sh)\" -R Sienci-Labs/node_24_APK -D $SRC_DIR" >&2
    echo "or build it on Linux: android/node/build-node.sh $arch <ndk dir> <work dir> $SRC_DIR" >&2
    exit 1
fi
mkdir -p "$DEST/jniLibs/$abi"
# Relative archive name: on Windows a "C:/..." path makes GNU tar look for
# a remote host, and --force-local isn't portable to bsdtar (macOS).
(cd "$SRC_DIR" && sha256sum -c "$asset.sha256" && tar xzf "$asset" -C "$DEST/jniLibs/$abi")
# build-info.txt isn't a native lib; keep it beside jniLibs for reference.
mv "$DEST/jniLibs/$abi/build-info.txt" "$DEST/build-info-$arch.txt"

echo "Node $NODE_VERSION (runtime r$RUNTIME_REVISION) → $DEST"
ls -lR "$DEST/jniLibs"
