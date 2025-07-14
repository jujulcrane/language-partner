// i2s_audio.h
#pragma once
#include <Arduino.h>
#include <driver/i2s.h>

#define I2S_WS 25
#define I2S_SD 33
#define I2S_SCK 32
#define I2S_PORT I2S_NUM_0

#define SAMPLE_RATE 16000
#define BUFFER_LEN 64
#define CHUNK_SIZE (SAMPLE_RATE * 2) // 2 seconds

extern int32_t *sBuffer;
extern int32_t *chunkBuffer;
extern size_t chunkIndex;

void i2s_install();
void i2s_setpin();
void i2s_init_buffers();
void readAndBufferAudio();
void i2s_free_buffers();
