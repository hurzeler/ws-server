#ifdef __cplusplus
extern "C"
{
#endif
  uint8_t temperature_sens_read();
#ifdef __cplusplus
}
#endif
long lastIntervalTime01;

// Constants for RPM thresholds
const int HIGH_RPM_THRESHOLD = 250;
const int LOW_RPM_THRESHOLD = 100;
const unsigned long DEBOUNCE_TIME = 500; // 500ms debounce time

// Variables for RPM monitoring

// Variables for debounce timing
unsigned long highRpmStartTime = 0;
unsigned long lowRpmStartTime = 0;
bool highRpmTimerActive = false;
bool lowRpmTimerActive = false;

#define WEBSOCKETS_SERVER_CLIENT_MAX 8
#include "WiFi.h"
#include "ESPAsyncWebServer.h"
#include "SPIFFS.h"
#include <WebSocketsServer.h>
#include <esp_task_wdt.h>
#include <HardwareSerial.h>

#include <Preferences.h>
Preferences preferences;
unsigned int counter = 0;
unsigned int counterPrev = -1;

// Serial2
#define RXD2 16
#define TXD2 17
HardwareSerial MySerial(2);

// Hall MCU
int revolutions = 0;
int direct = 1;
int directPrev = -1;
int pulseCount = 0;
int pulseCountPrev = 0;
int pulseCountLimit = 0;
int pulseCountLimitPrev = -1;
int pulseCountStopStatus = 0;
int pulseCountStopStatusPrev = -1;
int hallPPM;
int hallRPM;
int hallRPMPrev = -1;
int hallTemperature;

float hallMPUtime = 0;

float motorTemperature = 0;
float mainBatteryVoltage = 0;

float temperaturePrev;
float VBAT = 0;
float VBATPrev = -1;

int RSSIVal = 0;

long lastIntervalTime02 = 0;
int Interval01 = 1000;

long LoadCell1Prev = -1;
long LoadCell1Cal = 0;
long LoadCell1 = 0;

// Constants
const char *ssid = "eWinchETek";
const char *password = "0439641049";
// const char *ssid = "eWinchWiFi";
// const char *password =  "0417530972";

// debounce
#define LSMSG 4
#define DEBOUNCE_TIME 50 // the debounce time in millisecond, increase this time if it still chatters
// Variables will change:
int lastSteadyState = LOW;      // the previous steady state from the input pin
int lastFlickerableState = LOW; // the previous flickerable state from the input pin
int currentState;               // the current reading from the input pin
// the following variables are unsigned longs because the time, measured in
// milliseconds, will quickly become a bigger number than can be stored in an int.
unsigned long lastDebounceTime = 0; // the last time the output pin was toggled

int lineStopActive = 0;

#define SafeState 12
#define DEBOUNCE_TIMESS 50 // the debounce time in millisecond, increase this time if it still chatters
// Variables will change:
int lastSteadyStateSS = LOW;      // the previous steady state from the input pin
int lastFlickerableStateSS = LOW; // the previous flickerable state from the input pin
int currentStateSS;               // the current reading from the input pin
// the following variables are unsigned longs because the time, measured in
// milliseconds, will quickly become a bigger number than can be stored in an int.
unsigned long lastDebounceTimeSS = 0; // the last time the output pin was toggled

int safeStateActive = 0;

// externals
const byte DVTFS1 = 19;
const byte DVTrev = 23;
const byte DVTDS1 = 5;
const byte DVTDS2 = 18;
const byte DVTDS3 = 22;

const byte Vdiv72v = 35;
const byte PSunlatch = 21;
const byte ResBNK1 = 27;
const byte spareR1 = 0;

#define DAC1 25 // Identify the digital to analog converter pin
#define DAC2 26 // Identify the digital to analog converter pin

long ResBNKtime;

int payinState = 1;
int stepState = 1;
int payoutState = 1;
int SafeStopState = 0;
int WPowerPotVal = 0;
int WPowerPotValPrev = 0;
int WRegenPotVal = 0;
int WRegenPotValPrev = 0;

int WTensRPS1 = 0;
int WTensRPS2 = 0;
int WTensRPS3 = 0;

int WPowerPotValMapped;
int WPowerPotValMapThrLow = 18; // 30   95  50 no creeping
int WPowerPotValMapThrHigh = 254;
int WPowerPotValPISTMapThrLow = 0;
int WPowerPotValPISTMapThrHigh = 60;
int WRegenPotValMapped;
int WRegenPotValMapThrLow = 18;
int WRegenPotValMapThrHigh = 254; // 100
int LoadCelllMapped;
int LoadCell1MapThrLow = 0;
int LoadCell1MapThrHigh = 130;

int TensDiff;
int WinchControl = 0;

long lastLoad1Read = 0;
long lastADS1015Read = 0;
long lastESP32Read = 0;
int radioInPrev = 0;

int LSMSGcnt = 0;
int LSMSGState = 99;
int LSMSGStatePrev = 99;

// websocket
const int http_port = 80;
const int ws_port = 1337;

int PSTSleepTime = 30; // mins
long PSTSleepTimer = 0;

long lastProcTenTime = 0;
int ProcTenInterval = 500;

