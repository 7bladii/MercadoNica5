
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ArrowLeftIcon } from '../components/common/Icons';

export default function ChatPage({ activeChat, setActiveChat, currentUser, setUnreadChats }) {
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // --- MEJORA: Efecto para ajustar la altura del textarea ---
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [newMessage]);

    // --- MEJORA: Carga de conversaciones optimizada ---
    useEffect(() => {
        if (!currentUser?.uid) return;

        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", currentUser.uid),
            orderBy("updatedAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newUnreadState = {};
            const convos = snapshot.docs.map(docSnapshot => {
                const data = docSnapshot.data();
                const lastMessage = data.messages?.[data.messages.length - 1];

                // Lógica robusta para determinar si un mensaje está no leído
                const isUnread = lastMessage && 
                                 lastMessage.sender !== currentUser.uid && 
                                 (!data.lastRead?.[currentUser.uid] || data.lastRead[currentUser.uid].toMillis() < lastMessage.createdAt?.toMillis());
                
                newUnreadState[docSnapshot.id] = isUnread;

                const recipientId = data.participants.find(p => p !== currentUser.uid);
                const recipientInfo = data.participantInfo?.[recipientId] || { displayName: 'Usuario Desconocido', photoURL: '' };
                
                return { id: docSnapshot.id, ...data, recipientInfo, isUnread };
            });

            setConversations(convos);
            setUnreadChats(prevUnread => ({ ...prevUnread, ...newUnreadState }));
        }, (error) => {
            console.error("Error al obtener conversaciones: ", error);
        });

        return () => unsubscribe();
    }, [currentUser, setUnreadChats]); // Dependencias limpias

    // --- CORRECCIÓN + MEJORA: Abrir chat y marcar como leído ---
    const handleOpenChat = useCallback((convo) => {
        setActiveChat(convo);
        if (convo.isUnread) {
            const chatRef = doc(db, "chats", convo.id);
            updateDoc(chatRef, {
                [`lastRead.${currentUser.uid}`]: serverTimestamp() // CORREGIDO: Usa serverTimestamp
            }).catch(error => console.error("Error al marcar chat como leído:", error));
        }
    }, [currentUser, setActiveChat]);

    // --- MEJORA: Listener de mensajes con manejo de errores ---
    useEffect(() => {
        if (!activeChat?.id) {
            setMessages([]); // Limpia los mensajes si no hay chat activo
            return;
        }

        const chatRef = doc(db, "chats", activeChat.id);
        const unsubscribe = onSnapshot(chatRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                setMessages(docSnapshot.data().messages || []);
            }
        }, (error) => {
            console.error(`Error al escuchar mensajes del chat ${activeChat.id}:`, error);
        });

        return () => unsubscribe();
    }, [activeChat]);

    // --- MEJORA: Scroll automático al último mensaje ---
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // --- CORRECCIÓN + MEJORA: Enviar un nuevo mensaje ---
    const handleSendMessage = useCallback(async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !activeChat?.id || !currentUser?.uid) return;

        const chatRef = doc(db, "chats", activeChat.id);

        const messageData = {
            text: newMessage.trim(),
            sender: currentUser.uid,
            createdAt: Timestamp.now() // CORREGIDO: Usa Timestamp.now() para arrayUnion
        };

        try {
            await updateDoc(chatRef, {
                messages: arrayUnion(messageData),
                updatedAt: serverTimestamp(),
                [`lastRead.${currentUser.uid}`]: serverTimestamp() // CORREGIDO: Usa serverTimestamp para consistencia
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error al enviar el mensaje:", error);
        }
    }, [newMessage, activeChat, currentUser]);

    return (
        <div className="flex h-[75vh] bg-white rounded-lg shadow-lg">
            {/* Columna de la lista de conversaciones */}
            <div className={`w-full md:w-1/3 border-r ${activeChat && 'hidden md:block'}`}>
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold">Conversaciones</h2>
                </div>
                <ul className="overflow-y-auto h-[calc(75vh-65px)]">
                    {conversations.map(convo => (
                        <li key={convo.id} onClick={() => handleOpenChat(convo)} className={`p-4 cursor-pointer hover:bg-gray-100 flex items-center justify-between ${activeChat?.id === convo.id ? 'bg-blue-100' : ''}`}>
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <img src={convo.recipientInfo?.photoURL || `https://i.pravatar.cc/150?u=${convo.id}`} alt={convo.recipientInfo?.displayName} className="w-10 h-10 rounded-full flex-shrink-0" />
                                <div className="flex-grow overflow-hidden">
                                    <p className="font-semibold truncate">{convo.recipientInfo?.displayName}</p>
                                    <p className="text-sm text-gray-500 truncate">{convo.listingInfo?.title || 'Conversación general'}</p>
                                </div>
                            </div>
                            {convo.isUnread && <span className="h-3 w-3 bg-blue-500 rounded-full flex-shrink-0 ml-2"></span>}
                        </li>
                    ))}
                </ul>
            </div>
            
            {/* Columna del chat activo */}
            <div className={`w-full md:w-2/3 flex flex-col ${!activeChat && 'hidden md:flex'}`}>
                {activeChat ? (
                    <>
                        <div className="p-4 border-b flex items-center">
                            <button onClick={() => setActiveChat(null)} className="md:hidden mr-4 text-blue-600"><ArrowLeftIcon /></button>
                            <img src={activeChat.recipientInfo?.photoURL || `https://i.pravatar.cc/150?u=${activeChat.id}`} alt={activeChat.recipientInfo?.displayName} className="w-10 h-10 rounded-full mr-3" />
                            <h2 className="text-xl font-bold">{activeChat.recipientInfo?.displayName}</h2>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                            {messages.map(msg => (
                                // MEJORA: Usar una clave más estable que el índice
                                <div key={`${msg.sender}-${msg.createdAt?.toMillis()}`} className={`flex ${msg.sender === currentUser?.uid ? 'justify-end' : 'justify-start'} mb-4`}>
                                    <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender === currentUser?.uid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                        <span className="text-xs opacity-75 mt-1 block text-right">
                                            {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t bg-white">
                            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                <textarea ref={textareaRef} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe un mensaje..." className="flex-1 border-gray-300 rounded-lg p-2 resize-none" rows="1" />
                                <button type="submit" disabled={newMessage.trim() === ''} className="bg-blue-600 text-white px-4 py-2 rounded-lg self-end disabled:bg-blue-300 disabled:cursor-not-allowed">Enviar</button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-center p-4">
                        <p>Selecciona una conversación para empezar a chatear.</p>
                    </div>
                )}
            </div>
        </div>
    );
}