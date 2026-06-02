import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { conversationsAPI, messagesAPI } from '../api/api';

const formatTime = (dateString) =>
  new Date(dateString).toLocaleString('en-ZA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function ConversationPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const fetchConversation = async () => {
    try {
      setLoading(true);
      setError('');
      const [conversationResponse, messagesResponse] = await Promise.all([
        conversationsAPI.getById(conversationId),
        messagesAPI.getByConversation(conversationId),
      ]);
      setConversation(conversationResponse.data);
      setMessages(messagesResponse.data || []);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load this conversation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const groupedMessages = useMemo(() => messages, [messages]);

  const handleSend = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;

    try {
      setSending(true);
      const response = await messagesAPI.send({
        conversation_id: conversationId,
        message,
      });
      setMessages((prev) => [
        ...prev,
        {
          ...response.data,
          sender_name: user?.name,
          created_at: new Date().toISOString(),
        },
      ]);
      setDraft('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Message could not be sent');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error && !conversation) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-4xl rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto flex max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 p-4">
          <Link to="/inbox" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Back to inbox
          </Link>
          <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{conversation.other_user_name}</h1>
              <p className="text-sm text-gray-600">{conversation.listing_title}</p>
            </div>
            <p className="text-lg font-bold text-blue-600">R{Number(conversation.listing_price).toFixed(2)}</p>
          </div>
        </div>

        {error && <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex max-h-[62vh] min-h-[420px] flex-col gap-3 overflow-y-auto bg-gray-50 p-4">
          {groupedMessages.length === 0 ? (
            <div className="m-auto text-center text-gray-500">
              <p className="font-semibold">No messages yet</p>
              <p className="text-sm">Send a quick note to get the negotiation started.</p>
            </div>
          ) : (
            groupedMessages.map((message) => {
              const isMine = message.sender_id === user?.id;
              return (
                <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                      isMine ? 'rounded-br-sm bg-blue-600 text-white' : 'rounded-bl-sm bg-white text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-line text-sm leading-relaxed">{message.message}</p>
                    <p className={`mt-2 text-xs ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-3 border-t border-gray-200 p-4">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type your message..."
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
