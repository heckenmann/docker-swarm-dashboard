package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/docker/docker/api/types/container"
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
		{
			"keeps an ordinary setting readable",
			[]string{"--log-level=debug", "--config=/etc/app.yaml"},
			[]string{"--log-level=debug", "--config=/etc/app.yaml"},
		},
		{
			"masks the credentials of an ordinary setting holding a URL",
			[]string{"--dsn=postgres://user:pw@host/db"},
			[]string{"--dsn=" + maskedValue},
		},
		{
			"keeps a URL without credentials readable",
			[]string{"--endpoint=https://api.example.com/v1"},
			[]string{"--endpoint=https://api.example.com/v1"},
		},
		{
			"leaves a token net/url would rewrite alone",
			[]string{"--format={{.Names}}", `C:\app\run.exe`},
			[]string{"--format={{.Names}}", `C:\app\run.exe`},
		},
		{
			"keeps a URL whose userinfo holds no password readable",
			[]string{"https://registry@example.com/v2"},
			[]string{"https://registry@example.com/v2"},
		},
		{
			"leaves an unparsable URL alone",
			[]string{"http://%zz@host"},
			[]string{"http://%zz@host"},
		},
		{
			"leaves a one-character token alone",
			[]string{"-", ""},
			[]string{"-", ""},
		},
		{
			"masks the value of a sensitive header",
			[]string{"curl", "-H", "'Authorization: Bearer s3cr3t'"},
			[]string{"curl", "-H", "'Authorization: " + maskedValue + "'"},
		},
		{
			"keeps an ordinary header readable",
			[]string{"curl", "-H", "'Accept: application/json'"},
			[]string{"curl", "-H", "'Accept: application/json'"},
		},
		{
			"masks the command line held in a single token",
			[]string{"sh", "-c", "curl -H 'Authorization: Bearer s3cr3t' https://api/health"},
			[]string{"sh", "-c", "curl -H 'Authorization: " + maskedValue + "' https://api/health"},
		},
		{
			"masks a multi-word value following a sensitive flag",
			[]string{"--password", "'a secret pass'"},
			[]string{"--password", "'" + maskedValue + "'"},
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

func TestMaskHealthcheckTest(t *testing.T) {
	cases := []struct {
		name     string
		test     []string
		expected []string
	}{
		{
			"masks the credentials of a shell health check",
			[]string{"CMD-SHELL", "curl -f -H 'Authorization: Bearer s3cr3t' http://localhost/health"},
			[]string{"CMD-SHELL", "curl -f -H 'Authorization: " + maskedValue + "' http://localhost/health"},
		},
		{
			"masks the credentials of an exec health check",
			[]string{"CMD", "pg_isready", "--dbname", "postgres://user:pw@host/db", "--password=s3cr3t"},
			[]string{"CMD", "pg_isready", "--dbname", "postgres://user:xxxxx@host/db", "--password=" + maskedValue},
		},
		{
			"keeps the directive and an ordinary check readable",
			[]string{"CMD", "curl", "-f", "http://localhost/health"},
			[]string{"CMD", "curl", "-f", "http://localhost/health"},
		},
		{"keeps a disabled health check untouched", []string{"NONE"}, []string{"NONE"}},
		{"keeps an inherited health check untouched", nil, nil},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := maskHealthcheckTest(tc.test)
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

func TestMaskContainerSpecHealthcheck(t *testing.T) {
	healthcheck := &container.HealthConfig{
		Test:     []string{"CMD-SHELL", "curl -H 'Authorization: Bearer s3cr3t' http://localhost/health"},
		Interval: 30 * time.Second,
	}
	spec := swarmtypes.TaskSpec{ContainerSpec: &swarmtypes.ContainerSpec{Healthcheck: healthcheck}}

	maskTaskSpecEnv(&spec)

	masked := spec.ContainerSpec.Healthcheck
	if strings.Contains(masked.Test[1], "s3cr3t") {
		t.Fatalf("health check not masked, got %q", masked.Test[1])
	}
	if masked.Interval != 30*time.Second {
		t.Fatalf("the rest of the health check must be preserved, got %v", masked.Interval)
	}
	if !strings.Contains(healthcheck.Test[1], "s3cr3t") {
		t.Fatalf("the original health check was mutated, got %q", healthcheck.Test[1])
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

// secretBearingContainerSpec returns a container spec holding one secret of
// every kind the masking covers, each tagged with the given owner so a leak can
// be traced back to the object it came from.
func secretBearingContainerSpec(owner string) *swarmtypes.ContainerSpec {
	return &swarmtypes.ContainerSpec{
		Image:   "alpine",
		Env:     []string{"POSTGRES_PASSWORD=" + owner + "-env"},
		Command: []string{"/entrypoint.sh", "--api-token=" + owner + "-command"},
		Args:    []string{"--password", owner + "-arg"},
		Labels:  map[string]string{"internal.api-key": owner + "-label"},
		Healthcheck: &container.HealthConfig{
			Test: []string{"CMD-SHELL", "curl -H 'Authorization: Bearer " + owner + "-healthcheck' http://localhost/health"},
		},
		Privileges: &swarmtypes.Privileges{
			CredentialSpec: &swarmtypes.CredentialSpec{Config: owner + "-credentialspec"},
		},
	}
}

// secretsOf lists the raw values secretBearingContainerSpec hides, in the form
// they must never take in a response.
func secretsOf(owner string) []string {
	return []string{
		owner + "-env",
		owner + "-command",
		owner + "-arg",
		owner + "-label",
		owner + "-healthcheck",
		owner + "-credentialspec",
	}
}

// secretBearingService returns a service whose current and previous specs both
// carry secrets, at the service level and in the container spec.
func secretBearingService(owner string) swarmtypes.Service {
	return swarmtypes.Service{
		ID: "s1",
		Spec: swarmtypes.ServiceSpec{
			Annotations: swarmtypes.Annotations{
				Name:   "svc1",
				Labels: map[string]string{"internal.api-key": owner + "-label"},
			},
			TaskTemplate: swarmtypes.TaskSpec{ContainerSpec: secretBearingContainerSpec(owner)},
		},
		PreviousSpec: &swarmtypes.ServiceSpec{
			TaskTemplate: swarmtypes.TaskSpec{ContainerSpec: secretBearingContainerSpec(owner + "-previous")},
		},
	}
}

// secretBearingTask returns a task carrying secrets in its labels and its spec,
// attached to the service and the node the fixtures below use.
func secretBearingTask(owner string) swarmtypes.Task {
	return swarmtypes.Task{
		ID:          "t1",
		ServiceID:   "s1",
		NodeID:      "n1",
		Annotations: swarmtypes.Annotations{Labels: map[string]string{"internal.api-key": owner + "-label"}},
		Spec:        swarmtypes.TaskSpec{ContainerSpec: secretBearingContainerSpec(owner)},
	}
}

// swarmTestServer answers the Docker endpoints the handlers call with the given
// objects, whatever filters the request carries.
func swarmTestServer(t *testing.T, services []swarmtypes.Service, tasks []swarmtypes.Task, nodes []swarmtypes.Node) *httptest.Server {
	t.Helper()
	body := func(objects interface{}) []byte {
		encoded, err := json.Marshal(objects)
		if err != nil {
			t.Fatalf("failed to encode the fixture: %v", err)
		}
		return encoded
	}
	responses := map[string][]byte{
		"/v1.35/services": body(services),
		"/v1.35/tasks":    body(tasks),
		"/v1.35/nodes":    body(nodes),
	}
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		for path, response := range responses {
			if strings.HasPrefix(r.URL.Path, path) {
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write(response)
				return
			}
		}
		http.NotFound(w, r)
	}))
}

// serveMasked runs a handler against the given swarm objects and returns the
// body it wrote.
func serveMasked(t *testing.T, handler http.HandlerFunc, target string, vars map[string]string, services []swarmtypes.Service, tasks []swarmtypes.Task, nodes []swarmtypes.Node) string {
	t.Helper()
	server := swarmTestServer(t, services, tasks, nodes)
	defer server.Close()

	defer ResetCli()
	SetCli(makeClientForServer(t, server.URL))

	req := httptest.NewRequest(http.MethodGet, target, nil)
	if vars != nil {
		req = muxSetVars(req, vars)
	}
	w := httptest.NewRecorder()
	handler(w, req)
	return w.Body.String()
}

// assertMasked fails when a raw value reached the response, and when nothing was
// masked at all — an empty response would otherwise pass every leak check.
func assertMasked(t *testing.T, body string, secrets ...string) {
	t.Helper()
	for _, secret := range secrets {
		if strings.Contains(body, secret) {
			t.Fatalf("the response leaks %q: %s", secret, body)
		}
	}
	if !strings.Contains(body, maskedValue) {
		t.Fatalf("expected masked values in the response, got %s", body)
	}
}

// TestDockerServicesHandlerMasksEnv verifies that no raw secret ever reaches the
// HTTP response of the services endpoint.
func TestDockerServicesHandlerMasksEnv(t *testing.T) {
	body := serveMasked(t, dockerServicesHandler, "/docker/services", nil,
		[]swarmtypes.Service{secretBearingService("service")}, nil, nil)

	assertMasked(t, body, append(secretsOf("service"), secretsOf("service-previous")...)...)
	if !strings.Contains(body, "POSTGRES_PASSWORD="+maskedValue) {
		t.Fatalf("expected a masked environment entry, got %s", body)
	}
}

// TestDockerTasksHandlerMasksEnv verifies the same for the tasks endpoint.
func TestDockerTasksHandlerMasksEnv(t *testing.T) {
	body := serveMasked(t, dockerTasksHandler, "/docker/tasks", nil,
		nil, []swarmtypes.Task{secretBearingTask("task")}, nil)

	assertMasked(t, body, secretsOf("task")...)
	if !strings.Contains(body, "POSTGRES_PASSWORD="+maskedValue) {
		t.Fatalf("expected a masked environment entry, got %s", body)
	}
}

// TestDockerServicesDetailsHandlerMasksEnv verifies that the enriched detail
// response of a service leaks neither the secrets of the service nor those of
// the tasks it embeds.
func TestDockerServicesDetailsHandlerMasksEnv(t *testing.T) {
	body := serveMasked(t, dockerServicesDetailsHandler, "/docker/services/s1", map[string]string{"id": "s1"},
		[]swarmtypes.Service{secretBearingService("service")},
		[]swarmtypes.Task{secretBearingTask("task")},
		[]swarmtypes.Node{{ID: "n1", Description: swarmtypes.NodeDescription{Hostname: "node1"}}})

	secrets := append(secretsOf("service"), secretsOf("service-previous")...)
	assertMasked(t, body, append(secrets, secretsOf("task")...)...)
	if !strings.Contains(body, "svc1") || !strings.Contains(body, "node1") {
		t.Fatalf("the response must stay identifiable, got %s", body)
	}
}

// TestDockerTasksDetailsHandlerMasksEnv verifies the same for a single task.
func TestDockerTasksDetailsHandlerMasksEnv(t *testing.T) {
	body := serveMasked(t, dockerTasksDetailsHandler, "/docker/tasks/t1", map[string]string{"id": "t1"},
		[]swarmtypes.Service{secretBearingService("service")},
		[]swarmtypes.Task{secretBearingTask("task")},
		[]swarmtypes.Node{{ID: "n1", Description: swarmtypes.NodeDescription{Hostname: "node1"}}})

	assertMasked(t, body, secretsOf("task")...)
	if !strings.Contains(body, `"NodeName":"node1"`) || !strings.Contains(body, `"ServiceName":"svc1"`) {
		t.Fatalf("the response must stay identifiable, got %s", body)
	}
}

// TestDockerNodesDetailsHandlerMasksEnv verifies that the tasks and the services
// embedded in the detail response of a node are masked too.
func TestDockerNodesDetailsHandlerMasksEnv(t *testing.T) {
	body := serveMasked(t, dockerNodesDetailsHandler, "/docker/nodes/n1", map[string]string{"id": "n1"},
		[]swarmtypes.Service{secretBearingService("service")},
		[]swarmtypes.Task{secretBearingTask("task")},
		[]swarmtypes.Node{{ID: "n1", Description: swarmtypes.NodeDescription{Hostname: "node1"}}})

	secrets := append(secretsOf("service"), secretsOf("service-previous")...)
	assertMasked(t, body, append(secrets, secretsOf("task")...)...)
	if !strings.Contains(body, "node1") {
		t.Fatalf("the response must stay identifiable, got %s", body)
	}
}
