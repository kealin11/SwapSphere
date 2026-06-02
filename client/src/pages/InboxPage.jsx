import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildImageUrl, conversationsAPI } from '../api/api';
import EmptyState from '../components/EmptyState';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Cg fill="%239ca3af"%3E%3Ccircle cx="200" cy="80" r="40"/%3E%3Cpath d="M80 150l70-80 70 80 100-120v220H80z"/%3E%3C/g%3E%3C/svg%3E';

const getImageUrl = (imageUrl) => {
  return buildImageUrl(imageUrl, PLACEHOLDER_IMAGE);
};

const formatTime = (dateString) => {
  if (!dateString) return 'No messages yet';
  return new Date(dateString).toLocaleString('en-ZA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function InboxPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await conversationsAPI.getAll();
      setConversations(response.data || []);
    } catch (err) {
      console.error('Error loading inbox:', err);
      setError('Failed to load your messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConversations();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="mt-1 text-gray-600">Negotiate with buyers and sellers in one place.</p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
            {conversations.length} conversation{conversations.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading && (
          <div className="space-y-3 rounded-lg bg-white p-4 shadow">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-semibold">{error}</p>
            <button onClick={fetchConversations} className="mt-2 text-sm font-semibold underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <EmptyState
            title="No messages yet"
            description="Start a conversation from any listing to ask questions or negotiate."
            actionText="Browse Listings"
            actionLink="/listings"
          />
        )}

        {!loading && !error && conversations.length > 0 && (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                to={`/inbox/${conversation.id}`}
                className="flex gap-4 border-b border-gray-100 p-4 transition hover:bg-blue-50 last:border-b-0"
              >
                <img
                  src={getImageUrl(conversation.image_url)}
                  alt={conversation.listing_title}
                  className="h-20 w-20 flex-none rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{conversation.other_user_name}</p>
                      <p className="truncate text-sm text-gray-600">{conversation.listing_title}</p>
                    </div>
                    <p className="flex-none text-xs text-gray-500">{formatTime(conversation.last_message_at || conversation.created_at)}</p>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                    {conversation.last_message || 'Open the conversation to send the first message.'}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span className="rounded-full bg-gray-100 px-2 py-1">{conversation.message_count} messages</span>
                    <span>R{Number(conversation.listing_price).toFixed(2)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
