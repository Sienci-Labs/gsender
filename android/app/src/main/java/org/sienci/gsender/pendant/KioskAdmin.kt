package org.sienci.gsender.pendant

import android.app.admin.DeviceAdminReceiver

/**
 * Device-admin component, needed only to make the app the device owner for a
 * locked-down kiosk tablet (README "Kiosk mode"). It handles no callbacks.
 */
class KioskAdmin : DeviceAdminReceiver()
