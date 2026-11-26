package com.adc.identity;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.Http403ForbiddenEntryPoint;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import com.adc.interfaces.ApiErrors;
import com.adc.domain.shared.DomainFailure;

/** Only implemented controllers are reachable; each validates ADC identity and current object scope. */
@Configuration(proxyBeanMethods = false)
public class BootstrapSecurityConfiguration {
    @Bean
    SecurityFilterChain bootstrapSecurity(HttpSecurity http,WebRequestProtection protection) throws Exception {
        return http
                .authorizeHttpRequests(requests -> requests
                    // These controllers validate the ADC credential and current scope themselves.
                    .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/v1/requests/*","/api/v1/audit-events","/api/v1/auth/csrf","/api/v1/me","/api/v1/identity/staff-accounts").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/v1/identity/grants").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/auth/staff-sessions","/api/v1/auth/wechat-sessions").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/identity/staff-accounts","/api/v1/identity/staff-accounts/*/activate","/api/v1/identity/staff-accounts/*/deactivate","/api/v1/identity/staff-accounts/*/credential-recovery").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/identity/grants","/api/v1/identity/grants/*/revoke").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.DELETE,"/api/v1/auth/session").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/v1/patients/*","/api/v1/patients/*/allergy-records").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/patients","/api/v1/patients/lookup","/api/v1/patients/*/allergy-reviews","/api/v1/patients/*/allergy-records","/api/v1/patients/*/allergy-records/*/correct","/api/v1/patients/*/allergy-records/*/retract").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.PATCH,"/api/v1/patients/*").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/v1/allergies").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/v1/clinics","/api/v1/dentists","/api/v1/qualifications","/api/v1/treatments","/api/v1/clinics/*","/api/v1/dentists/*","/api/v1/qualifications/*","/api/v1/treatments/*","/api/v1/allergies/*").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/clinics","/api/v1/dentists","/api/v1/qualifications","/api/v1/treatments","/api/v1/allergies","/api/v1/dentists/*/qualifications","/api/v1/dentists/*/clinic-assignments").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.PATCH,"/api/v1/clinics/*","/api/v1/dentists/*","/api/v1/qualifications/*","/api/v1/treatments/*","/api/v1/allergies/*").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.PUT,"/api/v1/treatments/*/qualification-requirements").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/v1/me/binding","/api/v1/binding-requests").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/v1/schedules").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/v1/appointments","/api/v1/appointments/*","/api/v1/appointment-candidates").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/v1/workspace/appointments","/api/v1/workspace/summary","/api/v1/workspace/applied-treatments","/api/v1/appointments/*/fee-preview").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/appointments").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/appointments/*/attend","/api/v1/appointments/*/cancel").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/appointments/*/no-show").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/appointments/*/reschedule").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/v1/appointments/*/clinical-context","/api/v1/applied-treatments/*").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.PATCH,"/api/v1/appointments/*/clinical-notes").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/appointments/*/applied-treatments","/api/v1/appointments/*/complete","/api/v1/applied-treatments/*/correct-price").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/appointments/*/invoice").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/v1/invoices/*").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/v1/patient-bills","/api/v1/patient-bills/*","/api/v1/registration-fees/*/*").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/booking-holds","/api/v1/patient-bills/*/demo-payments","/api/v1/patient-bills/*/close","/api/v1/patient-bills/*/refunds").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.PUT,"/api/v1/registration-fees/*/*").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/v1/cost-entries","/api/v1/cost-entries/*","/api/v1/quarterly-performances","/api/v1/quarterly-performances/*/sources").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.GET,"/api/v1/analytics/*").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/cost-entries","/api/v1/cost-entries/*/reverse","/api/v1/performance-preparations","/api/v1/performance-calculations","/api/v1/quarterly-performances/*/publish").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/schedules","/api/v1/schedules/*/suspend").permitAll()
                    .requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/me/patient-registration","/api/v1/me/binding-requests","/api/v1/binding-requests/*/approve","/api/v1/patient-bindings/*/rebind","/api/v1/patient-bindings/*/revoke").permitAll()
                    .anyRequest().denyAll())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .csrf(csrf->csrf.csrfTokenRepository(protection).csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()).ignoringRequestMatchers(WebRequestProtection::nativeRequest))
                .addFilterBefore(protection.originFilter(),CsrfFilter.class)
                .exceptionHandling(errors -> errors
                    .authenticationEntryPoint((request,response,error)->ApiErrors.write(new DomainFailure(403,"ACCESS_DENIED"),request,response))
                    .accessDeniedHandler((request,response,error)->ApiErrors.write(new DomainFailure(403,"ACCESS_DENIED"),request,response)))
                .build();
    }

    @Bean
    UserDetailsService noBootstrapAccounts() {
        // Prevent Boot from creating a default in-memory account or logging its password.
        return username -> { throw new UsernameNotFoundException("Identity implementation is not available"); };
    }
}
