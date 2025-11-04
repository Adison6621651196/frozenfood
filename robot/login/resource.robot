*** Settings ***
Documentation     A resource file with reusable keywords and variables.
Library           SeleniumLibrary

*** Variables ***
${SERVER}             localhost:4200
${BROWSER}            Chrome
${VALID USER}         admin@gmail.com
${VALID PASSWORD}     admin01
${LOGIN URL}          http://${SERVER}/login
${WELCOME URL}        http://${SERVER}/
${ERROR URL}          http://${SERVER}/login

*** Keywords ***
Open Browser To Login Page
    Open Browser    ${LOGIN URL}    ${BROWSER}
    Maximize Browser Window
    Login Page Should Be Open

Login Page Should Be Open
    Title Should Be    Freezefood
    Wait Until Page Contains Element    id=loginEmail    10s

Go To Login Page
    Go To    ${LOGIN URL}
    Login Page Should Be Open

Input Username
    [Arguments]    ${username}
    Input Text    id=loginEmail    ${username}

Input Password
    [Arguments]    ${password}
    Input Text    id=loginPassword    ${password}

Submit Credentials
    Click Button    css=button[type="submit"].submit-btn

Welcome Page Should Be Open
    # รอให้ redirect หลัง login (มี delay 1 วินาที)
    Sleep    2s
    # ตรวจสอบว่าออกจากหน้า login แล้ว (ไม่ว่าจะไปที่ไหน)
    Wait Until Location Is Not    ${LOGIN URL}    15s
    Title Should Be    Freezefood

Login Should Have Failed
    # ตรวจสอบว่ายังอยู่ที่หน้า login และมี error message
    Wait Until Location Is          ${ERROR URL}    10s
    Wait Until Page Contains Element    css=.error-message    10s