#include <WiFi.h>
#include <HTTPClient.h>
#include <driver/i2s.h>

#define I2S_WS 25
#define I2S_SD 33
#define I2S_SCK 32
#define I2S_PORT I2S_NUM_0

#define bufferLen 64
int32_t sBuffer[bufferLen];

const int SAMPLE_RATE = 16000;
#define CHUNK_SIZE SAMPLE_RATE * 3
int32_t chunkBuffer[CHUNK_SIZE];
size_t chunkIndex = 0;

const char *ssid = "DIGITALMAGIC-2.4G";
const char *password = "DIGITALMAGIC2025!";
const char *serverURL = "http://192.168.8.228:5000/audio";

HTTPClient http;
WiFiClient client;

// === DC Offset Removal & Noise Gate ===
void processAudioChunk(int32_t *buffer, size_t length, int threshold = 500)
{
  int64_t sum = 0;
  for (size_t i = 0; i < length; ++i)
  {
    sum += buffer[i];
  }
  int32_t mean = sum / length;
  for (size_t i = 0; i < length; ++i)
  {
    int32_t sample = buffer[i] - mean;
    if (abs(sample) < threshold)
    {
      buffer[i] = 0;
    }
    else
    {
      buffer[i] = sample;
    }
  }
}

void i2s_install()
{
  const i2s_config_t i2s_config = {
      .mode = I2S_MODE_MASTER | I2S_MODE_RX,
      .sample_rate = SAMPLE_RATE,
      .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
      .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
      .communication_format = I2S_COMM_FORMAT_STAND_I2S,
      .intr_alloc_flags = 0,
      .dma_buf_count = 8,
      .dma_buf_len = bufferLen,
      .use_apll = false};
  i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
}

void i2s_setpin()
{
  const i2s_pin_config_t pin_config = {
      .bck_io_num = I2S_SCK,
      .ws_io_num = I2S_WS,
      .data_out_num = -1,
      .data_in_num = I2S_SD};
  i2s_set_pin(I2S_PORT, &pin_config);
}

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
  Serial.print("RRSI: ");
  Serial.println(WiFi.RSSI());
}

void sendChunkToServer()
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
  chunkIndex = 0;
}

void setup()
{
  Serial.begin(115200);
  initWiFi();
  Serial.println("WiFi setup complete");
  delay(1000);
  i2s_install();
  i2s_setpin();
  i2s_start(I2S_PORT);
  Serial.println("Microphone setup complete");
  delay(500);
  chunkIndex = 0;
  Serial.println("Entering main loop - streaming audio to server...");
}

void loop()
{
  size_t bytesIn = 0;
  esp_err_t result = i2s_read(I2S_PORT, &sBuffer, bufferLen * sizeof(int32_t), &bytesIn, portMAX_DELAY);
  if (result == ESP_OK && bytesIn > 0)
  {
    size_t samplesRead = bytesIn / sizeof(int32_t);
    size_t samplesToCopy = min(samplesRead, CHUNK_SIZE - chunkIndex);
    if (samplesToCopy > 0)
    {
      memcpy(chunkBuffer + chunkIndex, sBuffer, samplesToCopy * sizeof(int32_t));
      chunkIndex += samplesToCopy;
      if (chunkIndex >= CHUNK_SIZE)
      {
        processAudioChunk(chunkBuffer, CHUNK_SIZE); // DC removal + noise gate
        sendChunkToServer();
        chunkIndex = 0;
      }
    }
  }
  delayMicroseconds(100);
}
