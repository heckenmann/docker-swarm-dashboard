package main

import (
	"os"
	"regexp"
	"strconv"
	"strings"

	"github.com/docker/docker/api/types/swarm"
	masker "github.com/ggwhite/go-masker/v3"
)

const maskEnvEnv = "DSD_MASK_ENV"

// isEnvMaskingEnabled reports whether the secret-bearing fields of a container
// spec must be masked before being serialized. Masking is on by default; set
// DSD_MASK_ENV to a false value to expose the raw values.
func isEnvMaskingEnabled() bool {
	value := os.Getenv(maskEnvEnv)
	if value == "" {
		return true
	}
	enabled, err := strconv.ParseBool(value)
	if err != nil {
		return true
	}
	return enabled
}

// maskEnvEntry masks the value of a single "KEY=value" entry. The key is kept
// visible so operators can still tell which variables a service defines, and
// the replacement has a fixed length so it does not leak the value's size.
func maskEnvEntry(entry string) string {
	key, value, found := strings.Cut(entry, "=")
	if !found || value == "" {
		return entry
	}
	return key + "=" + masker.Password(value)
}

func maskEnvSlice(env []string) []string {
	if len(env) == 0 {
		return env
	}
	masked := make([]string, len(env))
	for i, entry := range env {
		masked[i] = maskEnvEntry(entry)
	}
	return masked
}

// sensitiveArgName matches the argument names that are usually followed by a
// secret held in a separate token, such as "--password s3cr3t".
var sensitiveArgName = regexp.MustCompile(`(?i)pass|pwd|secret|token|key|cred|auth`)

// structuralLabelPrefixes lists the label namespaces holding structural metadata
// — stack membership, image provenance, dashboard service discovery — rather
// than user data. Their values stay readable; everything else is masked.
var structuralLabelPrefixes = []string{"com.docker.", "org.opencontainers.", "dsd."}

// maskArgs masks the secrets carried by a command line. Three shapes are
// covered: a value glued to its flag ("--password=s3cr3t"), a value held in the
// token following a sensitive flag ("--password s3cr3t"), and credentials
// embedded in a URL ("postgres://user:pw@host"). Flag names and plain tokens
// stay readable so the command line remains recognisable.
func maskArgs(args []string) []string {
	if len(args) == 0 {
		return args
	}
	masked := make([]string, len(args))
	maskNextToken := false
	for i, arg := range args {
		isFlag := strings.HasPrefix(arg, "-")
		switch {
		case maskNextToken && !isFlag:
			masked[i] = masker.Password(arg)
		case strings.Contains(arg, "="):
			masked[i] = maskEnvEntry(arg)
		default:
			masked[i] = masker.URL(arg)
		}
		maskNextToken = isFlag && !strings.Contains(arg, "=") && sensitiveArgName.MatchString(arg)
	}
	return masked
}

func maskLabels(labels map[string]string) map[string]string {
	if len(labels) == 0 {
		return labels
	}
	masked := make(map[string]string, len(labels))
	for key, value := range labels {
		if value == "" || hasStructuralPrefix(key) {
			masked[key] = value
			continue
		}
		masked[key] = masker.Password(value)
	}
	return masked
}

func hasStructuralPrefix(label string) bool {
	for _, prefix := range structuralLabelPrefixes {
		if strings.HasPrefix(label, prefix) {
			return true
		}
	}
	return false
}

// maskCredentialSpec masks the managed service account references. They name a
// config, a file or a registry key holding Windows credentials, so they point at
// secrets even when they are not secrets themselves.
func maskCredentialSpec(spec *swarm.CredentialSpec) *swarm.CredentialSpec {
	masked := *spec
	masked.Config = maskIfSet(masked.Config)
	masked.File = maskIfSet(masked.File)
	masked.Registry = maskIfSet(masked.Registry)
	return &masked
}

func maskIfSet(value string) string {
	if value == "" {
		return value
	}
	return masker.Password(value)
}

// maskTaskSpecEnv masks every secret-bearing field of a task spec. The
// ContainerSpec is copied before being rewritten, so the spec the caller
// received from the Docker API keeps its original values.
func maskTaskSpecEnv(spec *swarm.TaskSpec) {
	if spec == nil || spec.ContainerSpec == nil {
		return
	}
	containerSpec := *spec.ContainerSpec
	containerSpec.Env = maskEnvSlice(containerSpec.Env)
	containerSpec.Command = maskArgs(containerSpec.Command)
	containerSpec.Args = maskArgs(containerSpec.Args)
	containerSpec.Labels = maskLabels(containerSpec.Labels)
	if containerSpec.Privileges != nil && containerSpec.Privileges.CredentialSpec != nil {
		privileges := *containerSpec.Privileges
		privileges.CredentialSpec = maskCredentialSpec(privileges.CredentialSpec)
		containerSpec.Privileges = &privileges
	}
	spec.ContainerSpec = &containerSpec
}

// maskServiceSpecEnv masks the service-level labels and the container spec of a
// service spec. The service name is left alone, the UI identifies services by it.
func maskServiceSpecEnv(spec *swarm.ServiceSpec) {
	spec.Labels = maskLabels(spec.Labels)
	maskTaskSpecEnv(&spec.TaskTemplate)
}

// maskServiceEnv returns a copy of the service with the secrets of both its
// current and its previous spec masked.
func maskServiceEnv(service swarm.Service) swarm.Service {
	if !isEnvMaskingEnabled() {
		return service
	}
	maskServiceSpecEnv(&service.Spec)
	if service.PreviousSpec != nil {
		previousSpec := *service.PreviousSpec
		maskServiceSpecEnv(&previousSpec)
		service.PreviousSpec = &previousSpec
	}
	return service
}

func maskServicesEnv(services []swarm.Service) []swarm.Service {
	if !isEnvMaskingEnabled() || len(services) == 0 {
		return services
	}
	masked := make([]swarm.Service, len(services))
	for i, service := range services {
		masked[i] = maskServiceEnv(service)
	}
	return masked
}

// maskTaskEnv returns a copy of the task with its labels and the secrets of its
// spec masked.
func maskTaskEnv(task swarm.Task) swarm.Task {
	if !isEnvMaskingEnabled() {
		return task
	}
	task.Labels = maskLabels(task.Labels)
	maskTaskSpecEnv(&task.Spec)
	return task
}

func maskTasksEnv(tasks []swarm.Task) []swarm.Task {
	if !isEnvMaskingEnabled() || len(tasks) == 0 {
		return tasks
	}
	masked := make([]swarm.Task, len(tasks))
	for i, task := range tasks {
		masked[i] = maskTaskEnv(task)
	}
	return masked
}
