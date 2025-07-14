// i2s_audio.cpp
#include "wifi_audio.h"
#include "i2s_audio.h"
#include <esp_heap_caps.h>
#include <Arduino.h>

int32_t *sBuffer = nullptr;
int32_t *chunkBuffer = nullptr;
size_t chunkIndex = 0;

void i2s_install()
{
  const i2s_config_t i2s_config = {
      .mode = i2s_mode_t(I2S_MODE_MASTER | I2S_MODE_RX),
      .sample_rate = SAMPLE_RATE,
      .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
      .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
      .communication_format = I2S_COMM_FORMAT_STAND_I2S,
      .intr_alloc_flags = 0,
      .dma_buf_count = 8,
      .dma_buf_len = BUFFER_LEN,
      .use_apll = false};

  esp_err_t res = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  if (res != ESP_OK)
  {
    Serial.println("Failed to install I2S driver!");
    while (1)
      delay(1000);
  }
}

void i2s_setpin()
{
  const i2s_pin_config_t pin_config = {
      .bck_io_num = I2S_SCK,
      .ws_io_num = I2S_WS,
      .data_out_num = -1,
      .data_in_num = I2S_SD};

  esp_err_t res = i2s_set_pin(I2S_PORT, &pin_config);
  if (res != ESP_OK)
  {
    Serial.println("Failed to set I2S pins!");
    while (1)
      delay(1000);
  }
}

void i2s_init_buffers()
{
  // Try to allocate sBuffer in PSRAM, then normal RAM
  sBuffer = (int32_t *)ps_malloc(BUFFER_LEN * sizeof(int32_t));
  if (!sBuffer)
  {
    Serial.println("Failed to allocate sBuffer in PSRAM, trying normal malloc...");
    sBuffer = (int32_t *)malloc(BUFFER_LEN * sizeof(int32_t));
    if (!sBuffer)
    {
      Serial.println("Failed to allocate sBuffer in normal RAM!");
      while (1)
        delay(1000);
    }
  }

  // Allocate chunkBuffer similarly
  chunkBuffer = (int32_t *)ps_malloc(CHUNK_SIZE * sizeof(int32_t));
  if (!chunkBuffer)
  {
    Serial.println("Failed to allocate chunkBuffer in PSRAM, trying normal malloc...");
    chunkBuffer = (int32_t *)malloc(CHUNK_SIZE * sizeof(int32_t));
    if (!chunkBuffer)
    {
      Serial.println("Failed to allocate chunkBuffer in normal RAM!");
      while (1)
        delay(1000);
    }
  }

  chunkIndex = 0;
  Serial.println("Buffers allocated successfully.");
}

void readAndBufferAudio()
{
  if (!sBuffer || !chunkBuffer)
  {
    Serial.println("Buffers not allocated!");
    return;
  }

  size_t bytesIn = 0;
  esp_err_t result = i2s_read(I2S_PORT, sBuffer, BUFFER_LEN * sizeof(int32_t), &bytesIn, portMAX_DELAY);

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
        sendChunkToServer(chunkBuffer, chunkIndex);
        chunkIndex = 0;
      }
    }
  }
  else
  {
    Serial.print("I2S read failed or no data: ");
    Serial.println(result);
  }
}

void i2s_free_buffers()
{
  if (sBuffer)
  {
    free(sBuffer);
    sBuffer = nullptr;
  }
  if (chunkBuffer)
  {
    free(chunkBuffer);
    chunkBuffer = nullptr;
  }
}
