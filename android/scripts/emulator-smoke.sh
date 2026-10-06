#!/usr/bin/env bash
# Installs the pendant APK on a running emulator/device and checks the full
# path: NodeService starts Node from nativeLibraryDir, the server reports
# ready, and the pendant page loads in the WebView. Launches twice (first
# launch installs the payload; second is a warm cold-start).
#
#   android/scripts/emulator-smoke.sh <apk> <results dir>
#
# Not run by CI (android.yml builds arm64-v8a only, no emulator); kept here
# for manual smoke-testing against an emulator or a real USB-connected device.
set -uo pipefail

APK="$1"
RESULTS="$2"
PKG=org.sienci.gsender.pendant
TAG=GSenderPendant
mkdir -p "$RESULTS"
OUT="$RESULTS/summary.md"
FAIL=0

sh_dev() { timeout 60 adb shell "$@" | tr -d '\r'; }
log() { echo "$*" | tee -a "$OUT"; }
# One rule per tag: logcat keeps only the last rule for a tag, so
# "$TAG:I" "$TAG:W" would mean W and above and hide every Log.i line.
applog() { timeout 30 adb logcat -d -v raw -s "$TAG:I" | tr -d '\r'; }
# Value of key=NNN from the last app log line matching $1
field() { applog | grep -E "$1" | tail -1 | sed -nE "s/.* $2=([0-9]+).*/\1/p"; }

adb wait-for-device
until [ "$(sh_dev getprop sys.boot_completed)" = "1" ]; do sleep 2; done

: > "$OUT"
log "### gSender Pendant on $(sh_dev getprop ro.product.model) (API $(sh_dev getprop ro.build.version.sdk), $(sh_dev getprop ro.product.cpu.abi), page size $(sh_dev getconf PAGE_SIZE))"
log ""
if ! timeout 300 adb install -r "$APK" > "$RESULTS/install.txt" 2>&1; then
    log "- **FAIL** install: $(tail -1 "$RESULTS/install.txt")"
    exit 1
fi
# Notifications permission, so the foreground-service notification shows (API 33+).
sh_dev "pm grant $PKG android.permission.POST_NOTIFICATIONS" > /dev/null 2>&1

launch() {
    sh_dev "am force-stop $PKG" > /dev/null
    timeout 10 adb logcat -c
    sh_dev "am start -W -n $PKG/.MainActivity" > "$RESULTS/am-start-$run.txt"
    state=timeout
    for _ in $(seq 1 180); do
        lines=$(applog)
        if echo "$lines" | grep -qE '^STATE Failed'; then state=failed; break; fi
        if echo "$lines" | grep -q '^PAGE_LOADED'; then state=ok; break; fi
        if echo "$lines" | grep -q '^PAGE_ERROR'; then state=page-error; break; fi
        sleep 0.5
    done
}

declare -A T
for run in first warm; do
    launch
    installed=$(applog | grep -m1 '^PAYLOAD_INSTALLED' | sed -nE 's/.*ms=([0-9]+).*/\1/p')
    T[${run}_ready]=$(field '^STATE Ready' t)
    T[${run}_node]=$(field '^STATE Ready' node_ms)
    T[${run}_page]=$(field '^PAGE_LOADED' t)
    log "- $run launch: **$state**; payload install ${installed:+$installed ms}${installed:-skipped}, server ready ${T[${run}_ready]:-?} ms (Node ${T[${run}_node]:-?} ms), pendant loaded ${T[${run}_page]:-?} ms after process start"
    if [ "$state" != ok ]; then
        FAIL=1
        timeout 30 adb logcat -d -v time > "$RESULTS/logcat-$run.txt"
        log "  am start: $(grep -E '^(Status|Error)' "$RESULTS/am-start-$run.txt" | tr '\n' ' ')"
        log "  pids: app $(sh_dev "pidof $PKG"), node $(sh_dev "pidof libnode_exec.so")"
        log '  ```'
        app_lines=$(applog)
        echo "$app_lines" | tail -8 | sed 's/^/  /' >> "$OUT"
        if [ -z "$app_lines" ]; then
            # No app output at all: look for a startup crash, exec/linker error or SELinux denial.
            grep -iE 'pendant|AndroidRuntime|libnode|linker|avc:' "$RESULTS/logcat-$run.txt" | tr -d '\r' | tail -20 | sed 's/^/  /' >> "$OUT"
        fi
        timeout 30 adb logcat -d -v raw -s "$TAG-node:I" | tr -d '\r' | tail -12 | sed 's/^/  /' >> "$OUT"
        timeout 30 adb logcat -d -b crash | tr -d '\r' | tail -12 | sed 's/^/  /' >> "$OUT"
        log '  ```'
        break
    fi
done

if [ $FAIL -eq 0 ]; then
    PS=$(sh_dev "ps -A -Z -o LABEL,USER,PID,NAME" | grep libnode_exec | head -1)
    log "- Node process: \`${PS:-not running}\`"
    case "$PS" in *untrusted_app*) ;; *) FAIL=1 ;; esac
    PORT=$(field '^STATE Ready' port)
    adb forward tcp:18123 tcp:"$PORT" > /dev/null
    API=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://127.0.0.1:18123/api/state)
    PENDANT=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://127.0.0.1:18123/pendant/)
    log "- server on 127.0.0.1:$PORT: \`/api/state\` $API, \`/pendant/\` $PENDANT"
    [ "$API$PENDANT" = "200200" ] || FAIL=1
    WEB_ERRORS=$(timeout 30 adb logcat -d -v raw -s "$TAG-web:I" | grep -c '^ERROR')
    log "- pendant console errors: $WEB_ERRORS"
    NOTIF=$(sh_dev "dumpsys notification --noredact" | grep -c "pkg=$PKG")
    log "- foreground service notification present: $([ "$NOTIF" -gt 0 ] && echo yes || echo no)"
fi
timeout 30 adb logcat -d -v time -s "$TAG:I" "$TAG-node:I" "$TAG-web:I" > "$RESULTS/app-log.txt"

cat > "$RESULTS/results.json" <<EOF
{"first_ready_ms":${T[first_ready]:-null},"first_page_ms":${T[first_page]:-null},"warm_ready_ms":${T[warm_ready]:-null},"warm_node_ms":${T[warm_node]:-null},"warm_page_ms":${T[warm_page]:-null},"fail":$FAIL}
EOF
log ""
log "Result: $([ $FAIL -eq 0 ] && echo PASS || echo FAIL)"
[ -n "${GITHUB_STEP_SUMMARY:-}" ] && cat "$OUT" >> "$GITHUB_STEP_SUMMARY"
exit $FAIL
