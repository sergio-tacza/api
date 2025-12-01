package com.tacbarber.util;

import org.mindrot.jbcrypt.BCrypt;

public class PasswordUtil {

    /**
     * Cifra una contraseña en texto plano
     * @param plainPassword - contraseña sin cifrar (ej: "123456")
     * @return contraseña cifrada (ej: "$2a$10$N9qo8uLO...")
     */
    public static String cifrarPassword(String plainPassword) {
        return BCrypt.hashpw(plainPassword, BCrypt.gensalt());
    }

    /**
     * Verifica si una contraseña coincide con su versión cifrada
     * @param plainPassword - contraseña introducida por el usuario
     * @param hashedPassword - contraseña cifrada guardada en BD
     * @return true si coinciden, false si no
     */
    public static boolean verificarPassword(String plainPassword, String hashedPassword) {
        return BCrypt.checkpw(plainPassword, hashedPassword);
    }
}
