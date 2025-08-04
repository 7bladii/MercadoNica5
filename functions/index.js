// Importa los módulos necesarios de Firebase Functions y Admin SDK
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentWritten, onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const stripe = require("stripe");

// Inicializa el SDK de Admin UNA SOLA VEZ
admin.initializeApp();

// Define el secreto de Stripe para usarlo de forma segura
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

// Establece opciones globales para todas las funciones (región y secretos)
setGlobalOptions({ region: "us-central1", secrets: [stripeSecretKey] });


//============================================
// FUNCIÓN HTTP: Crear Sesión de Pago con Stripe
//============================================
exports.createCheckoutSession = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión para realizar una compra.");
  }

  const stripeClient = new stripe(stripeSecretKey.value(), { apiVersion: "2024-06-20" });
  const { priceId } = request.data;
  const { uid, email, name } = request.auth.token;

  try {
    const customerDocRef = admin.firestore().collection("customers").doc(uid);
    const customerDoc = await customerDocRef.get();
    let stripeCustomerId;

    if (customerDoc.exists && customerDoc.data().stripeId) {
      stripeCustomerId = customerDoc.data().stripeId;
    } else {
      const customer = await stripeClient.customers.create({
        email: email,
        name: name,
        metadata: { firebaseUID: uid },
      });
      stripeCustomerId = customer.id;
      await customerDocRef.set({ stripeId: stripeCustomerId, email: email }, { merge: true });
    }
    
    // ¡IMPORTANTE: Cambia estas URLs por las de tu sitio en producción!
    const successUrl = 'https://tu-sitio-web.com/pago-exitoso'; 
    const cancelUrl = 'https://tu-sitio-web.com/pago-cancelado';

    const session = await stripeClient.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return { url: session.url };

  } catch (error) {
    console.error("Fallo en la creación de la sesión de Stripe:", error);
    throw new HttpsError("internal", "No se pudo crear la sesión de pago.");
  }
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

  if (!snapBefore.exists && snapAfter.exists) {
    console.log(`Usuario ${followerId} empezó a seguir a ${userId}.`);
    await userRef.update({ followersCount: increment });
    await followerRef.update({ followingCount: increment });
  } 
  else if (snapBefore.exists && !snapAfter.exists) {
    console.log(`Usuario ${followerId} dejó de seguir a ${userId}.`);
    await userRef.update({ followersCount: decrement });
    await followerRef.update({ followingCount: decrement });
  }

  return null; 
});


//============================================
// FUNCIÓN DE TRIGGER: Actualizar Contadores de Venta/Compra
//============================================
exports.onListingSold = onDocumentWritten("listings/{listingId}", async (event) => {
    const newData = event.data?.after.data();
    const oldData = event.data?.before.data();

    // Si el estado no cambió a 'sold', no hacemos nada.
    if (newData.status !== "sold" || oldData.status === "sold") {
        return null;
    }

    const sellerId = newData.userId;
    const buyerId = newData.buyerId;

    if (!sellerId || !buyerId) {
        console.log(`Faltan sellerId o buyerId en el anuncio ${event.params.listingId}. Solo se actualizará el vendedor.`);
        // Si no hay comprador, al menos actualizamos al vendedor
        if (sellerId) {
            const sellerRef = admin.firestore().collection("users").doc(sellerId);
            await sellerRef.update({ soldCount: admin.firestore.FieldValue.increment(1) });
        }
        return null;
    }

    const db = admin.firestore();
    const sellerRef = db.collection("users").doc(sellerId);
    const buyerRef = db.collection("users").doc(buyerId);
    const increment = admin.firestore.FieldValue.increment(1);

    await sellerRef.update({ soldCount: increment });
    await buyerRef.update({ boughtCount: increment });

    console.log(`Contadores actualizados para vendedor ${sellerId} y comprador ${buyerId}`);
    return null;
});


//============================================
// FUNCIÓN DE TRIGGER: Recalcular Calificación Promedio
//============================================
exports.onNewReview = onDocumentCreated("users/{userId}/reviews/{reviewId}", async (event) => {
    const db = admin.firestore();
    const userId = event.params.userId; // El ID del vendedor que fue calificado
    const userRef = db.collection("users").doc(userId);
    const newReviewRating = event.data.data().rating;

    // Usamos una transacción para leer y escribir de forma segura
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
            ratingAverage: newRatingAverage,
        });
    });
});
