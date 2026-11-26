package com.adc.support;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.UUID;
import org.testcontainers.mysql.MySQLContainer;
import org.testcontainers.utility.DockerImageName;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** Test-source-only owner of a disposable database; accepts no external JDBC URL. */
public final class MySqlFixture implements AutoCloseable {
    private final MySQLContainer container;

    private MySqlFixture() {
        container = new MySQLContainer(DockerImageName.parse(
                "mysql@sha256:72c368d898861f3b3a07af0e6d690400f44f048799ed46822783d9224cc2c86d"))
                .withDatabaseName("adc_business")
                .withUsername("adc_fixture")
                .withPassword(UUID.randomUUID().toString())
                .withReuse(false)
                .withCommand("--lower-case-table-names=0", "--default-time-zone=+00:00",
                        "--default-storage-engine=InnoDB");
    }

    public static MySqlFixture start() {
        var fixture = new MySqlFixture();
        try { fixture.container.start(); return fixture; }
        catch (RuntimeException failure) { fixture.close(); throw failure; }
    }

    public Connection connection() throws SQLException {
        if (!container.isRunning()) throw new IllegalStateException("Fixture container is not running");
        return DriverManager.getConnection(container.getJdbcUrl(), container.getUsername(), container.getPassword());
    }

    /** Only this disposable fixture; never accepts an external host or password. */
    public Connection administratorConnection() throws SQLException {
        if (!container.isRunning()) throw new IllegalStateException("Fixture container is not running");
        return DriverManager.getConnection(container.getJdbcUrl(), "root", container.getPassword());
    }

    public String jdbcUrl() { return container.getJdbcUrl(); }
    /** Reachable only from another disposable container on Docker's bridge network. */
    public String internalJdbcUrl() {
        String address = container.getContainerInfo().getNetworkSettings().getNetworks()
                .values().iterator().next().getIpAddress();
        return "jdbc:mysql://" + address + ":3306/adc_business";
    }
    public String isolatedRootPassword() { return container.getPassword(); }
    public org.testcontainers.containers.Container.ExecResult exec(String...command) throws Exception { return container.execInContainer(command); }
    public void textFile(String destination,String text) { container.copyFileToContainer(org.testcontainers.images.builder.Transferable.of(text.getBytes(java.nio.charset.StandardCharsets.UTF_8),0600),destination); }
    public void hostFile(java.nio.file.Path source,String destination) { container.copyFileToContainer(org.testcontainers.utility.MountableFile.forHostPath(source),destination); }
    public void copyFrom(String source,java.nio.file.Path destination) { container.copyFileFromContainer(source,destination.toString()); }

    public static JsonNode data() throws Exception {
        try (var stream = MySqlFixture.class.getResourceAsStream("/fixtures/adc-fictional.json")) {
            if (stream == null) throw new IllegalStateException("Missing fictional fixture");
            var result = JsonMapper.builder().build().readTree(stream);
            if (!result.path("fixture_only").asBoolean()) throw new IllegalStateException("Not a test fixture");
            return result;
        }
    }

    @Override public void close() { container.close(); }
}
