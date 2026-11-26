@echo off
setlocal EnableExtensions
title Build RGS Staff Portal APK
cd /d "%~dp0"
echo.
echo  ===== RGS Staff Portal - make the Android app (APK) =====
echo  This needs internet the first time (about 400 MB: Android tools and Gradle). Later builds are quick.
echo.

rem ---- 1. Java 17 to 21
java -version 2>&1 | findstr /r /c:"version \"17\." /c:"version \"18\." /c:"version \"19\." /c:"version \"20\." /c:"version \"21\." >nul
if errorlevel 1 (
  echo  Java 17 is needed and was not found.
  where winget >nul 2>&1
  if errorlevel 1 (
    echo  Please install "Microsoft Build of OpenJDK 17" from https://learn.microsoft.com/java/openjdk/download and run this file again.
    goto :fail
  )
  echo  Installing Java 17 with winget...
  winget install -e --id Microsoft.OpenJDK.17 --accept-package-agreements --accept-source-agreements
  echo.
  echo  Java was installed. Please CLOSE this window and run build_apk.bat once more.
  goto :fail
)

set "TOOLS=%~dp0.build-tools"
set "SDK=%TOOLS%\android-sdk"
set "GRADLE=%TOOLS%\gradle-8.7"
if not exist "%TOOLS%" mkdir "%TOOLS%"
set "PS=powershell -NoProfile -ExecutionPolicy Bypass -Command"

rem ---- 2. Android command line tools
if not exist "%SDK%\cmdline-tools\latest\bin\sdkmanager.bat" (
  echo  Downloading Android command line tools...
  %PS% "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing -Uri 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip' -OutFile '%TOOLS%\cmdtools.zip'"
  if errorlevel 1 goto :netfail
  %PS% "Expand-Archive -Force '%TOOLS%\cmdtools.zip' '%TOOLS%\cmdtmp'"
  if errorlevel 1 goto :fail
  if not exist "%SDK%\cmdline-tools" mkdir "%SDK%\cmdline-tools"
  move /y "%TOOLS%\cmdtmp\cmdline-tools" "%SDK%\cmdline-tools\latest" >nul
  rmdir /s /q "%TOOLS%\cmdtmp" 2>nul
  del "%TOOLS%\cmdtools.zip" 2>nul
)

rem ---- 3. Android platform + build tools (licences accepted for you: you accept Google's Android SDK licence by running this file)
if not exist "%SDK%\platforms\android-34" (
  echo  Installing Android platform 34 and build tools...
  (for /l %%i in (1,1,40) do @echo y) | call "%SDK%\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root="%SDK%" --licenses >nul
  call "%SDK%\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root="%SDK%" "platform-tools" "platforms;android-34" "build-tools;34.0.0"
  if errorlevel 1 goto :netfail
)

rem ---- 4. Gradle
if not exist "%GRADLE%\bin\gradle.bat" (
  echo  Downloading Gradle...
  %PS% "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing -Uri 'https://services.gradle.org/distributions/gradle-8.7-bin.zip' -OutFile '%TOOLS%\gradle.zip'"
  if errorlevel 1 goto :netfail
  %PS% "Expand-Archive -Force '%TOOLS%\gradle.zip' '%TOOLS%'"
  if errorlevel 1 goto :fail
  del "%TOOLS%\gradle.zip" 2>nul
)

rem ---- 5. build
set "SDKFWD=%SDK:\=/%"
> local.properties echo sdk.dir=%SDKFWD%
set "ANDROID_HOME=%SDK%"
set "ANDROID_SDK_ROOT=%SDK%"
echo  Building the app...
call "%GRADLE%\bin\gradle.bat" assembleDebug --no-daemon
if errorlevel 1 goto :fail

if not exist "app\build\outputs\apk\debug\app-debug.apk" goto :fail
copy /y "app\build\outputs\apk\debug\app-debug.apk" "RGS-Staff-Portal.apk" >nul
echo.
echo  ===== DONE =====
echo  The app is here:  %~dp0RGS-Staff-Portal.apk
echo  Copy this file to the phones (USB cable, WhatsApp, Bluetooth) and open it to install.
echo  (The phone may ask to allow "Install unknown apps" for the app you opened it from.)
explorer /select,"%~dp0RGS-Staff-Portal.apk"
pause
exit /b 0

:netfail
echo.
echo  A download failed. Check the internet connection (or a firewall / antivirus blocking PowerShell) and run build_apk.bat again.
:fail
echo.
echo  The APK was not built. Scroll up to read the message, or send a photo of this window.
pause
exit /b 1
