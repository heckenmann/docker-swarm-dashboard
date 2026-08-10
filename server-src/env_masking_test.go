package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	swarmtypes "github.com/docker/docker/api/types/swarm"
)

const maskedValue = "**************"

func containerSpecWithEnv(env ...string) *swarmtypes.ContainerSpec {
	return &swarmtypes.ContainerSpec{Image: "alpine", Env: env}
}

func TestMaskEnvEntry(t *testing.T) {
	cases := []struct {
		name     string
		entry    string
		expected string
	}{
		{"masks the value", "POSTGRES_PASSWORD=s3cr3t", "POSTGRES_PASSWORD=" + maskedValue},
		{"masks everything after the first separator", "URL=postgres://user:pw@host/db", "URL=" + maskedValue},
		{"keeps an empty value untouched", "EMPTY=", "EMPTY="},
		{"keeps an entry without separator untouched", "JUST_A_KEY", "JUST_A_KEY"},
		{"keeps an empty entry untouched", "", ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := maskEnvEntry(tc.entry); got != tc.expected {
				t.Fatalf("expected %q got %q", tc.expected, got)
			}
		})
	}
}

func TestMaskServiceEnvMasksCurrentAndPreviousSpec(t *testing.T) {
	service := swarmtypes.Service{
		ID: "s1",
		Spec: swarmtypes.ServiceSpec{
			TaskTemplate: swarmtypes.TaskSpec{ContainerSpec: containerSpecWithEnv("API_TOKEN=current-secret")},
		},
		PreviousSpec: &swarmtypes.ServiceSpec{
			TaskTemplate: swarmtypes.TaskSpec{ContainerSpec: containerSpecWithEnv("API_TOKEN=previous-secret")},
		},
	}

	masked := maskServiceEnv(service)

	if got := masked.Spec.TaskTemplate.ContainerSpec.Env[0]; got != "API_TOKEN="+maskedValue {
		t.Fatalf("current spec not masked, got %q", got)
	}
	if got := masked.PreviousSpec.TaskTemplate.ContainerSpec.Env[0]; got != "API_TOKEN="+maskedValue {
		t.Fatalf("previous spec not masked, got %q", got)
	}
	if got := service.Spec.TaskTemplate.ContainerSpec.Env[0]; got != "API_TOKEN=current-secret" {
		t.Fatalf("original service was mutated, got %q", got)
	}
	if got := service.PreviousSpec.TaskTemplate.ContainerSpec.Env[0]; got != "API_TOKEN=previous-secret" {
		t.Fatalf("original previous spec was mutated, got %q", got)
	}
	if masked.Spec.TaskTemplate.ContainerSpec.Image != "alpine" {
		t.Fatal("the rest of the container spec must be preserved")
	}
}

func TestMaskServiceEnvWithoutContainerSpec(t *testing.T) {
	service := swarmtypes.Service{ID: "s1"}
	if masked := maskServiceEnv(service); masked.Spec.TaskTemplate.ContainerSpec != nil {
		t.Fatal("expected a nil container spec to stay nil")
	}
}

func TestMaskTaskEnv(t *testing.T) {
	task := swarmtypes.Task{
		ID:   "t1",
		Spec: swarmtypes.TaskSpec{ContainerSpec: containerSpecWithEnv("DB_PASSWORD=hunter2", "LOG_LEVEL=debug")},
	}

	masked := maskTaskEnv(task)

	expected := []string{"DB_PASSWORD=" + maskedValue, "LOG_LEVEL=" + maskedValue}
	for i, want := range expected {
		if got := masked.Spec.ContainerSpec.Env[i]; got != want {
			t.Fatalf("expected %q got %q", want, got)
		}
	}
	if got := task.Spec.ContainerSpec.Env[0]; got != "DB_PASSWORD=hunter2" {
		t.Fatalf("original task was mutated, got %q", got)
	}
}

func TestMaskArgs(t *testing.T) {
	cases := []struct {
		name     string
		args     []string
		expected []string
	}{
		{
			"masks a value glued to its flag",
			[]string{"serve", "--password=s3cr3t"},
			[]string{"serve", "--password=" + maskedValue},
		},
		{
			"masks the token following a sensitive flag",
			[]string{"--password", "s3cr3t", "--verbose"},
			[]string{"--password", maskedValue, "--verbose"},
		},
		{
			"keeps the token following an ordinary flag",
			[]string{"--log-level", "debug"},
			[]string{"--log-level", "debug"},
		},
		{
			"does not swallow the flag following a sensitive flag",
			[]string{"--token", "--verbose"},
			[]string{"--token", "--verbose"},
		},
		{
			"masks credentials embedded in a URL",
			[]string{"postgres://user:pw@host/db"},
			[]string{"postgres://user:xxxxx@host/db"},
		},
		{
			"keeps a plain command readable",
			[]string{"/bin/sh", "-c", "start"},
			[]string{"/bin/sh", "-c", "start"},
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := maskArgs(tc.args)
			if len(got) != len(tc.expected) {
				t.Fatalf("expected %v got %v", tc.expected, got)
			}
			for i := range got {
				if got[i] != tc.expected[i] {
					t.Fatalf("expected %v got %v", tc.expected, got)
				}
			}
		})
	}
}