AsyncWebServer server(http_port);
WebSocketsServer webSocket = WebSocketsServer(ws_port);
#define msgbuflen 128
char msg_buf[msgbuflen];

float customLinearCurve(float x)
{
  // Define the two points
  const float x1 = 1.233;
  const float y1 = 1.1;
  const float x2 = 2.3220;
  const float y2 = 23.97;

  // Calculate the slope and y-intercept
  const float m = (y2 - y1) / (x2 - x1);
  const float b = y1 - m * x1;

  // Ensure x is within the valid range [1.233, 2.3220]
  x = constrain(x, x1, x2);

  // Calculate y using the linear equation y = mx + b
  return m * x + b;
}

void processRadio(int radioIn)
{
  // Serial.println("processRadio start");
  // Serial.print("processRadio radioIn " + String(radioIn));
  // Serial.println(", radioInPrev " + String(radioInPrev));

  if (payinState == 0 or stepState == 0)
  {
    applyPayIn(radioIn);
  }
  if (payoutState == 0)
  {
    applyPayOut(radioIn);
  }
  if (radioIn == 5)
  { // reset latch, move to payin
    unLatchPS();
    btnPayinST();
  }
  if (radioIn == 6)
  { // reset latch, move to payout
    unLatchPS();
    btnPayoutST();
  }
  // Serial.println("processRadio end");
}
void applyPayIn(int radioIn)
{
  // Serial.println("applyPayIn start");
  if (radioIn == 2)
  { // UP incremental
    // if (radioInPrev == radioIn) {
    WPowerPotVal = WPowerPotVal + WTensRPS3;
    wsPowerPot();
    // }
  }
  if (radioIn == 3)
  { // All out
    if (radioInPrev == radioIn)
    {
      WPowerPotVal = WTensRPS2;
      wsPowerPot();
    }
  }
  if (radioIn == 4)
  { // down incremental
    //  if (radioInPrev == radioIn) {
    WPowerPotVal = WPowerPotVal - WTensRPS1;
    wsPowerPot();
    //   }
  }
  if (radioIn == 1)
  { // STOP
    WPowerPotVal = 0;
    wsPowerPot();
  }
  // Serial.println("applyPayIn end");
}
void applyPayOut(int radioIn)
{
  // Serial.println("applyPayOut start");
  if (radioIn == 2)
  { // UP incrementalf
    // if (radioInPrev == radioIn) {
    WRegenPotVal = WRegenPotVal + WTensRPS3;
    wsRegen();
    // }
  }
  if (radioIn == 3)
  { // All out
    if (radioInPrev == radioIn)
    {
      WRegenPotVal = WTensRPS2;
      wsRegen();
    }
  }
  if (radioIn == 4)
  { // down incremental
    //  if (radioInPrev == radioIn) {
    WRegenPotVal = WRegenPotVal - WTensRPS1;
    wsRegen();
    //  }
  }
  if (radioIn == 1)
  { // STOP
    WRegenPotVal = 0;
    wsRegen();
  }
  // Serial.println("applyPayOut end");
}
void checkRadio(int radioIn)
{
  // Serial.println("checkRadio start");
  if (WinchControl == 0)
  {
    if (payinState == 0 or payoutState == 0 or stepState == 0)
    {
      processRadio(radioIn);
      radioInPrev = radioIn;
    }
  }
  // Serial.println("checkRadio end");
}

void AnaloguePowerChange()
{
  // Serial.println("AnaloguePowerChange start");
  if (WPowerPotVal > 100)
  {
    WPowerPotVal = 100;
  }
  if (WPowerPotVal < 0)
  {
    Serial.println("WPowerPotVal negative: " + String(WPowerPotVal) + ", changed to 0");
    WPowerPotVal = 0;
  }
  if (WPowerPotVal != WPowerPotValPrev)
  {
    WPowerPotValMapped = map(WPowerPotVal, 0, 100, WPowerPotValMapThrLow, WPowerPotValMapThrHigh);
    dacWrite(DAC1, WPowerPotValMapped);
    sprintf(msg_buf, "vWP%d", WPowerPotVal);
    webSocket.broadcastTXT(msg_buf);
    WPowerPotValPrev = WPowerPotVal;
    // Serial.println("Starting DAC1, WPowerPotVal: " + String(WPowerPotVal) + ", WPowerPotValMapped:" + String(WPowerPotValMapped));
  }
  // Serial.println("AnaloguePowerChange end");
}
void AnalogueRegenChange()
{
  // Serial.println("AnalogueRegenChange start");
  if (WRegenPotVal > 100)
  {
    WRegenPotVal = 100;
  }
  if (WRegenPotVal < 0)
  {
    Serial.println("WRegenPotVal negative: " + String(WRegenPotVal) + ", changed to 0");
    WRegenPotVal = 0;
  }
  if (WRegenPotVal != WRegenPotValPrev)
  {
    sprintf(msg_buf, "vWR%d", WRegenPotVal);
    webSocket.broadcastTXT(msg_buf);
    WRegenPotValMapped = map(WRegenPotVal, 0, 100, WRegenPotValMapThrLow, WRegenPotValMapThrHigh);
    dacWrite(DAC2, WRegenPotValMapped);
    WRegenPotValPrev = WRegenPotVal;
    // Serial.println("Starting DAC2, WRegenPotVal: " + String(WRegenPotVal) + ", WRegenPotValMapped:" + String(WRegenPotValMapped));
  }
}

