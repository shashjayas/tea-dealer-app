package com.teadealer.service;

import com.teadealer.model.User;
import com.teadealer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public User authenticate(String username, String password) {
        System.out.println("=== AUTH DEBUG START ===");
        System.out.println("Username received: " + username);
        System.out.println("Password received: " + password);
        
        User user = userRepository.findByUsername(username).orElse(null);
        
        if (user == null) {
            System.out.println("ERROR: User not found in database!");
            return null;
        }
        
        System.out.println("User found in database:");
        System.out.println("- ID: " + user.getId());
        System.out.println("- Username: " + user.getUsername());
        System.out.println("- Email: " + user.getEmail());
        System.out.println("- Password hash from DB: " + user.getPassword());
        
        boolean matches = passwordEncoder.matches(password, user.getPassword());
        System.out.println("Password match result: " + matches);
        System.out.println("=== AUTH DEBUG END ===");
        
        if (matches) {
            return user;
        }
        
        return null;
    }
    
    public User createUser(String username, String password, String email) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        user.setRole("DEALER");
        return userRepository.save(user);
    }
}