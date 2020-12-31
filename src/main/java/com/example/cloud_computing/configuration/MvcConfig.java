package com.example.cloud_computing.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


@Configuration
public class MvcConfig implements WebMvcConfigurer {

	@Override
	public void addViewControllers(ViewControllerRegistry registry) {
		/// senza autenticazione
		registry.addViewController("/").setViewName("index");
		registry.addViewController("/home").setViewName("index");

		registry.addViewController("/preview_select").setViewName("preview_select");
		registry.addViewController("/add_order_form").setViewName("add_order_form");
		registry.addViewController("/privacy").setViewName("privacy");
		registry.addViewController("/cookie").setViewName("cookie");

		/// con autenticazione
		registry.addViewController("/manager").setViewName("manager");
		registry.addViewController("/profile").setViewName("edit_billing_info");
		registry.addViewController("/campaigns").setViewName("list_campaigns");
		registry.addViewController("/preview").setViewName("preview");



		registry.addViewController("/logout").setViewName("clearfirebase");

		/// con autenticazione e customer
		registry.addViewController("/products").setViewName("list_products");
		registry.addViewController("/campaign/new").setViewName("add_campaign");
		registry.addViewController("/campaign/add/banner").setViewName("add_banner");

		/// con autenticazione e sales
		registry.addViewController("/create/user").setViewName("create_user");
		registry.addViewController("/company/add").setViewName("add_company");

		/// todo: con autenticazione e admin
		registry.addViewController("/admin/create/sales").setViewName("create_sales");
	}
}