void wsPowerPot()
{
  //  Serial.println("lineStopActive " + String(lineStopActive));
  //  Serial.println("safeStateActive " + String(safeStateActive));
  AnaloguePowerChange();
}
void wsRegen()
{
  //  Serial.println("lineStopActive " + String(lineStopActive));
  // Serial.println("safeStateActive " + String(safeStateActive));
  AnalogueRegenChange();
}
void DVTrevON()
{
  // Serial.println("DVTrevON start");
  digitalWrite(DVTrev, HIGH);
  //    Serial.println("DVTrevON end");
}
void DVTrevOFF()
{
  // Serial.println("DVTrevOFF start");
  digitalWrite(DVTrev, LOW);
  // Serial.println("DVTrevOFF end");
}
void DVTDS1ON()
{
  // Serial.println("DVTDS1ON start");
  digitalWrite(DVTDS1, HIGH);
  // Serial.println("DVTDS1ON end");
}
void DVTDS1OFF()
{
  // Serial.println("DVTDS1OFF start");
  digitalWrite(DVTDS1, LOW);
  // Serial.println("DVTDS1OFF end");
}
void DVTDS2ON()
{
  // Serial.println("DVTDS2ON start");
  digitalWrite(DVTDS2, HIGH);
  //   Serial.println("DVTDS2ON end");
}
void DVTDS2OFF()
{
  // Serial.println("DVTDS2OFF start");
  digitalWrite(DVTDS2, LOW);
  // Serial.println("DVTDS2OFF end");
}
void DVTDS3ON()
{
  // Serial.println("DVTDS3ON start");
  digitalWrite(DVTDS3, HIGH);
  //    Serial.println("DVTDS3ON end");
}
void DVTDS3OFF()
{
  // Serial.println("DVTDS3OFF start");
  digitalWrite(DVTDS3, LOW);
  // Serial.println("DVTDS3OFF end");
}
void DVTFS1ON()
{
  // Serial.println("DVTFS1ON start");
  digitalWrite(DVTFS1, HIGH);
  // Serial.println("DVTFS1ON end");
}
void DVTFS1OFF()
{
  // Serial.println("DVTFS1OFF start");
  digitalWrite(DVTFS1, LOW);
  // Serial.println("DVTFS1OFF end");
}
void wsPowerState()
{
  sprintf(msg_buf, "sRW%d", payinState);
  webSocket.broadcastTXT(msg_buf);
}
void wsStepState()
{
  sprintf(msg_buf, "sPR%d", stepState);
  webSocket.broadcastTXT(msg_buf);
}
void wsPayOutState()
{
  sprintf(msg_buf, "sPO%d", payoutState);
  webSocket.broadcastTXT(msg_buf);
}

void wsSafeStopState()
{
  sprintf(msg_buf, "sSS%d", SafeStopState);
  webSocket.broadcastTXT(msg_buf);
  if (SafeStopState == 0)
  {
    // wsBrake12vOn();
  }
  else
  {
    // wsBrake12vOff();
  }
}
void DVTOFF()
{
  // Serial.println("DVTOFF start");
  DVTrevOFF();
  DVTDS1OFF();
  DVTDS2OFF();
  DVTDS3OFF();
  DVTFS1OFF();
  // delay(10);
  // Serial.println("DVTOFF end");
}
void DVTON()
{
  // Serial.println("DVTON start");
  DVTrevON();
  DVTDS1ON();
  DVTDS2ON();
  DVTDS3ON();
  DVTFS1ON();
  // Serial.println("DVTON end");
}
void unLatchPS()
{
  // Serial.println("unLatchPS start");
  digitalWrite(PSunlatch, HIGH); // power to unlatch relay
  // Serial.println("PSunlatch, HIGH");
  delay(10);                    // pause to allow unpowering of unlatch to activate
  digitalWrite(PSunlatch, LOW); // unpower unlatch o that latching can be used
  // Serial.println("PSunlatch, LOW");
  delay(10);
}
void winchStartup()
{
  // Serial.println("");
  // Serial.println("winchStartup start");

  //      Set button states
  SafeStopState = 0; // on
  payinState = 1;    // off
  payoutState = 1;   // off
  stepState = 1;     // off

  DVTOFF(); // set DVT to default

  WPowerPotVal = 0;
  WRegenPotVal = 0;
  wsPowerPot();
  wsRegen();

  //      websocket updates to synchronise browser
  wsPowerState();
  wsStepState();
  wsPayOutState();
  wsSafeStopState();
  getCN();

  unLatchPS();

  // Serial.println("winchStartup end");
}
void BtnSafeStopST()
{
  // Serial.println("");
  // Serial.println("BtnSafeStopST start");

  //      Set button states
  SafeStopState = 0; // On
  payinState = 1;    // off
  payoutState = 1;   // off
  stepState = 1;     // off

  DVTOFF(); // set DVT to default

  unLatchPS();

  WPowerPotVal = 0;
  WRegenPotVal = 0;

  wsPowerPot();
  wsRegen();

  //      websocket updates to synchronise browser
  wsPowerState();
  wsStepState();
  wsPayOutState();
  wsSafeStopState();
  getCN();

  radioInPrev = 0; // tidy up concurrent presses on green remote

  // Serial.println("BtnSafeStopST end");
}
void btnPayinST()
{                    // preset, pay in
  SafeStopState = 1; // off
  payinState = 0;    // on
  payoutState = 1;   // off
  stepState = 1;     // off

  DVTOFF(); // set DVT to default
  DVTrevON();
  DVTDS2ON();
  DVTFS1ON();

  WPowerPotVal = 0;   // Reset so Drop power
  WRegenPotVal = 100; // engage full footbrake
  wsPowerPot();
  wsRegen();

  //      websocket updates to synchronise browser
  wsStepState();
  wsPayOutState();
  wsSafeStopState();
  wsPowerState();
  getCN();

  radioInPrev = 0; // tidy up concurrent presses on green remote

  unLatchPS();
}
void StepST()
{                    // throttle, step
  SafeStopState = 1; // off
  payinState = 1;    // off
  payoutState = 1;   // off
  stepState = 0;     // on

  DVTOFF(); // set DVT to default
  DVTrevON();
  DVTDS3ON();

  WPowerPotVal = 0;
  WRegenPotVal = 0;

  wsPowerPot();
  wsRegen();

  //      websocket updates to synchronise browser
  wsPayOutState();
  wsSafeStopState();
  wsPowerState();
  wsStepState();
  getCN();

  radioInPrev = 0; // tidy up concurrent presses on green remote

  unLatchPS();
}

