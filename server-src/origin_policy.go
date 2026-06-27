package main

import (
	"log"
	"net/http"
	"os"
	"strings"
)

const allowedOriginsEnv = "DSD_ALLOWED_ORIGINS"

func warnIfAllowedOriginsUnset() {
	if os.Getenv(allowedOriginsEnv) == "" {
		log.Printf("WARNING: %s is not set; allowing all HTTP CORS and WebSocket origins for backward compatibility", allowedOriginsEnv)
	}
}

func getAllowedOrigins() []string {
	value := os.Getenv(allowedOriginsEnv)
	if value == "" {
		return []string{"*"}
	}

	parts := strings.Split(value, ",")
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		origin := strings.TrimSpace(part)
		if origin != "" {
			origins = append(origins, origin)
		}
	}
	return origins
}

func isOriginInAllowedList(origin string) bool {
	for _, allowedOrigin := range getAllowedOrigins() {
		if allowedOrigin == "*" || allowedOrigin == origin {
			return true
		}
	}
	return false
}

func isCORSOriginAllowed(origin string) bool {
	if origin == "" {
		return false
	}
	return isOriginInAllowedList(origin)
}

func isWebSocketOriginAllowed(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return true
	}
	return isOriginInAllowedList(origin)
}
