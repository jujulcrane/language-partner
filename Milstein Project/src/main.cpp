#include <Arduino.h>
#include "wifi_audio.h"
#include "i2s_audio.h"

void setup()
{
  Serial.begin(115200);
  delay(100);
  initWiFi();
  Serial.println("WiFi setup complete");
  delay(1000);

  i2s_init_buffers(); // <-- Add this line to allocate buffers

  i2s_install();
  i2s_setpin();
  i2s_start(I2S_PORT);
  Serial.println("Microphone setup complete");
  chunkIndex = 0;
  Serial.println("Entering main loop - streaming audio to server...");

  if (psramFound())
  {
    Serial.println("PSRAM found and enabled");
  }
  else
  {
    Serial.println("PSRAM not found");
  }
}

void loop()
{
  readAndBufferAudio();
  delayMicroseconds(100);
}