void btnPayoutST()
{ // payout
  // Serial.println("");
  // Serial.println("btnPayoutST start");
  SafeStopState = 1; // off
  payinState = 1;    // off
  payoutState = 0;   // on
  stepState = 1;     // off

  DVTOFF(); // set DVT to default
  DVTrevON();
  DVTDS3ON();

  WPowerPotVal = 0; // payout so Drop power
  WRegenPotVal = 0; // payout so Drop regen power

  wsPowerPot();
  wsRegen();

  //      websocket updates to synchronise browser
  wsSafeStopState();
  wsPowerState();
  wsStepState();
  wsPayOutState();
  getCN();

  radioInPrev = 0; // tidy up concurrent presses on green remote

  unLatchPS();

  // Serial.println("btnPayoutST end");
}
void btnPilotCN()
{
  WinchControl = 0;
  BtnSafeStopST();
  sprintf(msg_buf, "sCN%d", WinchControl);
  webSocket.broadcastTXT(msg_buf);
}
void btnWinchCN()
{
  WinchControl = 1;
  BtnSafeStopST();
  sprintf(msg_buf, "sCN%d", WinchControl);
  webSocket.broadcastTXT(msg_buf);
}
void getEmSST()
{
  sprintf(msg_buf, "sSS%d", SafeStopState);
  webSocket.broadcastTXT(msg_buf);
}
void getPayinST()
{
  sprintf(msg_buf, "sRW%d", payinState);
  webSocket.broadcastTXT(msg_buf);
}
void getStepST()
{
  sprintf(msg_buf, "sPR%d", stepState);
  webSocket.broadcastTXT(msg_buf);
}
void getPayoutST()
{
  sprintf(msg_buf, "sPO%d", payoutState);
  webSocket.broadcastTXT(msg_buf);
}
void getCN()
{
  sprintf(msg_buf, "sCN%d", WinchControl);
  webSocket.broadcastTXT(msg_buf);
}
void getWPwVal()
{
  sprintf(msg_buf, "vWP%d", WPowerPotVal);
  webSocket.broadcastTXT(msg_buf);
}
void getWRgVal()
{
  sprintf(msg_buf, "vWR%d", WRegenPotVal);
  webSocket.broadcastTXT(msg_buf);
}
void getPCVal()
{
  sprintf(msg_buf, "HAL%d", pulseCount);
  webSocket.broadcastTXT(msg_buf);
}
void getPCSVal()
{
  sprintf(msg_buf, "PCS%d", pulseCountLimit);
  webSocket.broadcastTXT(msg_buf);
  getPCSSta();
}
void getPCSSta()
{
  sprintf(msg_buf, "vPS%d", pulseCountStopStatus);
  webSocket.broadcastTXT(msg_buf);
}
void getRSSIVal()
{
  sprintf(msg_buf, "vRS%d", RSSIVal);
  webSocket.broadcastTXT(msg_buf);
}
void getSSVal()
{
  sprintf(msg_buf, "vSS%d", safeStateActive);
  webSocket.broadcastTXT(msg_buf);
}
void getLSVal()
{
  sprintf(msg_buf, "vBL%d", LSMSGcnt);
  webSocket.broadcastTXT(msg_buf);
}
void getRPMVal()
{
  sprintf(msg_buf, "vRP%d", hallRPM);
  webSocket.broadcastTXT(msg_buf);
}
void getTNDir()
{
  sprintf(msg_buf, "vTN%d", direct);
  webSocket.broadcastTXT(msg_buf);
}
void getVBATVal()
{
  sprintf(msg_buf, "vMB%2f", VBAT);
  webSocket.broadcastTXT(msg_buf);
}
void getSSIDVal()
{
  sprintf(msg_buf, "vID%s", ssid);
  webSocket.broadcastTXT(msg_buf);
}
void getAC()
{
  // refresh processor failure count
  if (counter != counterPrev)
  {
    sprintf(msg_buf, "vAC%d", counter);
    webSocket.broadcastTXT(msg_buf);
  }
}
void getMT()
{
  // refresh motor temperature
  sprintf(msg_buf, "vMT%d", motorTemperature);
  webSocket.broadcastTXT(msg_buf);
}
void getMB()
{
  // refresh battery voltage
  sprintf(msg_buf, "vMB%d", mainBatteryVoltage);
  webSocket.broadcastTXT(msg_buf);
}
// Callback: receiving any WebSocket message
void onWebSocketEvent(uint8_t client_num,
                      WStype_t type,
                      uint8_t *payload,
                      size_t length)
{

  // Figure out the type of WebSocket event
  switch (type)
  {

  // Client has disconnected
  case WStype_DISCONNECTED:
  {
    Serial.printf("[%u] Disconnected!\n", client_num);
    break;
  }
  // New client has connected
  case WStype_CONNECTED:
  {
    IPAddress ip = webSocket.remoteIP(client_num);
    Serial.printf("[%u] Connection from ", client_num);
    Serial.println(ip.toString());
    break;
  }
  // Handle text messages from client
  case WStype_TEXT:
  {
    // Print out raw message
    // Serial.printf("[%u] Received text: %s\n", client_num, payload);
    char payload_1[50];
    sprintf(payload_1, "%s", payload);
    String payload_1S(payload_1);

    // Handle btn presses
    if (strcmp((char *)payload, "EmStopST") == 0)
    {
      BtnSafeStopST();
    }
    else if (strcmp((char *)payload, "PayinST") == 0)
    {
      btnPayinST();
    }
    else if (strcmp((char *)payload, "StepST") == 0)
    {
      StepST();
    }
    else if (strcmp((char *)payload, "PayoutST") == 0)
    {
      btnPayoutST();
    }
    else if (strcmp((char *)payload, "WinchCN") == 0)
    {
      btnWinchCN();
    }
    else if (strcmp((char *)payload, "PilotCN") == 0)
    {
      btnPilotCN();

      // Handle btn status requests
    }
    else if (strcmp((char *)payload, "getEmSST") == 0)
    { // Report the state of the emergency STOP
      getEmSST();
    }
    else if (strcmp((char *)payload, "getPayinST") == 0)
    { // Report the state of the Power
      getPayinST();
    }
    else if (strcmp((char *)payload, "getStepST") == 0)
    { // Report the state of the Pullout/Return
      getStepST();
    }
    else if (strcmp((char *)payload, "getPayoutST") == 0)
    { // Report the state of the Regen button
      getPayoutST();
    }
    else if (strcmp((char *)payload, "getCN") == 0)
    { // Report the state of the Regen button
      getCN();

      // Handle slider requests
    }
    else if (strcmp((char *)payload, "getWPwVal") == 0)
    { // Report the state of the winch power
      getWPwVal();
    }
    else if (strcmp((char *)payload, "getWRgVal") == 0)
    { // Report the state of the winch regen
      getWRgVal();

      // Handle status bar update requests
    }
    else if (strcmp((char *)payload, "getWPCVal") == 0)
    {
      getPCVal();
    }
    else if (strcmp((char *)payload, "getWPCSVal") == 0)
    {
      getPCSVal();
    }
    else if (strcmp((char *)payload, "getWPCSSta") == 0)
    {
      getPCSSta();
    }
    else if (strcmp((char *)payload, "getRSSIVal") == 0)
    {
      getRSSIVal();
    }
    else if (strcmp((char *)payload, "getSSVal") == 0)
    {
      getSSVal();
    }
    else if (strcmp((char *)payload, "getLSVal") == 0)
    {
      getLSVal();
    }
    else if (strcmp((char *)payload, "getVBATVal") == 0)
    {
      getVBATVal();
    }
    else if (strcmp((char *)payload, "getSSIDVal") == 0)
    {               // phil
      getSSIDVal(); // phil
                    // phil
    }
    else if (strcmp((char *)payload, "getRPMVal") == 0)
    {
      getRPMVal();
    }
    else if (strcmp((char *)payload, "getTN") == 0)
    {
      getTNDir();
    }
    else if (strcmp((char *)payload, "getAC") == 0)
    {
      getAC();
    }
    else if (strcmp((char *)payload, "getMT") == 0)
    {
      getMT();
    }
    else if (strcmp((char *)payload, "getMB") == 0)
    {
      getMB();

      // Set winch throttle values
      // Winch power value
    }
    else if (payload_1S.substring(0, 6) == "WPwVal")
    {
      uint32_t num = payload_1S.substring(6).toInt();
      WPowerPotVal = num;
      wsPowerPot();

      // Winch regen
    }
    else if (payload_1S.substring(0, 6) == "WRgVal")
    {
      uint32_t num = payload_1S.substring(6).toInt();
      WRegenPotVal = num;
      wsRegen();

      // Preset tension 1
    }
    else if (payload_1S.substring(0, 6) == "WTRTUv")
    {
      uint32_t num = payload_1S.substring(6).toInt();
      WTensRPS1 = num;

      // Preset tension 2
    }
    else if (payload_1S.substring(0, 6) == "WTRLAv")
    {
      uint32_t num = payload_1S.substring(6).toInt();
      WTensRPS2 = num;

      // Preset tension 3
    }
    else if (payload_1S.substring(0, 6) == "WTRPLv")
    {
      uint32_t num = payload_1S.substring(6).toInt();
      WTensRPS3 = num;

      // 12v brake
    }
    else if (payload_1S.substring(0, 3) == "cBL")
    {
      int num = payload_1S.substring(3).toInt();
      sprintf(msg_buf, "vBL%d", num);
      webSocket.broadcastTXT(msg_buf);

      // Self tow pressure request
    }
    else if (payload_1S.substring(0, 3) == "xTR")
    {
      int num = payload_1S.substring(3).toInt();
      checkRadio(num);
    }
    else if (payload_1S.substring(0, 3) == "xPI")
    {
      int num = payload_1S.substring(3).toInt() / 10;
      int num1 = num;
      if (num1 == 2)
      { // 2 Go
        num = 3;
      }
      if (num1 == 4)
      { // UP
        num = 2;
      }
      if (num1 == 3)
      { // STOP
        num = 1;
      }
      if (num1 == 1)
      { // DOWN
        num = 4;
      }
      checkRadio(num);
    }
    else if (payload_1S.substring(0, 3) == "sRS")
    {
      int num = payload_1S.substring(3).toInt();
      RSSIVal = num;
      sprintf(msg_buf, "vRS%d", num);
      webSocket.broadcastTXT(msg_buf);

      // Pulsecount stop limit val update
    }
    else if (payload_1S.substring(0, 7) == "WPCSVal")
    {
      int num = payload_1S.substring(7).toInt();
      sprintf(msg_buf, "vPC%d", num);
      webSocket.broadcastTXT(msg_buf);
      pulseCountLimit = num;

      // Pulsecount stop status update
    }
    else if (payload_1S.substring(0, 7) == "WPCSSta")
    {
      int num = payload_1S.substring(7).toInt();
      sprintf(msg_buf, "vPS%d", num);
      webSocket.broadcastTXT(msg_buf);
      pulseCountStopStatus = num;

      // Motor temperature
    }
    else if (payload_1S.substring(0, 3) == "sMT")
    {
      float num = payload_1S.substring(3).toFloat();
      sprintf(msg_buf, "vMT%.0f", num);
      webSocket.broadcastTXT(msg_buf);
      motorTemperature = num;

      // Main battery voltage
    }
    else if (payload_1S.substring(0, 3) == "sMB")
    {
      float num = payload_1S.substring(3).toFloat();
      sprintf(msg_buf, "vMB%.1f", num);
      webSocket.broadcastTXT(msg_buf);
      mainBatteryVoltage = num;

      // RPM
    }
    else if (payload_1S.substring(0, 3) == "sRP")
    {
      int num = payload_1S.substring(3).toInt();
      sprintf(msg_buf, "vRP%d", num);
      webSocket.broadcastTXT(msg_buf);
      hallRPM = num;

      // Message not recognized
    }
    else
    {
      Serial.println("[%u] Message not recognized");
      Serial.printf("[%u] Received text: %s\n", client_num, payload);
    }
    break;
  }
  // For everything else: do nothing
  case WStype_BIN:
  case WStype_ERROR:
  case WStype_FRAGMENT_TEXT_START:
  case WStype_FRAGMENT_BIN_START:
  case WStype_FRAGMENT:
  case WStype_FRAGMENT_FIN:
  default:
    break;
  }
}

