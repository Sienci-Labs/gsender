#!/usr/bin/env bash
# Spike S1, step 3: install the S1 APK on an emulator and check that the app can
# run Node from its nativeLibraryDir and serve the pendant to its WebView.
# Called from reactivecircus/android-emulator-runner (single line).
#
#   apk-smoke.sh <apk> <label> <results dir>
set -uo pipefail

APK="$1"
LABEL="$2"
RESULTS="$3"
PKG=org.sienci.gsender.s1
PORT=8123
RUNS=3
mkdir -p "$RESULTS"
OUT="$RESULTS/$LABEL.md"
JSON="$RESULTS/$LABEL.json"
FAIL=0

sh_dev() { timeout 60 adb shell "$@" | tr -d '\r'; }
log() { echo "$*" | tee -a "$OUT"; }
s1log() { timeout 30 adb logcat -d -v raw -s S1APK:I | tr -d '\r'; }
# Value of key=NNN from the first S1APK line matching $1
field() { s1log | grep -m1 -E "$1" | sed -nE "s/.*[ ]$2=([0-9]+).*/\1/p"; }

adb wait-for-device
until [ "$(sh_dev getprop sys.boot_completed)" = "1" ]; do sleep 2; done

: > "$OUT"
log "### APK on emulator: $LABEL"
log ""
log "API $(sh_dev getprop ro.build.version.sdk), ABI $(sh_dev getprop ro.product.cpu.abi), page size **$(sh_dev getconf PAGE_SIZE)** bytes, APK $(( $(stat -c %s "$APK") / 1048576 )) MB"
log ""

if ! timeout 300 adb install -r "$APK" > "$RESULTS/$LABEL-install.txt" 2>&1; then
    log "- **FAIL**: install: $(tail -1 "$RESULTS/$LABEL-install.txt")"
    exit 1
fi
LIBDIR=$(sh_dev "dumpsys package $PKG" | sed -nE 's/^ *legacyNativeLibraryDir=(.*)/\1/p' | head -1)
log "- installed; native libs extracted: \`$(sh_dev "ls -l $LIBDIR/*/ 2>/dev/null" | awk '/\.so/ {print $NF" "$5}' | tr '\n' ' ')\`"

EXTRACT_MS=null
READY=()
PAGE=()
# Per-phase timings (ms since onCreate unless noted), one entry per launch
WEBVIEW=()  # WebView constructed
SPAWN=()    # Node process started
NODEMS=()   # Node's own time to ready (since its process start)
for i in $(seq 1 "$RUNS"); do
    sh_dev "am force-stop $PKG" > /dev/null
    timeout 10 adb logcat -c
    sh_dev "am start -W -n $PKG/.MainActivity" > /dev/null
    state=timeout
    for _ in $(seq 1 180); do
        lines=$(s1log)
        if echo "$lines" | grep -qE '^(EXEC_FAILED|NODE_EXITED)'; then state=failed; break; fi
        if echo "$lines" | grep -q '^PAGE_FINISHED'; then state=ok; break; fi
        sleep 0.5
    done
    r=$(field '^READY' t); p=$(field '^PAGE_FINISHED' t); e=$(field '^EXTRACT ms' ms)
    w=$(field '^WEBVIEW_CREATED' t); s=$(field '^SPAWNED' t); n=$(field '^READY' ms)
    [ -n "$e" ] && EXTRACT_MS=$e
    log "- launch $i: $state; extract ${e:-skipped} ms; WebView built at ${w:-?}, Node spawned at ${s:-?}, Node ready at ${r:-?} (Node's own ${n:-?} ms), page loaded at ${p:-?} ms since onCreate"
    WEBVIEW+=("$w"); SPAWN+=("$s"); NODEMS+=("$n")
    if [ "$state" != ok ]; then
        FAIL=1
        log '  ```'
        s1log | tail -5 | sed 's/^/  /' | tee -a "$OUT" > /dev/null
        timeout 30 adb logcat -d -v raw -s S1APK-node:I | tail -15 | tr -d '\r' | sed 's/^/  /' >> "$OUT"
        log '  ```'
        break
    fi
    READY+=("$r"); PAGE+=("$p")
done

# Leave the last launch running for the checks below.
EXEC_LINE=$(s1log | grep -m1 '^EXEC ')
log "- \`${EXEC_LINE:-no EXEC line}\`"
PSLINE=$(sh_dev "ps -A -Z -o LABEL,USER,PID,NAME" | grep libnode_exec | head -1)
log "- Node process (SELinux label, user, pid, name): \`${PSLINE:-not running}\`"
case "$PSLINE" in *untrusted_app*) ;; *) FAIL=1 ;; esac

adb forward tcp:$PORT tcp:$PORT > /dev/null
code() { curl -s -o /dev/null -w '%{http_code}' --max-time 10 "http://127.0.0.1:$PORT/$1"; }
API=$(code api/state); PENDANT=$(code pendant/)
log "- HTTP from host via adb forward: \`/api/state\` $API, \`/pendant/\` $PENDANT"
[ "$API$PENDANT" = "200200" ] || FAIL=1

WEB_ERRORS=$(timeout 30 adb logcat -d -v raw -s S1APK-web:I | grep -c '^ERROR')
log "- pendant console errors in WebView: $WEB_ERRORS"

timeout 30 adb logcat -d -v time -s S1APK:I S1APK-node:I S1APK-web:I > "$RESULTS/$LABEL-logcat.txt"
sh_dev "am force-stop $PKG" > /dev/null

first() { echo "${1:-null}"; }
min_warm() { local v; v=$(printf '%s\n' "${@:2}" | sed '/^$/d' | sort -n | head -1); echo "${v:-null}"; }
cat > "$JSON" <<EOF
{"label":"$LABEL","apk_bytes":$(stat -c %s "$APK"),"extract_ms":$EXTRACT_MS,"first_ready_ms":$(first "${READY[0]:-}"),"warm_ready_ms":$(min_warm "${READY[@]}"),"first_page_ms":$(first "${PAGE[0]:-}"),"warm_page_ms":$(min_warm "${PAGE[@]}"),"warm_webview_ms":$(min_warm "${WEBVIEW[@]}"),"warm_spawn_ms":$(min_warm "${SPAWN[@]}"),"first_node_ms":$(first "${NODEMS[0]:-}"),"warm_node_ms":$(min_warm "${NODEMS[@]}"),"untrusted_app":$(case "$PSLINE" in *untrusted_app*) echo true;; *) echo false;; esac),"http_ok":$([ "$API$PENDANT" = "200200" ] && echo true || echo false),"web_errors":$WEB_ERRORS,"fail":$FAIL}
EOF
log ""
log "Result: $([ $FAIL -eq 0 ] && echo PASS || echo FAIL)"
[ -n "${GITHUB_STEP_SUMMARY:-}" ] && cat "$OUT" >> "$GITHUB_STEP_SUMMARY"
exit $FAIL
