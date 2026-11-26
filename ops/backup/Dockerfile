FROM mysql@sha256:72c368d898861f3b3a07af0e6d690400f44f048799ed46822783d9224cc2c86d
USER root
# Build context is tmp/backup-tools, prepared and signature-verified by Prepare-BackupTools.ps1.
COPY --chmod=0755 mysqlbinlog /usr/local/bin/mysqlbinlog
RUN mysqlbinlog --version
