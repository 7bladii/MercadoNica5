import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config'; // Asegúrate de que la ruta sea correcta
import { StarIcon } from '../common/Icons'; // Asegúrate de que la ruta sea correcta

// Componente para que el usuario seleccione las estrellas
const StarSelector = ({ rating, setRating }) => {
    return (
        <div className="flex justify-center space-x-2 my-4">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <button 
                        key={starValue} 
                        type="button" 
                        onClick={() => setRating(starValue)}
                        onMouseOver={() => setRating(starValue)}
                    >
                        <StarIcon className={`w-8 h-8 transition-colors ${starValue <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`} />
                    </button>
                );
            })}
        </div>
    );
};

export default function LeaveReviewModal({ seller, buyer, onCancel, onReviewSubmitted }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError("Por favor, selecciona una calificación de estrellas.");
            return;
        }
        if (!comment.trim()) {
            setError("Por favor, escribe un comentario.");
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // La reseña se guarda usando el ID del comprador como ID del documento para evitar duplicados
            const reviewRef = doc(db, `users/${seller.id}/reviews`, buyer.uid);

            await setDoc(reviewRef, {
                rating: rating,
                comment: comment,
                reviewerId: buyer.uid,
                reviewerName: buyer.displayName,
                reviewerPhotoURL: buyer.photoURL,
                createdAt: serverTimestamp(),
            });

            alert("¡Gracias por tu reseña!");
            onReviewSubmitted(); // Llama a la función para cerrar el modal y refrescar

        } catch (err) {
            console.error("Error al enviar la reseña:", err);
            setError("No se pudo enviar la reseña. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full text-gray-800">
                <h3 className="text-xl font-bold mb-2">Deja una reseña para {seller.displayName}</h3>
                <form onSubmit={handleSubmit}>
                    <StarSelector rating={rating} setRating={setRating} />
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Describe tu experiencia con el vendedor..."
                        className="w-full border-gray-300 rounded-md shadow-sm mt-4 p-2 h-28"
                        maxLength="500"
                    />
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <div className="flex justify-end items-center mt-6 space-x-3">
                        <button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 font-semibold">
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold disabled:bg-blue-300"
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
