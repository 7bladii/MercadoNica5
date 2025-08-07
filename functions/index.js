// Importa los módulos necesarios de Firebase Functions y Admin SDK
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentWritten, onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret, defineString } = require("firebase-functions/params"); // Se añade defineString
const admin = require("firebase-admin");
const crypto = require("crypto");

// Inicializa el SDK de Admin
admin.initializeApp();

// --- Define los secretos y parámetros de configuración ---
const tilopayApiKey = defineSecret("TILOPAY_API_KEY");
const tilopayWebhookSecret = defineSecret("TILOPAY_WEBHOOK_SECRET");
// MEJORA: Define la URL de redirección como un parámetro configurable
// Para establecerlo, usa el comando: firebase functions:config:set redirect_url="https://tu-sitio.com/pago-completo"
const redirectUrlParam = defineString("REDIRECT_URL");

// Establece opciones globales para todas las funciones
setGlobalOptions({ 
    region: "us-central1", 
    secrets: [tilopayApiKey, tilopayWebhookSecret],
    params: [redirectUrlParam]
});


//============================================
// FUNCIÓN HTTP: Crear Cargo de Pago con Tilopay
//============================================
exports.createTilopayCharge = onCall({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debes iniciar sesión para comprar.");
    }

    // Recibe el userId del cliente para validación
    const { amount, currency, userId } = request.data;
    const { uid, email } = request.auth.token;

    // --- CORRECCIÓN DE SEGURIDAD: Valida que el usuario solo compra para sí mismo ---
    if (userId !== uid) {
        throw new HttpsError("permission-denied", "No puedes realizar esta acción para otro usuario.");
    }

    if (!amount || typeof amount !== 'number' || amount <= 0 || !currency || typeof currency !== 'string') {
        throw new HttpsError("invalid-argument", "Los datos del pago son inválidos.");
    }

    const payload = {
        amount: amount,
        currency: currency,
        email: email,
        orderNumber: `PREMIUM-${uid}-${Date.now()}`,
        redirectUrl: redirectUrlParam.value(), // Usa el parámetro de configuración
    };

    try {
        const response = await fetch("https://app.tilopay.com/api/v1/charges/card/direct", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${tilopayApiKey.value()}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Error de Tilopay:", errorBody.message);
            throw new HttpsError("internal", "No se pudo contactar con la pasarela de pago.");
        }

        const charge = await response.json();
        return { url: charge.url };

    } catch (error) {
        console.error("Fallo en la creación del cargo de Tilopay:", error);
        throw new HttpsError("internal", "No se pudo crear la sesión de pago.");
    }
});


//============================================
// FUNCIÓN WEBHOOK: Recibir confirmación de pago de Tilopay
//============================================
exports.tilopayWebhook = onRequest({
    // --- CORRECCIÓN DE SEGURIDAD: Habilita el acceso al cuerpo crudo (rawBody) ---
    rawBody: true,
}, async (request, response) => {
    
    // --- CORRECCIÓN CRÍTICA: Usa el `rawBody` para una verificación de firma segura ---
    const signature = request.headers["x-tilopay-signature"]; // Confirma este header en la doc de Tilopay
    const expectedSignature = crypto
        .createHmac("sha256", tilopayWebhookSecret.value())
        .update(request.rawBody) // ¡Se usa el cuerpo crudo, no un string modificado!
        .digest("hex");

    if (signature !== expectedSignature) {
        console.error("Firma de webhook inválida.");
        response.status(401).send("Unauthorized");
        return;
    }

    if (request.method !== "POST") {
        response.status(405).send("Method Not Allowed");
        return;
    }
    
    // Como el cuerpo no se analiza automáticamente con `rawBody: true`, lo analizamos ahora.
    const event = JSON.parse(request.rawBody.toString());
    console.log("Webhook de Tilopay verificado y recibido:", event);

    if (event.status === "authorized" || event.status === "captured") {
        const orderId = event.orderNumber;
        const firebaseUID = orderId.split('-')[1];

        if (firebaseUID) {
            const userRef = admin.firestore().collection("users").doc(firebaseUID);
            await admin.firestore().runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                // La transacción asegura que esto sea idempotente (solo se ejecuta una vez con éxito).
                if (userDoc.exists && !userDoc.data().isPremium) {
                    transaction.update(userRef, {
                        isPremium: true,
                        premiumSince: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    console.log(`Usuario ${firebaseUID} actualizado a Premium.`);
                }
            });
        }
    } else {
        console.log(`Evento de pago recibido con estado: ${event.status}. No se requiere acción.`);
    }

    response.status(200).send("OK");
});


