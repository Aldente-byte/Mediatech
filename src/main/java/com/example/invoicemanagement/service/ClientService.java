package com.example.invoicemanagement.service;

import com.example.invoicemanagement.model.Client;
import com.example.invoicemanagement.model.Invoice;
import com.example.invoicemanagement.model.User;
import com.example.invoicemanagement.repository.ClientRepository;
import com.example.invoicemanagement.repository.InvoiceRepository;
import com.example.invoicemanagement.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final InvoiceRepository invoiceRepository;

    public ClientService(ClientRepository clientRepository, UserRepository userRepository, InvoiceRepository invoiceRepository) {
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    public Optional<Client> getClientById(Long id) {
        return clientRepository.findById(id);
    }

    public Client createClient(Client client) {
        return clientRepository.save(client);
    }

    @Transactional
    public void deleteClient(Long id) {
        // First, delete all invoices for this client
        List<Invoice> invoices = invoiceRepository.findByClientId(id);
        invoiceRepository.deleteAll(invoices);
        
        // Then, unlink any User that references this Client
        Optional<User> userOpt = userRepository.findByClientId(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setClient(null);
            userRepository.save(user);
        }
        
        // Now delete the client
        clientRepository.deleteById(id);
    }
}
