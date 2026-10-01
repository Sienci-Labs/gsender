#!/usr/bin/env bash
# Spike S1: run the cross-compiled Node + bundled gSender server on an Android
# emulator and record startup timing. Called by .github/workflows/android-s1-node.yml
# from inside reactivecircus/android-emulator-runner (one line, because that
# action runs each script line in a separate shell).
#
#   emulator-smoke.sh <dir with node + payload/> <label> <results dir>
#
# The binary runs from /data/local/tmp as the shell user. That proves it runs on
# bionic with this page size; running from an app's nativeLibraryDir (W^X) needs
# an APK and is a separate step.
set -uo pipefail

SRC_DIR="$1"
LABEL="$2"
RESULTS="$3"
DEV=/data/local/tmp/s1
PORT=8123
RUNS=3
mkdir -p "$RESULTS"
OUT="$RESULTS/$LABEL.md"
JSON="$RESULTS/$LABEL.json"
FAIL=0

# Every device command gets a deadline: a hung `adb shell` would otherwise sit
# until the job's timeout and lose all results.
sh_dev() { timeout 60 adb shell "$@" | tr -d '\r'; }
log() { echo "$*" | tee -a "$OUT"; }

adb wait-for-device
until [ "$(sh_dev getprop sys.boot_completed)" = "1" ]; do sleep 2; done

SDK=$(sh_dev getprop ro.build.version.sdk)
ABI=$(sh_dev getprop ro.product.cpu.abi)
PAGE=$(sh_dev getconf PAGE_SIZE)

: > "$OUT"
log "### Emulator: $LABEL"
log ""
log "API $SDK, ABI $ABI, page size **$PAGE** bytes"
log ""

sh_dev "rm -rf $DEV && mkdir -p $DEV/home"
adb push "$SRC_DIR/node" "$DEV/node" > /dev/null
adb push "$SRC_DIR/payload/." "$DEV/" > /dev/null
if [ -f "$SRC_DIR/libc++_shared.so" ]; then adb push "$SRC_DIR/libc++_shared.so" "$DEV/" > /dev/null; fi
sh_dev "chmod 755 $DEV/node"

ENV="HOME=$DEV/home GSENDER_USER_DATA=$DEV/home/userdata LD_LIBRARY_PATH=$DEV"

VERSION=$(sh_dev "cd $DEV && $ENV ./node -p 'process.version + \" \" + process.arch + \" \" + process.platform'" 2>&1)
log "- \`node -p\`: \`$VERSION\`"
case "$VERSION" in v*) ;; *) log "- **FAIL**: binary did not run"; FAIL=1 ;; esac

# Bare interpreter startup (no server), median of 5.
BARE=()
for _ in 1 2 3 4 5; do
    BARE+=("$(sh_dev "cd $DEV && s=\$(date +%s%N); $ENV ./node -e 0; e=\$(date +%s%N); echo \$(( (e - s) / 1000000 ))")")
done
BARE_MED=$(printf '%s\n' "${BARE[@]}" | sort -n | sed -n 3p)
log "- \`node -e 0\` startup: median **${BARE_MED} ms** (runs: ${BARE[*]})"

# Server startup series. Run 1 is a cold first launch (creates rc files, and
# populates the compile cache when one is set); runs 2..N are warm.
#   run_series <name> <extra env>   → fills READY_MS
run_series() {
    local name="$1" extra="$2"
    READY_MS=()
    for i in $(seq 1 "$RUNS"); do
        sh_dev "pkill -f server/server.js; rm -f $DEV/log.txt" > /dev/null 2>&1
        # Fully detach the server: no PTY (-T), adb stdin closed (-n), and the
        # server's stdin from /dev/null. Otherwise adb shell waits for the
        # background process to exit, and the server never does.
        timeout 20 adb shell -T -n "cd $DEV && $ENV $extra nohup ./node server/server.js -p $PORT -H 127.0.0.1 < /dev/null > $DEV/log.txt 2>&1 &" > /dev/null
        READY=""
        for _ in $(seq 1 120); do
            READY=$(sh_dev "grep -m1 -E 'S1_READY|S1_FAILED' $DEV/log.txt 2>/dev/null")
            [ -n "$READY" ] && break
            sleep 0.5
        done
        log "- $name run $i: \`${READY:-timed out after 60 s}\`"
        case "$READY" in
            S1_READY*) READY_MS+=("$(echo "$READY" | sed -E 's/.*ms=([0-9]+).*/\1/')") ;;
            *) FAIL=1 ;;
        esac
    done
}

