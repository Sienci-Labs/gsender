!include "MUI2.nsh"

# function to create desktop shortcut
Function createdesktopshortcut
    CreateShortcut "$desktop\${PRODUCT_NAME}.lnk" "$instdir\${PRODUCT_NAME}.exe"
FunctionEnd

# define license data
LicenseData "LICENSE"
LicenseForceSelection checkbox

# page order: license, directory, install, and finish page defined below
Page License
Page Directory
Page InstFiles
# readme checkbox used as desktop shortcut
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Create Desktop Shortcut"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION createdesktopshortcut
# run after closing installer checkbox
!define MUI_FINISHPAGE_RUN "${PRODUCT_NAME}.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Run gSender"
# insert finish page
!insertmacro MUI_PAGE_FINISH