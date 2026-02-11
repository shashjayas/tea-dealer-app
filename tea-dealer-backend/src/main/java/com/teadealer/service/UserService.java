package com.teadealer.service;

import com.teadealer.model.User;
import com.teadealer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User createUser(String username, String password, String email, String role) {
        // Check if username already exists
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        user.setRole(role != null ? role : "DEALER");
        return userRepository.save(user);
    }

    public User updateUser(Long id, String username, String email, String role, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if new username conflicts with another user
        Optional<User> existingUser = userRepository.findByUsername(username);
        if (existingUser.isPresent() && !existingUser.get().getId().equals(id)) {
            throw new RuntimeException("Username already exists");
        }

        user.setUsername(username);
        user.setEmail(email);
        user.setRole(role);

        // Only update password if provided
        if (newPassword != null && !newPassword.isEmpty()) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        return userRepository.save(user);
    }

    public void deleteUser(Long id, Long currentUserId) {
        // Prevent self-deletion
        if (id.equals(currentUserId)) {
            throw new RuntimeException("Cannot delete your own account");
        }

        // Check if user exists and is a super admin
        User userToDelete = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Prevent deletion of last super admin
        if ("SUPER_ADMIN".equals(userToDelete.getRole())) {
            long superAdminCount = userRepository.countByRole("SUPER_ADMIN");
            if (superAdminCount <= 1) {
                throw new RuntimeException("Cannot delete the last Super Admin");
            }
        }

        userRepository.deleteById(id);
    }

    public long countSuperAdmins() {
        return userRepository.countByRole("SUPER_ADMIN");
    }

    public boolean isSuperAdmin(User user) {
        return "SUPER_ADMIN".equals(user.getRole());
    }
}