// Callback: send 404 if requested file does not exist
void onPageNotFound(AsyncWebServerRequest *request)
{
  IPAddress remote_ip = request->client()->remoteIP();
  Serial.println("[" + remote_ip.toString() +
                 "] HTTP GET request of " + request->url());
  request->send(404, "text/plain", "Not found");
}
void drainSerial2()
{
  // Serial.println("drainSerial2 start");
  //  drainSerial2 any queued voice serial data so we have a clean slate
  while (MySerial.available())
  {                                      // Wait for the Receiver to get the characters
    float emptybuffer = MySerial.read(); // Display the Receivers characters
    Serial.println(emptybuffer);         // Display the result on the serial monitor
  };
  // MySerial.flush();
  // MySerial.begin(115200, SERIAL_8N1, RXD2, TXD2);
  // Serial.println("drainSerial2 end");
}
void initSerial()
{
  Serial.begin(115200);

  MySerial.begin(115200, SERIAL_8N1, RXD2, TXD2);
  // drain any queued voice serial data so we hve a clean slate
  drainSerial2();

  Serial.println("initSerial end");
}
void initWebHooks()
{
  Serial.println("init Webhooks start");
  // Make sure we can read the file system
  if (!SPIFFS.begin())
  {
    Serial.println("Error mounting SPIFFS");
    while (1)
      ;
  }

  // Start access point
  WiFi.softAP(ssid, password, 1, false, 5);

  // Print our IP address
  Serial.println();
  Serial.println("AP running");
  Serial.print("My IP address: ");
  Serial.println(WiFi.softAPIP());

  // On HTTP request - serve all files from SPIFFS

  server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html");
    // Handle requests for pages that do not exist
  server.onNotFound(onPageNotFound);

  // Start web server
  server.begin();
  Serial.println("Webserver started");
  // Start WebSocket server and assign callback
  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);

  Serial.println("Winch safe");
  winchStartup(); // Set winch safe
}
void reviewPayinRPM()
{ // phil

  // Check for high RPM condition
  if (hallRPM >= HIGH_RPM_THRESHOLD)
  {
    if (!highRpmTimerActive)
    {
      // Start the high RPM timer
      highRpmStartTime = millis();
      highRpmTimerActive = true;
    }
    // Check if debounce time has elapsed
    else if ((millis() - highRpmStartTime) >= DEBOUNCE_TIME)
    {
      if (digitalRead(DVTDS1) == LOW)
      {
        DVTDS1ON();
        DVTDS2OFF();
        // Serial.println("High RPM State Triggered");
      }
    }
  }
  else
  {
    // Reset high RPM timer if RPM drops below threshold
    highRpmTimerActive = false;
  }

  // Check for low RPM condition
  if (hallRPM <= LOW_RPM_THRESHOLD)
  {
    if (!lowRpmTimerActive)
    {
      // Start the low RPM timer
      lowRpmStartTime = millis();
      lowRpmTimerActive = true;
    }
    // Check if debounce time has elapsed
    else if ((millis() - lowRpmStartTime) >= DEBOUNCE_TIME)
    {
      if (digitalRead(DVTDS2) == LOW)
      {
        DVTDS2ON();
        DVTDS1OFF();
        // Serial.println("Low RPM State Triggered");
      }
    }
  }
  else
  {
    // Reset low RPM timer if RPM rises above threshold
    lowRpmTimerActive = false;
  }

  // Print current status (for debugging)
  static unsigned long lastPrintTime = 0;
  if (millis() - lastPrintTime >= 1000)
  { // Print every second
    Serial.print("RPM: ");
    Serial.print(String(hallRPM));
    Serial.print(", DVTDS1: ");
    Serial.print(digitalRead(DVTDS1));
    Serial.print(", DVTDS2: ");
    Serial.println(digitalRead(DVTDS2));
    lastPrintTime = millis();
  }
}
void reviewStep()
{
  if (WPowerPotVal <= 8)
  {
    DVTrevOFF();
    DVTDS3OFF();
  }
  else
  {
    DVTrevON();
    DVTDS3ON();
  }
}
void reviewPayin()
{ // phil
  if (WPowerPotVal == 0)
  { //  was  <= 8
    if (digitalRead(DVTDS2) == HIGH)
    {
      DVTDS2OFF();
    }
    if (digitalRead(DVTDS1) == HIGH)
    {
      DVTDS1OFF();
    }
    if (digitalRead(DVTFS1) == HIGH)
    {
      DVTFS1OFF();
    }
  }
  else
  {
    if (digitalRead(DVTDS2) == LOW)
    { // Only proceed if DVTDS1 is OFF
      if (digitalRead(DVTDS1) == LOW)
      {
        DVTDS2ON();
      }
    }
    if (digitalRead(DVTFS1) == LOW)
    {
      DVTFS1ON();
    }
  }

  reviewPayinRPM();
}
void reviewPayout()
{
  if (WRegenPotVal == 0)
  { // was <= 8
    DVTDS3OFF();
  }
  else
  {
    DVTDS3ON();
  }
}
void processTension()
{
  // Serial.println("processTension start");
  if (stepState == 0)
  {
    reviewStep();
  }
  if (payinState == 0)
  {
    reviewPayin();
  }
  if (payoutState == 0)
  {
    reviewPayout();
  }
  // Serial.println("processTension end");
}
void initPreferences()
{
  Serial.println("initPreferences start");
  preferences.begin("abendCount", false);
  counter = preferences.getUInt("counter", 0);
  counter++;
  preferences.putUInt("counter", counter);
  preferences.end();
  Serial.println("counter " + String(counter));
  // sprintf(msg_buf, "vAC%d", counter);
  // webSocket.broadcastTXT(msg_buf);
  Serial.println("initPreferences end");
}

