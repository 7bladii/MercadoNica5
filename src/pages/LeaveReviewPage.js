import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// ✅ MEJORA: Se importa 'runTransaction' para actualizaciones atómicas
import { doc, collection, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../components/context/AuthContext';
import { SpinnerIcon, StarIcon } from '../components/common/Icons';

// --- Componente para las Estrellas (Sin cambios) ---
const StarRating = ({ rating, setRating }) => {
    return (
        <div className="flex space-x-1">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <button
                        type="button"
                        key={starValue}
                        onClick={() => setRating(starValue)}
                        onMouseOver={() => setRating(starValue)} // Permite ver la calificación antes de hacer clic
                        className="focus:outline-none"
                    >
                        <StarIcon filled={starValue <= rating} className="w-8 h-8 text-yellow-400 cursor-pointer" />
                    </button>
                );
            })}
        </div>
    );
};


// --- Componente Principal de la Página (Lógica de envío mejorada) ---
export default function LeaveReviewPage() {
    const { userId: reviewedUserId } = useParams(); // ID del usuario que está siendo calificado
    const { user: currentUser } = useAuth(); // El usuario que escribe la reseña
    const navigate = useNavigate();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Por favor, selecciona una calificación de estrellas.');
            return;
        }
        if (reviewedUserId === currentUser.uid) {
            setError('No puedes dejarte una reseña a ti mismo.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // ✅ MEJORA: Se utiliza una transacción para asegurar la consistencia de los datos.
            await runTransaction(db, async (transaction) => {
                const reviewedUserRef = doc(db, 'users', reviewedUserId);
                const reviewRef = doc(collection(db, 'users', reviewedUserId, 'reviews'));

                // 1. Obtener el perfil del usuario calificado DENTRO de la transacción
                const reviewedUserSnap = await transaction.get(reviewedUserRef);
                if (!reviewedUserSnap.exists()) {
                    throw new Error("El usuario que intentas calificar no existe.");
                }

                const userData = reviewedUserSnap.data();
                
                // 2. Calcular la nueva calificación promedio
                const currentRatingTotal = (userData.ratingAverage || 0) * (userData.ratingCount || 0);
                const newRatingCount = (userData.ratingCount || 0) + 1;
                const newRatingAverage = (currentRatingTotal + rating) / newRatingCount;

                // 3. Crear el objeto de la nueva reseña
                const reviewData = {
                    rating,
                    comment: comment.trim(),
                    authorId: currentUser.uid,
                    authorName: currentUser.displayName,
                    authorPhotoURL: currentUser.photoURL,
                    reviewedUserId: reviewedUserId,
                    createdAt: serverTimestamp(),
                };

                // 4. Ejecutar las escrituras DENTRO de la transacción
                transaction.set(reviewRef, reviewData);
                transaction.update(reviewedUserRef, {
                    ratingCount: newRatingCount,
                    // Se redondea a un decimal para mantenerlo limpio
                    ratingAverage: Math.round(newRatingAverage * 10) / 10 
                });
            });
            
            // 5. Si la transacción es exitosa, redirigir
            navigate(`/profile/${reviewedUserId}`);

        } catch (err) {
            console.error("Error al enviar la reseña:", err);
            setError("Ocurrió un error al guardar tu reseña. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto max-w-xl">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-2 text-center">Dejar una Reseña</h1>
                <p className="text-gray-600 text-center mb-6">Comparte tu experiencia para ayudar a otros en la comunidad.</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tu Calificación</label>
                        <StarRating rating={rating} setRating={setRating} />
                    </div>

                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Tu Comentario (Opcional)</label>
                        <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Describe tu experiencia..."
                            className="mt-1 block w-full border rounded-md p-2 shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            rows="4"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">{error}</p>}

                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center transition-colors">
                        {isSubmitting ? <><SpinnerIcon /> Enviando Reseña...</> : 'Enviar Reseña'}
                    </button>
                </form>
            </div>
        </div>
    );
}

