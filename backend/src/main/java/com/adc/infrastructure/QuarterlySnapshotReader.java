package com.adc.infrastructure;

import com.adc.domain.performance.QuarterlyCalculation.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

/** Separate proxy establishes a fresh consistent snapshot after the outer quarter lock was acquired. */
@Service
public class QuarterlySnapshotReader {
    private final QuarterlyPerformanceStore store;public QuarterlySnapshotReader(QuarterlyPerformanceStore store){this.store=store;}
    @Transactional(propagation=Propagation.REQUIRES_NEW,isolation=Isolation.REPEATABLE_READ,readOnly=true)
    public Input capture(String start,String end,String cutoff,List<Long> clinics,List<Closure> closures,String personnel,String preparer){return store.capture(start,end,cutoff,clinics,closures,personnel,preparer);}
}
