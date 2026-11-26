ARG JAVA_RUNTIME=eclipse-temurin@sha256:dff6eb46527bd293a3c06bbbe9e64e8c9f91f01905b5abbdad31761c03059d2c
FROM ${JAVA_RUNTIME}
WORKDIR /app
COPY --chown=10001:10001 target/adc-backend-0.1.0-SNAPSHOT.jar /app/app.jar
USER 10001:10001
ENV TZ=UTC
EXPOSE 8080 9091
HEALTHCHECK --interval=30s --timeout=8s --start-period=60s --retries=3 CMD ["java","-Xmx32m","-Dloader.main=com.adc.infrastructure.HealthProbeMain","-cp","/app/app.jar","org.springframework.boot.loader.launch.PropertiesLauncher"]
ENTRYPOINT ["java","-cp","/app/app.jar","org.springframework.boot.loader.launch.PropertiesLauncher"]
