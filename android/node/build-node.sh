#!/usr/bin/env bash
# Cross-compiles Node.js for Android and packages it for the app.
# Linux x86_64 host only (that's what Node's android_configure.py supports).
#
#   build-node.sh <arm64|x86_64> <ndk dir> <work dir> <out dir>
#
# Reads NODE_VERSION and MIN_SDK from runtime.env next to this script. Writes
# <out dir>/node-<version>-android-<arch>.tar.gz containing:
#   libnode_exec.so    the stripped node executable, named as a lib so the
#                      APK installs it into nativeLibraryDir (the only app
#                      location Android 10+ allows exec from)
#   libc++_shared.so   if node links against it
#   build-info.txt     version, NDK, page alignment, NEEDED libs
set -euo pipefail

ARCH="$1"
NDK="$2"
WORK="$3"
OUT="$4"
HERE="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
source "$HERE/runtime.env"

case "$ARCH" in
    arm64) PREFIX=aarch64-linux-android; GYP_ARCH=arm64 ;;
    x86_64) PREFIX=x86_64-linux-android; GYP_ARCH=x64 ;;
    *) echo "unsupported arch: $ARCH" >&2; exit 1 ;;
esac

TC="$NDK/toolchains/llvm/prebuilt/linux-x86_64"
SRC="$WORK/node-$NODE_VERSION"
mkdir -p "$WORK" "$OUT"

if [ ! -d "$SRC" ]; then
    curl -fsSL "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION.tar.xz" | tar xJ -C "$WORK"
fi
bash "$HERE/patch-node-source.sh" "$SRC"

(
    cd "$SRC"
    # The same environment android_configure.py sets for ./configure. make
    # needs it too, because the script doesn't export it to its caller.
    export PATH="$PATH:$TC/bin"
    export CC="$TC/bin/${PREFIX}${MIN_SDK}-clang"
    export CXX="$TC/bin/${PREFIX}${MIN_SDK}-clang++"
    export CC_host=gcc CXX_host=g++
    export GYP_DEFINES="target_arch=$GYP_ARCH v8_target_arch=$GYP_ARCH android_target_arch=$GYP_ARCH host_os=linux OS=android android_ndk_path=$NDK"
    # 16 KB pages (Play requirement). NDK r28+ defaults to this; be explicit.
    export LDFLAGS="-Wl,-z,max-page-size=16384"
    python3 android_configure.py "$NDK" "$MIN_SDK" "$ARCH"
    make -j"$(nproc)"
)

PKG="$WORK/pkg-$ARCH"
rm -rf "$PKG" && mkdir -p "$PKG"
cp "$SRC/out/Release/node" "$PKG/libnode_exec.so"
"$TC/bin/llvm-strip" "$PKG/libnode_exec.so"
"$TC/bin/llvm-readelf" -hlWd "$PKG/libnode_exec.so" > "$PKG/readelf.txt"
if grep -q 'libc++_shared.so' "$PKG/readelf.txt"; then
    cp "$TC/sysroot/usr/lib/$PREFIX/libc++_shared.so" "$PKG/"
fi

# Every PT_LOAD segment must be aligned to at least 16 KB (0x4000).
ALIGNS=$(awk '$1 == "LOAD" { print $NF }' "$PKG/readelf.txt")
for a in $ALIGNS; do
    if [ $((a)) -lt 16384 ]; then
        echo "error: LOAD segment aligned to $a, need >= 0x4000 for 16 KB page devices" >&2
        exit 1
    fi
done

{
    echo "node: $NODE_VERSION"
    echo "arch: $ARCH (android, API $MIN_SDK)"
    echo "ndk: $NDK_VERSION ($(basename "$NDK"))"
    echo "load alignment: $(echo $ALIGNS | tr '\n' ' ')"
    echo "needed: $(grep -oE 'Shared library: \[[^]]+\]' "$PKG/readelf.txt" | sed -E 's/.*\[(.*)\]/\1/' | tr '\n' ' ')"
    echo "bytes: $(stat -c %s "$PKG/libnode_exec.so")"
} > "$PKG/build-info.txt"
rm "$PKG/readelf.txt"
cat "$PKG/build-info.txt"

TARBALL="$OUT/node-$NODE_VERSION-android-$ARCH.tar.gz"
tar czf "$TARBALL" -C "$PKG" .
(cd "$OUT" && sha256sum "$(basename "$TARBALL")" > "$(basename "$TARBALL").sha256")
echo "wrote $TARBALL"