void processLineStop()
{
  Serial.println("processLineStop start");
  if (stepState == 0)
  {
    WPowerPotVal = 0;
    wsPowerPot();
    WRegenPotVal = 0;
    wsRegen();
    DVTOFF();
    DVTDS2ON();
    delay(4000);
    BtnSafeStopST();
  }
  if (payinState == 0)
  {
    WPowerPotVal = 0;
    wsPowerPot();
    WRegenPotVal = 0;
    wsRegen();
    DVTrevOFF();
    DVTDS2ON();
    delay(4000);
    BtnSafeStopST();
  }
  if (payoutState == 0)
  {
    int tempWRegenPotVal = WRegenPotVal;
    btnPayoutST();
    WRegenPotVal = tempWRegenPotVal;
    wsRegen();
  }
  Serial.println("processLineStop end");
}
void checkLSMSG()
{
  // Serial.println("checkLSMSG start");
  //  read the state of the switch/button:
  currentState = digitalRead(LSMSG);
  if (currentState != lastFlickerableState)
  {
    lastDebounceTime = millis();
    lastFlickerableState = currentState;
  }

  if ((millis() - lastDebounceTime) > DEBOUNCE_TIME)
  {
    if (lastSteadyState == HIGH && currentState == LOW)
    {
      Serial.println("The LSMSG button is pressed");
      lineStopActive = 0;
    }

    if (lastSteadyState == LOW && currentState == HIGH)
    {
      Serial.println("The LSMSG button is triggered");
      LSMSGcnt = LSMSGcnt + 1;
      lineStopActive = 1;
      sprintf(msg_buf, "vBL%d", LSMSGcnt);
      webSocket.broadcastTXT(msg_buf);
      if (hallRPM <= 0)
      {
        processLineStop(); // PHILLIP added          if(hallRPM <= 0 ) { processLineStop();  }
      }
    }
    // save the the last steady state
    lastSteadyState = currentState;
  }
  // Serial.println("checkLSMSG end");
}
void processSafeStateOn()
{
  sprintf(msg_buf, "vSS%d", safeStateActive);
  webSocket.broadcastTXT(msg_buf);
  BtnSafeStopST();
}
void processSafeStateOff()
{
  sprintf(msg_buf, "vSS%d", safeStateActive);
  webSocket.broadcastTXT(msg_buf);
  BtnSafeStopST();
}
void checkSafeState()
{
  // Serial.println("checkSafeState start");
  currentStateSS = digitalRead(SafeState);
  // Serial.print("currentStateSS ");
  // Serial.println(currentStateSS);
  // Serial.print("safeStateActive ");
  // Serial.println(safeStateActive);
  if (currentStateSS != lastFlickerableStateSS)
  {
    lastDebounceTimeSS = millis();
    lastFlickerableStateSS = currentStateSS;
  }

  if ((millis() - lastDebounceTimeSS) > DEBOUNCE_TIMESS)
  {
    if (lastSteadyStateSS == HIGH && currentStateSS == LOW)
    {
      Serial.println("The SS button is off");
      safeStateActive = 0;
      Serial.print("safeStateActive ");
      Serial.println(safeStateActive);
      processSafeStateOff();
    }

    if (lastSteadyStateSS == LOW && currentStateSS == HIGH)
    {
      Serial.println("The SS button is on");
      safeStateActive = 1;
      Serial.print("safeStateActive ");
      Serial.println(safeStateActive);
      processSafeStateOn();
    }
    // save the the last steady state
    lastSteadyStateSS = currentStateSS;
  }
  // Serial.println("checkSafeState end");
}