//============================================
// FUNCIÓN DE TRIGGER: Actualizar Contadores de Seguidores
//============================================
exports.updateFollowCounts = onDocumentWritten("users/{userId}/followers/{followerId}", async (event) => {
    const userId = event.params.userId;
    const followerId = event.params.followerId;

    const userRef = admin.firestore().collection("users").doc(userId);
    const followerRef = admin.firestore().collection("users").doc(followerId);
  
    const increment = admin.firestore.FieldValue.increment(1);
    const decrement = admin.firestore.FieldValue.increment(-1);

    const snapBefore = event.data?.before;
    const snapAfter = event.data?.after;

    // --- MEJORA: Usa Promise.all para ejecutar escrituras en paralelo ---
    if (!snapBefore.exists && snapAfter.exists) {
        console.log(`Usuario ${followerId} empezó a seguir a ${userId}.`);
        await Promise.all([
            userRef.update({ followersCount: increment }),
            followerRef.update({ followingCount: increment })
        ]);
    } 
    else if (snapBefore.exists && !snapAfter.exists) {
        console.log(`Usuario ${followerId} dejó de seguir a ${userId}.`);
        await Promise.all([
            userRef.update({ followersCount: decrement }),
            followerRef.update({ followingCount: decrement })
        ]);
    }

    return null; 
});


//============================================
// FUNCIÓN DE TRIGGER: Actualizar Contadores de Venta/Compra
//============================================
exports.onListingSold = onDocumentWritten("listings/{listingId}", async (event) => {
    const newData = event.data?.after.data();
    const oldData = event.data?.before.data();

    // Este chequeo previene que la función se ejecute si no hay cambio a 'sold'.
    if (newData.status !== "sold" || oldData.status === "sold") {
        return null;
    }

    const sellerId = newData.userId;
    const buyerId = newData.buyerId;

    if (!sellerId || !buyerId) {
        console.log(`Faltan sellerId o buyerId en el anuncio ${event.params.listingId}.`);
        return null;
    }

    const db = admin.firestore();
    const sellerRef = db.collection("users").doc(sellerId);
    const buyerRef = db.collection("users").doc(buyerId);
    const increment = admin.firestore.FieldValue.increment(1);

    // --- MEJORA: Usa Promise.all para ejecutar escrituras en paralelo ---
    await Promise.all([
        sellerRef.update({ soldCount: increment }),
        buyerRef.update({ boughtCount: increment })
    ]);

    console.log(`Contadores actualizados para vendedor ${sellerId} y comprador ${buyerId}`);
    return null;
});


//============================================
// FUNCIÓN DE TRIGGER: Recalcular Calificación Promedio
//============================================
exports.onNewReview = onDocumentCreated("users/{userId}/reviews/{reviewId}", async (event) => {
    const db = admin.firestore();
    const userId = event.params.userId;
    const userRef = db.collection("users").doc(userId);
    const newReviewRating = event.data.data().rating;

    // Usar una transacción es la mejor práctica para leer y luego escribir.
    return db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            return;
        }

        const oldRatingCount = userDoc.data().ratingCount || 0;
        const oldRatingAverage = userDoc.data().ratingAverage || 0;
        
        const newRatingCount = oldRatingCount + 1;
        const newRatingAverage = ((oldRatingAverage * oldRatingCount) + newReviewRating) / newRatingCount;

        transaction.update(userRef, {
            ratingCount: newRatingCount,
            // Redondea a 2 decimales para evitar números largos
            ratingAverage: parseFloat(newRatingAverage.toFixed(2)),
        });
    });
});
