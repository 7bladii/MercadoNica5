import React from 'react';

const HelpCenterPage = () => {
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6 text-center">Centro de Ayuda</h1>

            <div className="space-y-4">
                <details className="p-4 border rounded-lg">
                    <summary className="font-semibold cursor-pointer">¿Cómo publico un anuncio?</summary>
                    <p className="mt-2 text-gray-700">
                        Para publicar un anuncio, inicia sesión en tu cuenta, haz clic en el botón "Publicar" y sigue los pasos del formulario. Asegúrate de proporcionar información clara y fotos de buena calidad.
                    </p>
                </details>

                <details className="p-4 border rounded-lg">
                    <summary className="font-semibold cursor-pointer">¿Cómo contacto a un vendedor?</summary>
                    <p className="mt-2 text-gray-700">
                        En la página del anuncio, encontrarás un botón para "Enviar Mensaje" al vendedor. Esto abrirá un chat privado donde podrás hacer tus preguntas.
                    </p>
                </details>

                {/* ... Agrega más preguntas frecuentes aquí ... */}

            </div>
        </div>
    );
};

export default HelpCenterPage;