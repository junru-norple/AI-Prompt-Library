@echo off
REM SPDX-License-Identifier: MIT
setlocal

set "ATLAS_PATH=%~dp0prompt-library\visual-catalog\index.html"

if not exist "%ATLAS_PATH%" (
    echo ERROR: Visual Prompt Atlas entry file was not found.
    echo Expected path: "%ATLAS_PATH%"
    endlocal
    exit /b 2
)

start "" "%ATLAS_PATH%"
if errorlevel 1 (
    echo ERROR: Windows could not open Visual Prompt Atlas with the default browser.
    endlocal
    exit /b 1
)

endlocal
exit /b 0
