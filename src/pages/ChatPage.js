import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { 
    collection, query, where, orderBy, onSnapshot,
    doc, updateDoc, serverTimestamp, writeBatch, limit, startAfter, getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../components/context/AuthContext';
import { ArrowLeftIcon, SpinnerIcon } from '../components/common/Icons';

const MESSAGES_PER_PAGE = 25;

// --- Elemento individual de la lista de conversaciones (Sin cambios) ---
const ConversationListItem = ({ convo, isActive, onOpenChat }) => (
    <li onClick={() => onOpenChat(convo)} className={`p-4 cursor-pointer hover:bg-gray-100 flex items-center justify-between ${isActive ? 'bg-blue-100' : ''}`}>
        <div className="flex items-center space-x-3 overflow-hidden">
            <img src={convo.recipientInfo?.photoURL || `https://i.pravatar.cc/150?u=${convo.id}`} alt={convo.recipientInfo?.displayName} className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold truncate">{convo.recipientInfo?.displayName}</p>
                <p className="text-sm text-gray-500 truncate">{convo.lastMessage?.text || convo.listingInfo?.title || 'Conversación iniciada'}</p>
            </div>
        </div>
        {convo.isUnread && <span className="h-3 w-3 bg-blue-500 rounded-full flex-shrink-0 ml-2"></span>}
    </li>
);

// --- Burbuja de mensaje individual (Sin cambios) ---
const MessageBubble = ({ msg, isSender }) => (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${isSender ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
            <span className="text-xs opacity-75 mt-1 block text-right">
                {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {isSender && msg.status === 'sending' && <span className="ml-1">Enviando...</span>}
                {isSender && msg.status === 'failed' && <span className="ml-1 text-red-300">Falló</span>}
            </span>
        </div>
    </div>
);

// --- Vista de Mensajes con Paginación (CORREGIDA) ---
const MessageView = ({ activeChat, currentUser, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastMessageDoc, setLastMessageDoc] = useState(null);
    
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    
    // ✅ FIX: La función ya no depende de `lastMessageDoc`, lo recibe como parámetro.
    const loadMessages = useCallback(async (loadMore = false, cursor = null) => {
        if (!activeChat?.id) return;
        
        if (loadMore) setLoadingMore(true);
        else setLoadingInitial(true);

        let q = query(
            collection(db, 'chats', activeChat.id, 'messages'),
            orderBy('createdAt', 'desc'),
            limit(MESSAGES_PER_PAGE)
        );

        if (loadMore && cursor) {
            q = query(q, startAfter(cursor));
        }

        const snapshot = await getDocs(q);
        const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();

        setHasMore(snapshot.docs.length === MESSAGES_PER_PAGE);
        setLastMessageDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        
        if (loadMore) {
            setMessages(prev => [...newMessages, ...prev]);
        } else {
            setMessages(newMessages);
        }
        
        setLoadingInitial(false);
        setLoadingMore(false);
    // ✅ FIX: La dependencia es ahora estable, basándose solo en el ID del chat.
    }, [activeChat?.id]);
    
    useEffect(() => {
        setMessages([]);
        setLastMessageDoc(null);
        setHasMore(true);
        loadMessages(false, null);
    // ✅ FIX: El useEffect ahora también tiene una dependencia estable.
    }, [activeChat?.id]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser?.uid) return;
        
        const trimmedMessage = newMessage.trim();
        const tempId = `temp_${Date.now()}`;
        // ❗️ IMPORTANTE: Asegúrate que tus reglas de Firestore esperan 'sender', no 'senderId'.
        const messageData = { text: trimmedMessage, sender: currentUser.uid, createdAt: serverTimestamp(), status: 'sending' };
        
        setMessages(prev => [...prev, { id: tempId, ...messageData, createdAt: { toDate: () => new Date() }}]);
        setNewMessage('');

        const chatRef = doc(db, "chats", activeChat.id);
        const newMessageRef = doc(collection(db, "chats", activeChat.id, "messages"));
        const batch = writeBatch(db);

        batch.set(newMessageRef, { text: trimmedMessage, sender: currentUser.uid, createdAt: serverTimestamp() });
        batch.update(chatRef, { updatedAt: serverTimestamp(), lastMessage: { text: trimmedMessage, sender: currentUser.uid, createdAt: serverTimestamp() } });
        
        try {
            await batch.commit();
        } catch (error) {
            console.error("Error al enviar el mensaje:", error);
            setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, status: 'failed' } : msg));
        }
    };

    // ✅ FIX: Se usa useLayoutEffect para un scroll más fluido y sin parpadeos.
    useLayoutEffect(() => {
        if (!loadingInitial) {
             messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, loadingInitial]);


    return (
        <div className="w-full md:w-2/3 flex flex-col">
            <div className="p-4 border-b flex items-center">
                <button onClick={onBack} className="md:hidden mr-4 text-blue-600"><ArrowLeftIcon /></button>
                <img src={activeChat.recipientInfo?.photoURL || `https://i.pravatar.cc/150?u=${activeChat.id}`} alt={activeChat.recipientInfo?.displayName} className="w-10 h-10 rounded-full mr-3" />
                <h2 className="text-xl font-bold">{activeChat.recipientInfo?.displayName}</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {loadingInitial && <div className="text-center"><SpinnerIcon /></div>}
                {messages.map(msg => (
                    <MessageBubble key={msg.id} msg={msg} isSender={msg.sender === currentUser?.uid} />
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <textarea ref={textareaRef} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe un mensaje..." className="flex-1 border-gray-300 rounded-lg p-2 resize-none" rows="1" />
                    <button type="submit" disabled={newMessage.trim() === ''} className="bg-blue-600 text-white px-4 py-2 rounded-lg self-end disabled:bg-blue-300">Enviar</button>
                </form>
            </div>
        </div>
    );
};

// --- Componente Principal (Gestor de Layout - CORREGIDO) ---
export default function ChatPage() {
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();
    const initialChatSetRef = useRef(false); // Ref para controlar la selección inicial

    useEffect(() => {
        if (!currentUser?.uid) {
            setLoading(false);
            return;
        }
        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", currentUser.uid),
            orderBy("updatedAt", "desc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convos = snapshot.docs.map(docSnapshot => {
                const data = docSnapshot.data();
                const recipientId = data.participants.find(p => p !== currentUser.uid);
                // Aquí tu lógica completa para isUnread
                const isUnread = false; 
                return { id: docSnapshot.id, ...data, recipientInfo: data.participantInfo?.[recipientId], isUnread };
            });
            setConversations(convos);
            setLoading(false);
            
            // ✅ FIX: Solo selecciona el primer chat una vez para evitar el bucle.
            if (!initialChatSetRef.current && !activeChat && convos.length > 0) {
                 initialChatSetRef.current = true;
                 setActiveChat(convos[0]);
            }
        });
        return () => unsubscribe();
    // ✅ FIX: Se elimina `activeChat` de las dependencias para romper el bucle de recarga.
    }, [currentUser?.uid]);

    const handleOpenChat = useCallback((convo) => {
        setActiveChat(convo);
        // Aquí tu lógica para marcar como leído
    }, []);

    return (
        <div className="flex h-[75vh] bg-white rounded-lg shadow-lg">
            <div className={`w-full md:w-1/3 border-r ${activeChat && 'hidden md:block'}`}>
                <div className="p-4 border-b"><h2 className="text-xl font-bold">Conversaciones</h2></div>
                <ul className="overflow-y-auto h-[calc(75vh-65px)]">
                    {loading ? <div className="p-4 text-center"><SpinnerIcon /></div> : conversations.map(convo => (
                        <ConversationListItem key={convo.id} convo={convo} isActive={activeChat?.id === convo.id} onOpenChat={handleOpenChat} />
                    ))}
                </ul>
            </div>
            <div className={`w-full md:w-2/3 flex flex-col ${!activeChat && 'hidden md:flex'}`}>
                {activeChat ? (
                    <MessageView activeChat={activeChat} currentUser={currentUser} onBack={() => setActiveChat(null)} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-center p-4">
                        <p>Selecciona una conversación para empezar a chatear.</p>
                    </div>
                )}
            </div>
        </div>
    );
}