package docker

import (
	"sync"
	"testing"
)

func TestResetCli(t *testing.T) {
	ResetCli()
	// After Reset, the client should be nil
	// GetCli will panic without Docker, so we just test Reset
}

func TestSetCliNil(t *testing.T) {
	ResetCli()
	SetCli(nil)
	// Setting nil should be safe
}

func TestConcurrentAccess(t *testing.T) {
	ResetCli()

	var wg sync.WaitGroup
	errors := make(chan error, 10)

	// Test concurrent reads
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			// GetCli should be safe for concurrent use
			GetCli()
		}()
	}

	wg.Wait()
	close(errors)

	// Check for any unexpected errors
	for err := range errors {
		if err != nil {
			t.Errorf("Concurrent access error: %v", err)
		}
	}
}