func TestMaskLabels(t *testing.T) {
	labels := map[string]string{
		"com.docker.stack.namespace":      "my-stack",
		"org.opencontainers.image.source": "https://example.com/repo",
		"dsd.node-exporter":               "true",
		"internal.api-key":                "s3cr3t",
		"empty":                           "",
	}

	masked := maskLabels(labels)

	for _, key := range []string{"com.docker.stack.namespace", "org.opencontainers.image.source", "dsd.node-exporter", "empty"} {
		if masked[key] != labels[key] {
			t.Fatalf("structural label %q must stay readable, got %q", key, masked[key])
		}
	}
	if masked["internal.api-key"] != maskedValue {
		t.Fatalf("expected a masked label value, got %q", masked["internal.api-key"])
	}
	if labels["internal.api-key"] != "s3cr3t" {
		t.Fatal("the original label map was mutated")
	}
}

func TestMaskContainerSpecSecrets(t *testing.T) {
	spec := swarmtypes.TaskSpec{ContainerSpec: &swarmtypes.ContainerSpec{
		Image:   "alpine",
		Command: []string{"/entrypoint.sh", "--api-token=s3cr3t"},
		Args:    []string{"--password", "hunter2"},
		Labels:  map[string]string{"internal.api-key": "leaked"},
		Privileges: &swarmtypes.Privileges{
			CredentialSpec: &swarmtypes.CredentialSpec{Config: "cfg", File: "spec.json", Registry: ""},
		},
	}}

	maskTaskSpecEnv(&spec)

	if got := spec.ContainerSpec.Command[1]; got != "--api-token="+maskedValue {
		t.Fatalf("command not masked, got %q", got)
	}
	if got := spec.ContainerSpec.Args[1]; got != maskedValue {
		t.Fatalf("args not masked, got %q", got)
	}
	if got := spec.ContainerSpec.Labels["internal.api-key"]; got != maskedValue {
		t.Fatalf("labels not masked, got %q", got)
	}
	credentialSpec := spec.ContainerSpec.Privileges.CredentialSpec
	if credentialSpec.Config != maskedValue || credentialSpec.File != maskedValue {
		t.Fatalf("credential spec not masked, got %+v", credentialSpec)
	}
	if credentialSpec.Registry != "" {
		t.Fatalf("an empty credential field must stay empty, got %q", credentialSpec.Registry)
	}
	if spec.ContainerSpec.Image != "alpine" {
		t.Fatal("the rest of the container spec must be preserved")
	}
}

func TestMaskContainerSpecDoesNotMutateSource(t *testing.T) {
	privileges := &swarmtypes.Privileges{CredentialSpec: &swarmtypes.CredentialSpec{Config: "cfg"}}
	containerSpec := &swarmtypes.ContainerSpec{
		Args:       []string{"--password", "hunter2"},
		Labels:     map[string]string{"internal.api-key": "leaked"},
		Privileges: privileges,
	}
	spec := swarmtypes.TaskSpec{ContainerSpec: containerSpec}

	maskTaskSpecEnv(&spec)

	if containerSpec.Args[1] != "hunter2" {
		t.Fatalf("original args were mutated, got %q", containerSpec.Args[1])
	}
	if containerSpec.Labels["internal.api-key"] != "leaked" {
		t.Fatal("original labels were mutated")
	}
	if privileges.CredentialSpec.Config != "cfg" {
		t.Fatalf("original credential spec was mutated, got %q", privileges.CredentialSpec.Config)
	}
}

