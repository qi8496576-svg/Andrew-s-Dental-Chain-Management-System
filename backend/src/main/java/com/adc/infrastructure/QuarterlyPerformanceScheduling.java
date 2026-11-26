package com.adc.infrastructure;

import com.adc.application.performance.QuarterlyPerformanceJob;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.*;

/** Hourly catch-up also covers a server that was down at the natural quarter boundary. */
@Configuration(proxyBeanMethods=false) @EnableScheduling
@ConditionalOnProperty(name="adc.performance.scheduling.enabled",havingValue="true",matchIfMissing=true)
public class QuarterlyPerformanceScheduling {
    private final QuarterlyPerformanceJob job;public QuarterlyPerformanceScheduling(QuarterlyPerformanceJob job){this.job=job;}
    @Scheduled(cron="0 5 * * * *",zone="Asia/Shanghai")
    public void catchUp(){try{job.previousQuarter();}catch(RuntimeException failure){org.slf4j.LoggerFactory.getLogger(getClass()).error("Quarterly calculation unavailable; no publication performed; error_kind={}",failure.getClass().getSimpleName());}}
}