void checkResBNK1()
{
  // Serial.println("checkResBNK1 start");
  int voltageTrigger = 79;
  int voltageTrigger2 = 78.5;
  int triggerPeriod = 2000; // ms

  if (payoutState == 0)
  {
    if (millis() - ResBNKtime > triggerPeriod)
    {
      if (VBAT >= voltageTrigger)
      {
        digitalWrite(ResBNK1, HIGH);
        ResBNKtime = millis();
      }
      if (VBAT < voltageTrigger2)
      {
        digitalWrite(ResBNK1, LOW);
        ResBNKtime = millis();
      }
    }
  }
  if (payoutState == 1)
  {
    digitalWrite(ResBNK1, LOW);
  }
  // Serial.println("checkResBNK1 end");
}
void startupHello()
{
  digitalWrite(ResBNK1, HIGH);
  delay(500);
  digitalWrite(ResBNK1, LOW);
  delay(500);
  digitalWrite(ResBNK1, HIGH);
  delay(500);
  digitalWrite(ResBNK1, LOW);
}
void initPins()
{
  Serial.println("Pins init start");
  pinMode(PSunlatch, OUTPUT);
  digitalWrite(PSunlatch, LOW);
  pinMode(DVTrev, OUTPUT);
  digitalWrite(DVTrev, LOW);
  pinMode(DVTDS1, OUTPUT);
  digitalWrite(DVTDS1, LOW);
  pinMode(DVTDS2, OUTPUT);
  digitalWrite(DVTDS2, LOW);
  pinMode(DVTDS3, OUTPUT);
  digitalWrite(DVTDS3, LOW);
  pinMode(DVTFS1, OUTPUT);
  digitalWrite(DVTFS1, LOW);
  pinMode(Vdiv72v, INPUT);
  pinMode(LSMSG, INPUT_PULLDOWN);
  pinMode(SafeState, INPUT_PULLUP);
  digitalWrite(SafeState, HIGH);
  pinMode(ResBNK1, OUTPUT);
  digitalWrite(ResBNK1, LOW);
  pinMode(spareR1, OUTPUT);
  digitalWrite(spareR1, HIGH);
  Serial.println("Pins init complete");
}

void checkESP32temperature()
{
  if (millis() - lastIntervalTime01 > 10000)
  {
    float temperature = (temperature_sens_read() - 32) / 1.8;
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.println(" °C");
    sprintf(msg_buf, "vMT%f", temperature);
    webSocket.broadcastTXT(msg_buf);
    lastIntervalTime01 = millis();
  }
}

void setup()
{
  initSerial();
  initPins();
  startupHello();
  initWebHooks();
  initPreferences();

  // make sure we don't get killed for our long running tasks
  esp_task_wdt_init(10, false);
}
void loop()
{
  webSocket.loop();
  processTension();
  checkLSMSG();
  checkSafeState();
  checkResBNK1();
  // checkESP32temperature();
}
