#include "wifi_audio.h"
#include <WiFi.h>
#include <HTTPClient.h>

// WiFi credentials and server URL
const char *ssid = "DIGITALMAGIC-2.4G";
const char *password = "DIGITALMAGIC2025!";
const char *serverURL = "http://192.168.8.228:5000/audio";

static HTTPClient http;

void initWiFi()
{
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.println("Connecting to WiFi ..");
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print('.');
    delay(1000);
  }

  Serial.println(WiFi.localIP());
  Serial.print("RSSI: ");
  Serial.println(WiFi.RSSI());
}

void sendChunkToServer(int32_t *chunkBuffer, size_t chunkIndex)
{
  if (WiFi.status() == WL_CONNECTED)
  {
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/octet-stream");

    Serial.print("Sending chunk to server (");
    Serial.print(chunkIndex * sizeof(int32_t));
    Serial.println(" bytes)...");

    int httpResponseCode = http.POST((uint8_t *)chunkBuffer, chunkIndex * sizeof(int32_t));

    if (httpResponseCode > 0)
    {
      String response = http.getString();
      Serial.print("HTTP Response: ");
      Serial.println(httpResponseCode);
      if (response.length() > 0)
      {
        Serial.print("Server response: ");
        Serial.println(response);
      }
    }
    else
    {
      Serial.print("HTTP Error: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  }
  else
  {
    Serial.println("WiFi Disconnected - cannot send chunk");
  }
}
