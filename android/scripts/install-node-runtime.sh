#!/usr/bin/env bash
# Unpacks the Node.js runtime tarballs produced by android/node/build-node.sh
# into android/node-runtime/jniLibs/<abi>/, which the app's Gradle build
# packages as native libs.
#
#   android/scripts/install-node-runtime.sh [dir with tarballs]
#   (yarn android:runtime [dir])
#
# Default dir: dist/android/node-runtime. In CI, android.yml builds the runtime
# (or restores it from the Actions cache) and passes its artifact dir here.
# Locally, either download the `android-node-runtime-*` artifacts of a recent
# Android workflow run into that dir, or build them on Linux with
# android/node/build-node.sh.
set -euo pipefail

ANDROID_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="${1:-$ANDROID_DIR/../dist/android/node-runtime}"
# shellcheck disable=SC1091
source "$ANDROID_DIR/node/runtime.env"
DEST="$ANDROID_DIR/node-runtime"

rm -rf "$DEST" && mkdir -p "$DEST/jniLibs"
for pair in arm64:arm64-v8a x86_64:x86_64; do
    arch=${pair%%:*}
    abi=${pair##*:}
    asset="node-$NODE_VERSION-android-$arch.tar.gz"
    if [ ! -f "$SRC_DIR/$asset" ]; then
        echo "error: $SRC_DIR/$asset not found." >&2
        echo "Download the android-node-runtime-$arch artifact from a recent Android workflow run into $SRC_DIR," >&2
        echo "or build it on Linux: android/node/build-node.sh $arch <ndk dir> <work dir> $SRC_DIR" >&2
        exit 1
    fi
    mkdir -p "$DEST/jniLibs/$abi"
    # Relative archive name: on Windows a "C:/..." path makes GNU tar look for
    # a remote host, and --force-local isn't portable to bsdtar (macOS).
    (cd "$SRC_DIR" && sha256sum -c "$asset.sha256" && tar xzf "$asset" -C "$DEST/jniLibs/$abi")
    # build-info.txt isn't a native lib; keep it beside jniLibs for reference.
    mv "$DEST/jniLibs/$abi/build-info.txt" "$DEST/build-info-$arch.txt"
done

echo "Node $NODE_VERSION (runtime r$RUNTIME_REVISION) → $DEST"
ls -lR "$DEST/jniLibs"
