!include "MUI2.nsh"

# function to create desktop shortcut
Function createdesktopshortcut
    CreateShortcut "$desktop\${PRODUCT_NAME}.lnk" "$instdir\${PRODUCT_NAME}.exe"
FunctionEnd

# page order: license, directory, install, and finish page defined below
!insertmacro MUI_PAGE_LICENSE "${PROJECT_DIR}\LICENSE"
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