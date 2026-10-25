package main

import (
	"log"
	"os"
	"strings"
	"time"
)

// metricsTimeout accepts positive durations or a number of seconds.
func metricsTimeout() time.Duration {
	value := strings.TrimSpace(os.Getenv("DSD_METRICS_TIMEOUT"))
	if value == "" {
		return 5 * time.Second
	}
	timeout, err := time.ParseDuration(value)
	if err != nil {
		timeout, err = time.ParseDuration(value + "s")
	}
	if err != nil || timeout <= 0 {
		log.Print("Invalid DSD_METRICS_TIMEOUT; using 5s")
		return 5 * time.Second
	}
	return timeout
}
