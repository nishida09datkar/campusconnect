@echo off
setlocal
if exist "C:\Users\User\.m2\wrapper\dists\apache-maven-3.9.16\0daed3be3ebd1c706f0e69e8b07c6b73f5cc4ea3dfce72a8d0ec2e849ca2ddb0\bin\mvn.cmd" (
    "C:\Users\User\.m2\wrapper\dists\apache-maven-3.9.16\0daed3be3ebd1c706f0e69e8b07c6b73f5cc4ea3dfce72a8d0ec2e849ca2ddb0\bin\mvn.cmd" %*
    exit /b %ERRORLEVEL%
)
if defined MAVEN_HOME if exist "%MAVEN_HOME%\bin\mvn.cmd" (
    "%MAVEN_HOME%\bin\mvn.cmd" %*
    exit /b %ERRORLEVEL%
)
if exist "%USERPROFILE%\apache-maven-3.9.9\bin\mvn.cmd" (
    "%USERPROFILE%\apache-maven-3.9.9\bin\mvn.cmd" %*
    exit /b %ERRORLEVEL%
)
mvn %*
exit /b %ERRORLEVEL%
