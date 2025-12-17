package com.example.invoicemanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class InvoiceManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(InvoiceManagementApplication.class, args);
	}

}
