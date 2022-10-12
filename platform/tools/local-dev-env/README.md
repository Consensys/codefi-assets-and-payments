# Local Development Environment

The goal of this repository is to provide a local Docker environment supporting typical development scenarios with minimal configuration.

The configured containers span the following packages:
- Kafka
- Quorum Key Manager + Orchestrate
- Ganache + Blockscout
- Elastic + Kibana + Filebeat

# Usage

Start all the containers using `up.sh`.

Stop all the containers using `down.sh`.

# Configuration

The goal is for all the services to be configured with sensible defaults.

Where applicable, these can be overridden via environment variables defined in a `.env`.

See `env.example` for reference.

In order to disable specific packages, we also use environment variables:

```
DISABLE_GANACHE=true
DISABLE_ELASTIC=true
DISABLE_ORCHESTRATE=true
```

All packages are enabled by default except for the Elastic stack given its moderate CPU usage.

## M1 Processors

When using a Macbook with an M1 processor, some of the containers require alternate images with ARM64 support.

This is automatically done when setting `M1=true` in the `.env` file.
