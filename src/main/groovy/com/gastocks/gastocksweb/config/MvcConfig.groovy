package com.gastocks.gastocksweb.config

import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter

@Configuration
class MvcConfig extends WebMvcConfigurerAdapter {

    @Override
    void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/index").setViewName("index")
        registry.addViewController("/").setViewName("index")
        registry.addViewController("/master").setViewName("master")
        registry.addViewController("/simulation").setViewName("simulation")
        registry.addViewController("/symbols").setViewName("symbols")
        registry.addViewController("/login").setViewName("login")
    }

    @Override
    void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
    }

}