func TestMaskServiceLabels(t *testing.T) {
	service := swarmtypes.Service{
		Spec: swarmtypes.ServiceSpec{
			Annotations: swarmtypes.Annotations{
				Name:   "my-service",
				Labels: map[string]string{"com.docker.stack.namespace": "my-stack", "internal.api-key": "s3cr3t"},
			},
		},
		PreviousSpec: &swarmtypes.ServiceSpec{
			Annotations: swarmtypes.Annotations{Labels: map[string]string{"internal.api-key": "previous-secret"}},
		},
	}

	masked := maskServiceEnv(service)

	if masked.Spec.Name != "my-service" {
		t.Fatalf("the service name must stay readable, got %q", masked.Spec.Name)
	}
	if got := masked.Spec.Labels["com.docker.stack.namespace"]; got != "my-stack" {
		t.Fatalf("stack grouping must survive masking, got %q", got)
	}
	if got := masked.Spec.Labels["internal.api-key"]; got != maskedValue {
		t.Fatalf("service label not masked, got %q", got)
	}
	if got := masked.PreviousSpec.Labels["internal.api-key"]; got != maskedValue {
		t.Fatalf("previous spec label not masked, got %q", got)
	}
	if service.Spec.Labels["internal.api-key"] != "s3cr3t" {
		t.Fatal("the original service labels were mutated")
	}
}

func TestMaskTaskLabels(t *testing.T) {
	task := swarmtypes.Task{
		ID:          "t1",
		Annotations: swarmtypes.Annotations{Labels: map[string]string{"internal.api-key": "s3cr3t"}},
	}

	masked := maskTaskEnv(task)

	if got := masked.Labels["internal.api-key"]; got != maskedValue {
		t.Fatalf("task label not masked, got %q", got)
	}
	if task.Labels["internal.api-key"] != "s3cr3t" {
		t.Fatal("the original task labels were mutated")
	}
}

func TestMaskEnvSlicesPreserveNil(t *testing.T) {
	if maskServicesEnv(nil) != nil {
		t.Fatal("expected a nil service slice to stay nil")
	}
	if maskTasksEnv(nil) != nil {
		t.Fatal("expected a nil task slice to stay nil")
	}
}

func TestEnvMaskingCanBeDisabled(t *testing.T) {
	t.Setenv(maskEnvEnv, "false")

	task := swarmtypes.Task{Spec: swarmtypes.TaskSpec{ContainerSpec: containerSpecWithEnv("DB_PASSWORD=hunter2")}}
	if got := maskTaskEnv(task).Spec.ContainerSpec.Env[0]; got != "DB_PASSWORD=hunter2" {
		t.Fatalf("expected the raw value when masking is disabled, got %q", got)
	}
}

func TestEnvMaskingEnabledByDefault(t *testing.T) {
	cases := map[string]bool{"": true, "true": true, "1": true, "false": false, "0": false, "not-a-bool": true}
	for value, expected := range cases {
		t.Run("DSD_MASK_ENV="+value, func(t *testing.T) {
			t.Setenv(maskEnvEnv, value)
			if got := isEnvMaskingEnabled(); got != expected {
				t.Fatalf("expected %v got %v", expected, got)
			}
		})
	}
}

// TestDockerServicesHandlerMasksEnv verifies that no raw environment value ever
// reaches the HTTP response of the services endpoint.
func TestDockerServicesHandlerMasksEnv(t *testing.T) {
	services := []swarmtypes.Service{{
		ID: "s1",
		Spec: swarmtypes.ServiceSpec{
			Annotations:  swarmtypes.Annotations{Name: "svc1"},
			TaskTemplate: swarmtypes.TaskSpec{ContainerSpec: containerSpecWithEnv("POSTGRES_PASSWORD=s3cr3t")},
		},
	}}
	b, _ := json.Marshal(services)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/v1.35/services") {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(b)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/docker/services", nil)
	w := httptest.NewRecorder()
	dockerServicesHandler(w, req)

	body := w.Body.String()
	if strings.Contains(body, "s3cr3t") {
		t.Fatalf("the response leaks the raw environment value: %s", body)
	}
	if !strings.Contains(body, "POSTGRES_PASSWORD="+maskedValue) {
		t.Fatalf("expected a masked environment entry, got %s", body)
	}
}

// TestDockerTasksHandlerMasksEnv verifies the same for the tasks endpoint.
func TestDockerTasksHandlerMasksEnv(t *testing.T) {
	tasks := []swarmtypes.Task{{
		ID:   "t1",
		Spec: swarmtypes.TaskSpec{ContainerSpec: containerSpecWithEnv("DB_PASSWORD=hunter2")},
	}}
	b, _ := json.Marshal(tasks)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/v1.35/tasks") {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(b)
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, "/docker/tasks", nil)
	w := httptest.NewRecorder()
	dockerTasksHandler(w, req)

	body := w.Body.String()
	if strings.Contains(body, "hunter2") {
		t.Fatalf("the response leaks the raw environment value: %s", body)
	}
	if !strings.Contains(body, "DB_PASSWORD="+maskedValue) {
		t.Fatalf("expected a masked environment entry, got %s", body)
	}
}
