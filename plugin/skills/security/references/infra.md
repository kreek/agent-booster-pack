# Infrastructure, containers, CI/CD, supply chain

Reference for the `security` skill. The security controls that live around
the application: container images, IaC, the build pipeline, and the
software supply chain.

## Container hardening

- Run as a non-root UID (`USER 10001:10001` in the Dockerfile). Required
  baseline; many runtimes enforce it (`runAsNonRoot: true` in Kubernetes
  Pod Security Admission `restricted`).
- Drop all capabilities; add back only what is needed
  (`securityContext.capabilities: drop: [ALL]`). Most apps need none.
- Read-only root filesystem (`readOnlyRootFilesystem: true`). Mount
  `tmpfs` or named volumes for paths that need writes.
- No host mounts by default; never mount the Docker socket or
  `/proc`, `/sys`, `/var/run`.
- Distroless or minimal base images (`gcr.io/distroless/*`,
  `chainguard/static`, `alpine` with explicit shell removal). Smaller
  attack surface; fewer CVEs to triage.
- Pin base image by digest, not floating tag (`FROM image@sha256:...`).
- Multi-stage builds: the build stage may have compilers and dev
  packages; the final stage ships only the binary and its runtime deps.
- **No secrets in image layers.** Layers are public after `docker push`.
  Use BuildKit secret mounts (`--mount=type=secret`) or build-time env
  that does not get persisted.
- `HEALTHCHECK` for orchestrator readiness checks; never have it call
  out to the internet.

## Kubernetes baseline

- Pod Security Admission `restricted` namespace label by default.
- Network policies: default-deny ingress and egress; allow only what is
  needed.
- Service accounts: one per workload; do not mount the default token
  (`automountServiceAccountToken: false` unless used).
- IRSA (EKS) / Workload Identity (GKE) / Federated identity (AKS) for
  cloud API access; no static keys in pods.
- Secrets via the cluster's secret store (sealed-secrets, external-secrets
  with Vault/SM, KMS-encrypted etcd), not as ConfigMaps.
- Admission control: `kyverno` or `gatekeeper` to enforce baselines (no
  `:latest` tags, no privileged pods, required labels).

## Cloud baseline

- Workload identity everywhere: IRSA on EKS, Workload Identity on
  GKE, federated tokens on AKS, ECS Task Roles, Cloud Run service
  identities. No long-lived static credentials in workloads.
- IAM least privilege. Start from deny-all; grant per resource ARN /
  fully-qualified resource path; review with IAM Access Analyzer or the
  cloud equivalent. No `*` actions on `*` resources.
- **IMDSv2 mandatory on EC2**; metadata hop limit = 1 to block container
  escape via host IMDS.
- Encryption at rest on all managed storage; bring-your-own-key (KMS)
  for sensitive data classes.
- Object storage: private by default; block public access at the
  account level; use signed URLs for shared access.
- Default-deny security groups / NACLs; egress controls in addition
  to ingress.

## IaC scanning

- `trivy config` / `checkov` for Terraform. Treat `tfsec` as legacy; it
  is now part of Trivy.
- `kube-linter` / `kubeaudit` for Kubernetes manifests.
- `kube-bench` for cluster hardening against the CIS benchmark.
- `trivy config` is a generalist that covers Dockerfiles, Terraform,
  Kubernetes, CloudFormation, Helm, Kustomize.

Run on every PR; block merge on high-severity findings reaching production
modules.

## Image scanning

Source-tree audit (see `dep-audit.md`) does not cover OS packages baked
into runtime images.

- `trivy image <ref>`: fast, broad, OS + language deps + secrets +
  misconfigs.
- `grype <ref>`: alternative engine, useful for cross-checking.
- `docker scout cves <ref>`: Docker Hub native.

Run on the image being promoted; gate the deploy on results.

## CI/CD identity and supply chain

- OIDC for cloud auth from CI (GitHub Actions → AWS, GCP, Azure; GitLab
  equivalent). Eliminates long-lived static keys.
- Pin Action / Reusable-workflow versions to a SHA, not a tag. Tag
  promises can be moved by the action's owner; SHAs cannot.
- **`pull_request_target` is dangerous.** Workflows triggered by it run
  with the base repo's secrets and can be abused by PR-supplied code.
  Avoid; if needed, do not check out the PR head, or use a dedicated
  isolated workflow.
- Branch protection: required reviews, required status checks, no
  force-push to protected branches, signed commits where appropriate.
- Secrets scoped per environment. Production secrets never available
  in PR builds. Use environment protection rules.
- Provenance: generate SLSA build provenance (SLSA-GitHub-Generator,
  GitHub Artifact Attestations); consumers verify before deploy.
- Sign artifacts. Sigstore / cosign for container images and binaries;
  policy controllers (kyverno, policy-controller) verify signatures at
  admission.
- SBOM per release (`syft`, `cdxgen`); store with the artifact; required
  for incident response when a CVE drops.

## Dependency confusion and typosquatting

- Pin internal package names with a scope (`@yourcompany/foo`) or unique
  prefix; register your scopes in the public registry to prevent
  squatting.
- Use a private registry / proxy (Artifactory, Verdaccio, GitHub Packages)
  with explicit allowlist of which packages may be fetched from public.
- Review PRs that add new dependencies with extra scrutiny: maturity,
  download volume, maintainer history, presence of post-install / setup
  scripts.
- Disable lifecycle scripts in CI where possible (`npm install
  --ignore-scripts`, `pnpm config set ignore-scripts true`).

## TLS

- TLS 1.2 minimum; prefer 1.3.
- Disable RC4, 3DES, CBC ciphers, export ciphers, NULL ciphers.
- HSTS with `max-age` ≥ 1 year and `includeSubDomains`; `preload` only
  with intent to enrol.
- Certificate Transparency monitoring (e.g. crt.sh subscriptions, Cert
  Spotter); alert on certs you did not issue for your domain.
- Internal mTLS via SPIFFE/SPIRE or a service mesh; rotate every ≤ 24h.

## See also

- `dep-audit.md` for application dependency scanning.
- `secrets-scan.md` for credential leak detection.
- `secrets.md` for where credentials and keys belong.
- `deployment` skill for rollout strategy and migration coordination.
