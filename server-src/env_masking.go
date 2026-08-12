package main

import (
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"

	"github.com/docker/docker/api/types/container"
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

// sensitiveArgName matches the argument and header names that hold a secret, or
// are followed by one held in a separate token such as "--password s3cr3t". It
// is deliberately broad: a name that merely looks like a secret holder costs a
// masked diagnostic, a name that is missed leaks a secret.
var sensitiveArgName = regexp.MustCompile(`(?i)pass|pwd|secret|token|key|cred|auth|bearer|session|cookie|salt|signature|licen[cs]e|certificate|private|jwt|dsn|conn`)

// headerArgName matches a "Name: value" pair, the shape an HTTP header takes on
// a command line, as in "curl -H 'Authorization: Bearer …'". Whitespace after
// the colon is optional because valid header values are commonly written without
// it; the sensitive-name check keeps URLs and "host:port" pairs readable.
var headerArgName = regexp.MustCompile(`^([A-Za-z][A-Za-z0-9-]*):([ \t]*)(.+)$`)

// maxCommandNesting bounds the recursion into the command lines carried by a
// single token, "sh -c 'curl …'" being the usual shape. Every level strips a
// quoting layer, so the bound is a safety net rather than a real limit.
const maxCommandNesting = 3

// structuralLabelPrefixes lists the label namespaces holding structural metadata
// — stack membership, image provenance, dashboard service discovery — rather
// than user data. Their values stay readable; everything else is masked.
var structuralLabelPrefixes = []string{"com.docker.", "org.opencontainers.", "dsd."}

// maskArgs masks the secrets carried by a command line. Five shapes are
// covered: a value glued to its flag ("--api-token=s3cr3t"), a value held in
// the token following a sensitive flag ("--password s3cr3t"), a header value
// ("Authorization: Bearer …"), credentials embedded in a URL
// ("postgres://user:pw@host") and a whole command line held in a single token
// ("sh -c 'curl …'"). Flag names and the values of the flags that do not look
// like secret holders stay readable, so "--log-level=debug" survives masking
// and the command line remains a usable diagnostic.
func maskArgs(args []string) []string {
	if len(args) == 0 {
		return args
	}
	masked := make([]string, len(args))
	maskNextToken := false
	for i, arg := range args {
		quote, content := splitQuotes(arg)
		masked[i] = quote + maskCommandToken(content, maskNextToken, 0) + quote
		maskNextToken = isSensitiveFlag(content)
	}
	return masked
}

// maskCommandLine masks the tokens of a command line held in a single string,
// such as the shell form of a health check or the script passed to "sh -c". The
// spacing and the quoting of the line are preserved, so what comes back still
// reads as the command that was written.
func maskCommandLine(line string, depth int) string {
	var masked strings.Builder
	end := 0
	maskNextToken := false
	for _, token := range shellSplit(line) {
		quote, content := splitQuotes(line[token[0]:token[1]])
		masked.WriteString(line[end:token[0]])
		masked.WriteString(quote + maskCommandToken(content, maskNextToken, depth) + quote)
		maskNextToken = isSensitiveFlag(content)
		end = token[1]
	}
	masked.WriteString(line[end:])
	return masked.String()
}

// maskCommandToken masks the unquoted content of a single command-line token.
// maskNextToken tells whether the preceding token was a sensitive flag, which
// makes this one its value.
func maskCommandToken(content string, maskNextToken bool, depth int) string {
	if name, value, found := strings.Cut(content, "="); found && value != "" && isHeaderFlag(name) {
		// The value still carries the quotes the shell would have removed, as
		// in --header='Authorization: …'. They sit inside the token, so
		// maskCommandLine never strips them; peel them off for the header
		// matcher and put them back afterwards.
		quote, unquoted := splitQuotes(value)
		if header, isHeader := maskHeaderArg(unquoted); isHeader {
			return name + "=" + quote + header + quote
		}
	}
	header, isHeader := maskHeaderArg(content)
	switch {
	case maskNextToken && !strings.HasPrefix(content, "-"):
		return masker.Password(content)
	case isHeader:
		return header
	case depth < maxCommandNesting && strings.ContainsAny(content, " \t"):
		return maskCommandLine(content, depth+1)
	}
	if name, value, found := strings.Cut(content, "="); found && value != "" {
		if sensitiveArgName.MatchString(name) {
			return name + "=" + masker.Password(value)
		}
		return name + "=" + maskURLCredentials(value)
	}
	return maskURLCredentials(content)
}

// maskHeaderArg masks the value of a "Name: value" pair whose name looks like a
// secret holder. It reports whether the token had that shape at all, so a header
// carrying no secret is left to the ordinary token rules.
func maskHeaderArg(content string) (string, bool) {
	header := headerArgName.FindStringSubmatch(content)
	if header == nil || !sensitiveArgName.MatchString(header[1]) {
		return content, false
	}
	return header[1] + ":" + header[2] + masker.Password(header[3]), true
}

// isSensitiveFlag reports whether a token is a flag whose value is held by the
// token that follows it, as in "--password s3cr3t".
func isSensitiveFlag(content string) bool {
	return strings.HasPrefix(content, "-") && !strings.Contains(content, "=") && sensitiveArgName.MatchString(content)
}

// isHeaderFlag reports whether a flag carries an HTTP header value.
func isHeaderFlag(name string) bool {
	return name == "-H" || name == "--header"
}

// maskURLCredentials masks the password of a URL carrying credentials and
// returns every other token untouched. The URL masker is only reached once the
// token really has a userinfo section: it goes through net/url, which
// percent-escapes and lowercases what it parses, and would rewrite ordinary
// tokens such as "{{.Names}}" or "C:\app".
func maskURLCredentials(token string) string {
	if !strings.Contains(token, "://") || !strings.Contains(token, "@") {
		return token
	}
	parsed, err := url.Parse(token)
	if err != nil || parsed.User == nil {
		return token
	}
	if _, hasPassword := parsed.User.Password(); !hasPassword {
		return token
	}
	return masker.URL(token)
}

// splitQuotes separates the quotes surrounding a token from its content, so the
// content can be masked and the token rebuilt as it was written.
func splitQuotes(token string) (quote, content string) {
	if len(token) < 2 {
		return "", token
	}
	first := token[0]
	if (first == '\'' || first == '"') && token[len(token)-1] == first {
		return string(first), token[1 : len(token)-1]
	}
	return "", token
}

// shellSplit returns the bounds of the tokens of a command line, treating
// single and double quotes as grouping characters. Bounds rather than
// substrings, so the caller can rebuild the line with its original spacing.
func shellSplit(line string) [][2]int {
	var tokens [][2]int
	start := -1
	var quote byte
	for i := 0; i < len(line); i++ {
		char := line[i]
		switch {
		case quote != 0:
			if char == quote {
				quote = 0
			}
		case char == '\'' || char == '"':
			quote = char
			if start < 0 {
				start = i
			}
		case char == ' ' || char == '\t' || char == '\n' || char == '\r':
			if start >= 0 {
				tokens = append(tokens, [2]int{start, i})
				start = -1
			}
		default:
			if start < 0 {
				start = i
			}
		}
	}
	if start >= 0 {
		tokens = append(tokens, [2]int{start, len(line)})
	}
	return tokens
}

// maskHealthcheck returns a copy of the health check with its command masked,
// so the config the caller received from the Docker API keeps its values.
func maskHealthcheck(healthcheck *container.HealthConfig) *container.HealthConfig {
	masked := *healthcheck
	masked.Test = maskHealthcheckTest(masked.Test)
	return &masked
}

// maskHealthcheckTest masks the health check command. Its first element is the
// test directive — NONE, CMD or CMD-SHELL — and stays readable; the rest is a
// command line, and the shell form holds a whole one in a single string, so it
// carries credentials as readily as an entrypoint does.
func maskHealthcheckTest(test []string) []string {
	if len(test) < 2 || strings.EqualFold(test[0], "NONE") {
		return test
	}
	masked := make([]string, len(test))
	masked[0] = test[0]
	copy(masked[1:], maskArgs(test[1:]))
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
	if containerSpec.Healthcheck != nil {
		containerSpec.Healthcheck = maskHealthcheck(containerSpec.Healthcheck)
	}
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
