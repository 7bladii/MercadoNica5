import React, { useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from '../../firebase/config'; // Asegúrate que la ruta sea correcta

const PhoneSignIn = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [error, setError] = useState('');

    // Paso 1: Configurar el reCAPTCHA
    const setupRecaptcha = () => {
        // Para prevenir que se renderice múltiples veces
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                    // reCAPTCHA resuelto, puedes enviar el SMS ahora.
                    console.log("reCAPTCHA verificado");
                }
            });
        }
    };

    // Paso 2: Enviar el código de verificación al número de teléfono
    const handleSendCode = async (e) => {
        e.preventDefault();
        setError('');
        if (!phoneNumber) {
            setError("Por favor, ingresa un número de teléfono.");
            return;
        }

        setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;

        try {
            const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(result);
            setError('');
            alert("¡Código de verificación enviado a tu teléfono!");
        } catch (error) {
            console.error("Error al enviar el código:", error);
            setError("No se pudo enviar el código. Asegúrate de que el formato del número sea correcto (ej: +50512345678) y que el reCAPTCHA sea visible.");
        }
    };

    // Paso 3: Verificar el código y iniciar sesión
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError('');
        if (!verificationCode) {
            setError("Por favor, ingresa el código de verificación.");
            return;
        }

        try {
            await confirmationResult.confirm(verificationCode);
            // El usuario ha iniciado sesión exitosamente.
            // La lógica de redirección se manejará en tu AuthContext/App.js
            // gracias al listener onAuthStateChanged.
            alert("¡Inicio de sesión exitoso!");
        } catch (error) {
            console.error("Error al verificar el código:", error);
            setError("El código es incorrecto o ha expirado. Inténtalo de nuevo.");
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-center">Iniciar Sesión con Teléfono</h2>
            
            {/* Si aún no hemos enviado el código, mostramos el formulario para el número */}
            {!confirmationResult ? (
                <form onSubmit={handleSendCode}>
                    <div className="mb-4">
                        <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">
                            Número de Teléfono
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+505 1234 5678"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                    >
                        Enviar Código
                    </button>
                </form>
            ) : (
                // Si ya enviamos el código, mostramos el formulario para el código de verificación
                <form onSubmit={handleVerifyCode}>
                    <div className="mb-4">
                        <label htmlFor="code" className="block text-gray-700 text-sm font-bold mb-2">
                            Código de Verificación
                        </label>
                        <input
                            type="text"
                            id="code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="123456"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                    >
                        Verificar e Iniciar Sesión
                    </button>
                </form>
            )}

            {error && <p className="text-red-500 text-xs italic mt-4">{error}</p>}
            
            {/* Este div es donde Firebase renderizará el reCAPTCHA */}
            <div id="recaptcha-container" className="mt-4"></div>
        </div>
    );
};

export default PhoneSignIn;