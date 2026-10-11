@echo off
setlocal
echo Starting CampusConnect Spring Boot Backend (Java 21)...
call "%~dp0mvn.cmd" spring-boot:run
pause
