FROM ubuntu:22.04

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        shellcheck \
        unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists
    
ADD https://github.com/hadolint/hadolint/releases/download/v2.12.0/hadolint-Linux-x86_64 /usr/local/bin/hadolint
RUN chmod 755 /usr/local/bin/hadolint
 
RUN curl -fsSL https://deno.land/install.sh | sh \
    && mv /root/.deno/bin/deno /usr/local/bin/deno \
    && deno --version