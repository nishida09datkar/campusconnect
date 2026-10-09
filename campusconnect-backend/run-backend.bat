@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;C:\Users\nishi\apache-maven-3.9.9\bin;%PATH%"
echo Starting CampusConnect Spring Boot Backend (Java 21)...
call "C:\Users\nishi\apache-maven-3.9.9\bin\mvn.cmd" spring-boot:run
pause
