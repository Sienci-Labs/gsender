import groovy.json.JsonSlurper
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Inputs produced outside Gradle (see android/README.md):
//   ../dist/android/assets      yarn android:payload   (server bundle + pendant UI)
//   node-runtime/jniLibs        yarn android:runtime   (Node.js for arm64)
val repoRoot: File = rootProject.projectDir.parentFile
val payloadAssets: File = File(repoRoot, "dist/android/assets")
val nodeJniLibs: File = rootProject.file("node-runtime/jniLibs")

// versionName follows the gSender version; versionCode is the commit count
// (same scheme as the desktop branch builds), overridable with
// -PgsenderVersionCode=N.
@Suppress("UNCHECKED_CAST")
val gsenderVersion: String =
    (JsonSlurper().parse(File(repoRoot, "src/package.json")) as Map<String, Any>)["version"] as String
// CI must check out full history (fetch-depth: 0) or the count is 1.
val gsenderVersionCode: Int =
    (findProperty("gsenderVersionCode") as String?)?.toInt()
        ?: runCatching {
            providers.exec {
                commandLine("git", "-C", repoRoot.path, "rev-list", "--count", "HEAD")
                isIgnoreExitValue = true
            }.standardOutput.asText.get().trim().toIntOrNull()
        }.getOrNull()
        ?: 1

android {
    namespace = "org.sienci.gsender.pendant"
    compileSdk = 36

    defaultConfig {
        applicationId = "org.sienci.gsender.pendant"
        minSdk = 29
        targetSdk = 36
        versionCode = gsenderVersionCode
        versionName = gsenderVersion
    }

    // arm64-v8a only (~42 MB); Node is most of it. No x86_64/emulator build -
    // physical arm64 tablets are the only target.
    splits {
        abi {
            isEnable = true
            reset()
            include("arm64-v8a")
            isUniversalApk = false
        }
    }

    sourceSets["main"].assets.srcDir(payloadAssets)
    sourceSets["main"].jniLibs.srcDir(nodeJniLibs)

    packaging {
        jniLibs {
            // Extract native libs on install (extractNativeLibs=true): Node
            // runs as an executable from nativeLibraryDir, the only app
            // location Android 10+ (W^X) allows exec from.
            useLegacyPackaging = true
            // Already stripped by android/node/build-node.sh.
            keepDebugSymbols += "**/*.so"
        }
    }

    androidResources {
        // The default pattern drops dotfiles and `_`-prefixed directories; the
        // payload must be packaged verbatim.
        ignoreAssetsPattern = "!.svn:!.git:!.ds_store:!*.scc:!CVS:!thumbs.db:!picasa.ini:!*~"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    // USB serial bridge (android/app/src/main/java/.../pendant/usb/). Pure
    // Kotlin/Java, no JNI, published via JitPack (see settings.gradle.kts).
    // Check https://github.com/mik3y/usb-serial-for-android/releases for the
    // latest tag before bumping.
    //
    // androidx.annotation is excluded: it's compile-time-only annotations
    // (not used at runtime by this library), and this project deliberately
    // stays off AndroidX (android.useAndroidX=false in gradle.properties;
    // see MainActivity.kt) - pulling it in trips AGP's checkDebugAarMetadata.
    implementation("com.github.mik3y:usb-serial-for-android:3.9.0") {
        exclude(group = "androidx.annotation")
    }
}

// Fail early, with the fix, if the inputs built outside Gradle are missing.
val checkAndroidInputs by tasks.registering {
    val server = File(payloadAssets, "payload/server/server.js")
    val pendant = File(payloadAssets, "payload/server/pendant/index.html")
    val node = File(nodeJniLibs, "arm64-v8a/libnode_exec.so")
    doLast {
        val missing = buildList {
            if (!server.exists() || !pendant.exists()) add("JS payload: run `yarn android:payload` from the repo root")
            if (!node.exists()) add("Node runtime: run `yarn android:runtime` from the repo root")
        }
        if (missing.isNotEmpty()) throw GradleException("Missing build inputs:\n  " + missing.joinToString("\n  "))
    }
}
tasks.named("preBuild") { dependsOn(checkAndroidInputs) }
