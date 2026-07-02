!include "MUI2.nsh"
!include "nsdialogs.nsh"

# function to create desktop shortcut
Function createDS
    CreateShortcut "$desktop\${PRODUCT_NAME}.lnk" "$instdir\${PRODUCT_NAME}.exe"
FunctionEnd

var Checkbox
Function showNewCheckbox
    ${NSD_CreateCheckbox} 180 213 100u 10u "Create Start Menu Shortcut"
    Pop $Checkbox
    # Set tranparent color for control 
    SetCtlColors $Checkbox 0xFFFFFF 0xFFFFFF
FunctionEnd

Function checkboxLeave
    ${NSD_GetState} $Checkbox $1
    ${If} $0 <> ${BST_UNCHECKED}
        CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_NAME}.exe"
    ${EndIf}
FunctionEnd

Function MyCustomPage
  Quit
FunctionEnd


# page order: license, directory, install, and finish page defined below
!insertmacro MUI_PAGE_LICENSE "${PROJECT_DIR}\LICENSE"

!insertmacro MUI_PAGE_DIRECTORY

!insertmacro MUI_PAGE_INSTFILES

# readme checkbox used as desktop shortcut
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Create Desktop Shortcut"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION createDS
!define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED
# start menu folder
!define MUI_PAGE_CUSTOMFUNCTION_SHOW showNewCheckbox
!define MUI_PAGE_CUSTOMFUNCTION_LEAVE checkboxLeave
# run after closing installer checkbox
# NOTE: the installer runs elevated (perMachine), so launching the exe
# directly would make gSender inherit the admin token. Use
# StdUtils.ExecShellAsUser to relaunch with the normal (non-elevated)
# user token so gSender does not run as administrator.
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_FUNCTION RunAsUser
!define MUI_FINISHPAGE_RUN_TEXT "Run gSender"

Function RunAsUser
    # Launch via explorer.exe so the app inherits explorer's normal
    # (medium-integrity) token instead of the installer's admin token.
    # This avoids needing the StdUtils plugin, which is not bundled.
    Exec '"$WINDIR\explorer.exe" "$INSTDIR\${PRODUCT_NAME}.exe"'
FunctionEnd
# insert finish page
!insertmacro MUI_PAGE_FINISH

# custom page that exits immediately
# need this to cut off all the electron-builder generated pages
Page Custom MyCustomPage