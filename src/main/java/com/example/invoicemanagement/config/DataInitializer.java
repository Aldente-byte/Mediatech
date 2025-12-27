package com.example.invoicemanagement.config;

import com.example.invoicemanagement.model.Client;
import com.example.invoicemanagement.model.Product;
import com.example.invoicemanagement.model.User;
import com.example.invoicemanagement.repository.ClientRepository;
import com.example.invoicemanagement.repository.ProductRepository;
import com.example.invoicemanagement.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Arrays;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(ProductRepository productRepository,
            ClientRepository clientRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // Produits
            if (productRepository.count() == 0) {
                Product p1 = new Product();
                p1.setName("Bras Robotique Industriel 6-Axes");
                p1.setCategory("Industriel");
                p1.setPrice(new BigDecimal("12500.00"));
                p1.setStock(5);

                Product p2 = new Product();
                p2.setName("Capteur Lidar 360");
                p2.setCategory("Composant");
                p2.setPrice(new BigDecimal("450.00"));
                p2.setStock(20);

                Product p3 = new Product();
                p3.setName("Kit Robot Mobile Éducatif");
                p3.setCategory("Domestique");
                p3.setPrice(new BigDecimal("299.99"));
                p3.setStock(50);

                Product p4 = new Product();
                p4.setName("Servomoteur Haute Précision");
                p4.setCategory("Composant");
                p4.setPrice(new BigDecimal("85.50"));
                p4.setStock(100);

                Product p5 = new Product();
                p5.setName("Module IA Jetson Nano");
                p5.setCategory("Logiciel");
                p5.setPrice(new BigDecimal("150.00"));
                p5.setStock(15);

                productRepository.saveAll(Arrays.asList(p1, p2, p3, p4, p5));
                System.out.println("Produits insérés avec succès !");
            }

            // Clients
            if (clientRepository.count() == 0) {
                Client c1 = new Client();
                c1.setName("Tech Corp Industries");
                c1.setEmail("contact@techcorp.com");
                c1.setAddress("123 Innovation Drive, Silicon Valley");

                Client c2 = new Client();
                c2.setName("EduRobotics Lab");
                c2.setEmail("info@edurobotics.org");
                c2.setAddress("45 University Ave, Cambridge");

                Client c3 = new Client();
                c3.setName("AutoMakers SA");
                c3.setEmail("supply@automakers.com");
                c3.setAddress("789 Factory Lane, Detroit");

                clientRepository.saveAll(Arrays.asList(c1, c2, c3));
                System.out.println("Clients insérés avec succès !");
            }

            // Utilisateurs par défaut - vérification individuelle
            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin"));
                admin.setRole("ROLE_ADMIN");
                userRepository.save(admin);
                System.out.println("Utilisateur créé : admin / admin");
            } else {
                // Ensure admin has correct role
                User admin = userRepository.findByUsername("admin").get();
                if (!"ROLE_ADMIN".equals(admin.getRole())) {
                    admin.setRole("ROLE_ADMIN");
                    userRepository.save(admin);
                    System.out.println("Utilisateur admin mis à jour avec ROLE_ADMIN");
                }
            }

            if (userRepository.findByUsername("commercial").isEmpty()) {
                // Create Client for commercial user
                Client commercialClient = new Client();
                commercialClient.setName("Commercial Account");
                commercialClient.setEmail("commercial@example.com");
                commercialClient.setAddress("Business Address");
                commercialClient = clientRepository.save(commercialClient);
                
                User commercial = new User();
                commercial.setUsername("commercial");
                commercial.setPassword(passwordEncoder.encode("commercial"));
                commercial.setRole("ROLE_USER");
                commercial.setClient(commercialClient);
                userRepository.save(commercial);
                System.out.println("Utilisateur créé : commercial / commercial");
            } else {
                // Ensure existing commercial user has a client
                User commercial = userRepository.findByUsername("commercial").get();
                if (commercial.getClient() == null) {
                    Client commercialClient = new Client();
                    commercialClient.setName("Commercial Account");
                    commercialClient.setEmail("commercial@example.com");
                    commercialClient.setAddress("Business Address");
                    commercialClient = clientRepository.save(commercialClient);
                    commercial.setClient(commercialClient);
                    userRepository.save(commercial);
                    System.out.println("Client créé pour l'utilisateur commercial");
                }
            }
        };
    }
}




//nitialise la base de données avec des données par défaut