#pragma once
#include <Arduino.h>

void initWiFi();
void sendChunkToServer(int32_t *chunkBuffer, size_t chunkIndex);
extern const char *ssid;
extern const char *password;
extern const char *serverURL;
