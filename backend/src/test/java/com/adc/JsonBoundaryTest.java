package com.adc;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.interfaces.PatientController;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.jackson.autoconfigure.JacksonAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import tools.jackson.databind.json.JsonMapper;

class JsonBoundaryTest {
    @Test void approvedIdAndConfirmationTypesAreNotSilentlyCoerced() {
        new ApplicationContextRunner().withConfiguration(AutoConfigurations.of(JacksonAutoConfiguration.class))
            .withUserConfiguration(com.adc.interfaces.RequestJsonConfiguration.class)
            .withPropertyValues("spring.jackson.deserialization.fail-on-unknown-properties=true").run(context->{
                var json=context.getBean(JsonMapper.class);
                var valid=json.readValue("{\"clinic_id\":\"9007199254740993\",\"person_confirmed\":true,\"service_basis\":\"fixture\"}",PatientController.Basis.class);
                assertEquals("9007199254740993",valid.clinic_id());
                assertThrows(RuntimeException.class,()->json.readValue("{\"clinic_id\":1,\"person_confirmed\":true,\"service_basis\":\"fixture\"}",PatientController.Basis.class));
                assertThrows(RuntimeException.class,()->json.readValue("{\"clinic_id\":\"1\",\"person_confirmed\":\"true\",\"service_basis\":\"fixture\"}",PatientController.Basis.class));
                assertThrows(RuntimeException.class,()->json.readValue("{\"clinic_id\":\"1\",\"person_confirmed\":true,\"service_basis\":\"fixture\",\"patient_id\":\"2\"}",PatientController.Basis.class));
            });
    }
}
