package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import java.nio.file.*;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.Test;

class MappingDefinitionTest {
    @Test void allExplicitConstructorMappingsLoadWithoutDatabase() throws Exception {
        var config=new Configuration(); int count=0;
        try(var files=Files.list(Path.of("src/main/resources/mappers"))) {
            for(var file:files.filter(p->p.toString().endsWith("Mapper.xml")).toList()) {
                try(var input=Files.newInputStream(file)) {
                    new XMLMapperBuilder(input,config,file.toString(),config.getSqlFragments()).parse();
                }
                var name=file.getFileName().toString().replace("Mapper.xml","");
                var map=config.getResultMap("com.adc.infrastructure.persistence."+name+"Mapper.row");
                assertTrue(map.getType().isRecord());
                assertEquals(map.getType().getRecordComponents().length,map.getConstructorResultMappings().size());
                assertTrue(config.hasStatement("com.adc.infrastructure.persistence."+name+"Mapper.findById"));
                count++;
            }
        }
        assertEquals(37,count);
    }
}
