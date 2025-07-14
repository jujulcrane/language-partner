#include <Arduino.h>
#include "microphone.h"

void setup()
{
  // put your setup code here, to run once:
  Serial.begin(115200);
  delay(100);
  mic_setup();
}

void loop()
{
  mic_read_and_print();
  delay(100); // Adjust as needed
}
