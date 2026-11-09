#!/usr/bin/env bash
# Patches the Node.js source tree for an Android NDK cross-compile.
# Each patch fails loudly if it no longer applies, rather than failing an hour
# later at link time.
#
#   patch-node-source.sh <node source dir>
set -euo pipefail
cd "$1"

# 1. V8 trap handler (nodejs/node#36287).
#    GYP_DEFINES OS=android also applies to the host toolset, so host tools such
#    as mksnapshot are built without the Linux trap-handler sources but with a
#    header that enables them: "undefined reference to
#    v8::internal::trap_handler::TryHandleSignal". Node's own
#    android-patches/trap-handler.h.patch has stale context for Node 24's V8,
#    and android_configure.py ignores the failure. Disabling the handler only
#    affects WebAssembly bounds checks, and it's already off on Android.
th=deps/v8/src/trap-handler/trap-handler.h
perl -0pi -e 's{// X64 on Linux, Windows, MacOS, FreeBSD\.\n.*?// Everything else is unsupported\.\n#else\n#define V8_TRAP_HANDLER_SUPPORTED false\n#endif\n}{// gSender Android: disabled for host and target toolsets alike\n// (nodejs/node#36287; android-patches/trap-handler.h.patch no longer applies).\n#define V8_TRAP_HANDLER_SUPPORTED false\n}s' "$th"
if grep -q 'V8_TRAP_HANDLER_SUPPORTED true' "$th"; then
    echo "error: $th patch did not apply; check the header layout for this Node version" >&2
    exit 1
fi
echo "patched $th"

# 2. zlib ARM CPU detection.
#    On OS=android, zlib calls android_getCpuFeatures() from the NDK's
#    deprecated cpufeatures library, which Node never builds (ld.lld: undefined
#    symbol: android_getCpuFeatures). Bionic has had getauxval(AT_HWCAP) since
#    API 18, so use zlib's Linux path instead.
zg=deps/zlib/zlib.gyp
n=$(grep -c "'ARMV8_OS_ANDROID'" "$zg" || true)
sed -i "s/'ARMV8_OS_ANDROID'/'ARMV8_OS_LINUX'/g" "$zg"
echo "patched $zg ($n define(s))"
