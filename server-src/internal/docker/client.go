// Package docker provides a shared Docker client for the dashboard server.
// The client is created lazily from environment variables and cached globally.
// Use SetCli and ResetCli in tests to inject a custom client.
package docker

import "github.com/docker/docker/client"

var cli *client.Client

// GetCli returns the shared Docker client, creating one from the environment if
// none has been set yet. Panics if the client cannot be created.
func GetCli() *client.Client {
	if cli == nil {
		var err error
		cli, err = client.NewClientWithOpts(
			client.FromEnv,
			client.WithAPIVersionNegotiation(),
		)
		if err != nil {
			panic(err)
		}
	}
	return cli
}

// SetCli replaces the cached client. Used in tests to inject a mock/test client.
func SetCli(c *client.Client) {
	cli = c
}

// ResetCli clears the cached client so the next call to GetCli re-creates it
// from the current environment.
func ResetCli() {
	cli = nil
}
