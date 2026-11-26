package com.adc.interfaces;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import tools.jackson.databind.cfg.CoercionAction;
import tools.jackson.databind.cfg.CoercionInputShape;
import tools.jackson.databind.type.LogicalType;

/** Enforce the already approved JSON types, including decimal-string IDs and real booleans. */
@Configuration(proxyBeanMethods=false)
public class RequestJsonConfiguration {
    @Bean JsonMapperBuilderCustomizer strictRequestTypes() {
        return builder->{
            builder.withCoercionConfig(LogicalType.Textual,config->{
                for(var shape:new CoercionInputShape[]{CoercionInputShape.Integer,CoercionInputShape.Float,CoercionInputShape.Boolean})config.setCoercion(shape,CoercionAction.Fail);
            });
            builder.withCoercionConfig(LogicalType.Boolean,config->{
                for(var shape:new CoercionInputShape[]{CoercionInputShape.Integer,CoercionInputShape.Float,CoercionInputShape.String,CoercionInputShape.EmptyString})config.setCoercion(shape,CoercionAction.Fail);
            });
            builder.withCoercionConfig(LogicalType.Integer,config->{
                for(var shape:new CoercionInputShape[]{CoercionInputShape.Float,CoercionInputShape.Boolean,CoercionInputShape.String,CoercionInputShape.EmptyString})config.setCoercion(shape,CoercionAction.Fail);
            });
        };
    }
}