run_series "server" ""
COLD=${READY_MS[0]:-null}
WARM=$(printf '%s\n' "${READY_MS[@]:1}" | sort -n | head -1)

# Same again with V8's on-disk compile cache (Node 22+), as the app would run it.
sh_dev "rm -rf $DEV/home/compile-cache" > /dev/null
run_series "server + compile cache" "NODE_COMPILE_CACHE=$DEV/home/compile-cache"
CC_FIRST=${READY_MS[0]:-null}
CC_WARM=$(printf '%s\n' "${READY_MS[@]:1}" | sort -n | head -1)
CC_BYTES=$(sh_dev "du -sk $DEV/home/compile-cache 2>/dev/null" | awk '{print $1 * 1024}')
log "- compile cache on disk: $(( ${CC_BYTES:-0} / 1024 )) KB"

# HTTP checks against the last (still running) server.
adb forward tcp:$PORT tcp:$PORT > /dev/null
code() { curl -s -o /dev/null -w '%{http_code}' --max-time 10 "http://127.0.0.1:$PORT/$1"; }
API=$(code api/state)
PENDANT=$(code pendant/)
SOCK=$(code 'socket.io/?EIO=4&transport=polling')
ASSET=$(curl -s --max-time 10 "http://127.0.0.1:$PORT/pendant/" | grep -oE 'assets/[^"]+\.js' | head -1)
ASSET_CODE=$([ -n "$ASSET" ] && code "pendant/$ASSET" || echo none)
log "- HTTP: \`/api/state\` $API, \`/pendant/\` $PENDANT, pendant JS $ASSET_CODE, Socket.IO handshake $SOCK"
for c in "$API" "$PENDANT" "$SOCK" "$ASSET_CODE"; do [ "$c" = "200" ] || FAIL=1; done

RSS=$(sh_dev "grep -m1 S1_READY $DEV/log.txt" | sed -E 's/.*rss=([0-9]+MB).*/\1/')
log "- RSS at ready: $RSS"
ERRORS=$(sh_dev "grep -ciE 'error' $DEV/log.txt")
log "- lines mentioning 'error' in server log: $ERRORS"
adb pull "$DEV/log.txt" "$RESULTS/$LABEL-server.log" > /dev/null 2>&1
sh_dev "pkill -f server/server.js" > /dev/null 2>&1

cat > "$JSON" <<EOF
{"label":"$LABEL","api":"$SDK","abi":"$ABI","page_size":"$PAGE","node":"$VERSION","bare_ms":${BARE_MED:-null},"cold_ready_ms":$COLD,"warm_ready_ms":${WARM:-null},"cc_first_ready_ms":$CC_FIRST,"cc_warm_ready_ms":${CC_WARM:-null},"cc_bytes":${CC_BYTES:-null},"http_ok":$([ "$API$PENDANT$SOCK$ASSET_CODE" = "200200200200" ] && echo true || echo false),"fail":$FAIL}
EOF
log ""
log "Result: $([ $FAIL -eq 0 ] && echo PASS || echo FAIL)"

[ -n "${GITHUB_STEP_SUMMARY:-}" ] && cat "$OUT" >> "$GITHUB_STEP_SUMMARY"
exit $FAIL
