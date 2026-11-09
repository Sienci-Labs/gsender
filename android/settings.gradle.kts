pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        // usb-serial-for-android (mik3y) is published via JitPack, not Maven Central.
        maven { url = uri("https://jitpack.io") }
    }
}

rootProject.name = "gsender-pendant"
include(":app")
