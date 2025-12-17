package com.example.invoicemanagement.service;

import com.example.invoicemanagement.model.Product;
import com.example.invoicemanagement.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product details) {
        return productRepository.findById(id)
                .map(product -> {
                    product.setName(details.getName());
                    product.setCategory(details.getCategory());
                    product.setPrice(details.getPrice());
                    product.setStock(details.getStock());
                    return productRepository.save(product);
                })
                .orElse(null);
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
}
