import React from 'react';

const TermsPage = () => {
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6">Términos y Políticas de Servicio</h1>
            
            <section className="mb-6">
                <h2 className="text-2xl font-semibold mb-3">1. Aceptación de los Términos</h2>
                <p className="text-gray-700">
                    Al acceder y utilizar MercadoNica, aceptas estar sujeto a estos términos y condiciones. Si no estás de acuerdo, no debes utilizar nuestra plataforma.
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-2xl font-semibold mb-3">2. Publicación de Contenido</h2>
                <p className="text-gray-700">
                    Eres el único responsable del contenido que publicas. No se permite contenido ilegal, ofensivo o que infrinja los derechos de terceros. Nos reservamos el derecho de eliminar cualquier contenido que viole nuestras políticas sin previo aviso.
                </p>
            </section>
            
            {/* ... Agrega aquí todas las demás secciones de tus términos y políticas ... */}

        </div>
    );
};

export default TermsPage;