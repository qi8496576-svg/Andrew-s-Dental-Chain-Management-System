package com.adc.infrastructure;

import java.time.Clock;
import org.springframework.context.annotation.*;

@Configuration(proxyBeanMethods=false)
public class FoundationConfiguration {
    @Bean Clock serverClock() { return Clock.systemUTC(); }
    @Bean TransactionLocks transactionLocks(javax.sql.DataSource pool) { return new TransactionLocks(pool); }
}
