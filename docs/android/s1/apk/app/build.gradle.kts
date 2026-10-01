import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "org.sienci.gsender.s1"
    compileSdk = 36

    defaultConfig {
        applicationId = "org.sienci.gsender.s1"
        minSdk = 29
        targetSdk = 36
        versionCode = (project.findProperty("s1VersionCode") as String?)?.toInt() ?: 1
        versionName = "s1"
    }

    // One APK per ABI, so CI can report the real arm64 size.
    splits {
        abi {
            isEnable = true
            reset()
            include("arm64-v8a", "x86_64")
            isUniversalApk = false
        }
    }

    packaging {
        jniLibs {
            // Extract native libs on install (extractNativeLibs=true): Node runs
            // as an executable from nativeLibraryDir, the only app location
            // Android 10+ (W^X) allows exec from.
            useLegacyPackaging = true
            // The binaries are already stripped by the S1 workflow.
            keepDebugSymbols += "**/*.so"
        }
    }

    androidResources {
        // Default pattern drops dotfiles and `_`-prefixed directories; the
        // server/pendant payload must be copied verbatim.
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
