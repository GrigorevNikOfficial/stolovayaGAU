import { useUnit } from 'effector-react';
import React, { useEffect, useMemo, useState } from 'react';
import Button from '../../../components/layout/Button/Button.tsx';
import Footer from '../../../components/layout/Footer/Footer.tsx';
import Input from '../../../components/layout/Input/Input.tsx';
import TopUpRequestModal from '../../../components/Modal/TopUpRequestModal.tsx';
import {
  $activeChatId,
  $chats,
  $friendRequests,
  $friendSearchResults,
  $friends,
  $messagesByChat,
  joinChatByCode,
  leaveChat,
  loadChats,
  loadFriendRequests,
  loadFriends,
  postMessage,
  removeFriend,
  requestDirectChat,
  requestGroupChat,
  requestMessages,
  respondToRequest,
  searchFriends,
  selectChat,
  sendFriendRequest,
} from '../../../models/chat';
import { $currentUser, logout } from '../../../models/users';
import NotificationBell from '../../../components/Notifications/NotificationBell.tsx';
import LogoSAU from '../../../images/logo.jpg';
import { formatBalance } from '../../../utils/formatBalance';
import type { ChatMessage, ChatSummary } from '../../../types/chat';
import type { FriendSearchResult, Friendship } from '../../../types/friend';
import type { UserPreview } from '../../../types/user';

const formatTime = (dateString?: string) => {
  if (!dateString) {
    return '';
  }
  const date = new Date(dateString);
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const minuteBucket = (dateString?: string) => {
  if (!dateString) {
    return '';
  }
  const date = new Date(dateString);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
};

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

const renderSegment = (text: string, keyPrefix: string) => {
  if (!text.includes('\n')) {
    return [<React.Fragment key={keyPrefix}>{text}</React.Fragment>];
  }

  const fragments: React.ReactNode[] = [];
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    fragments.push(
      <React.Fragment key={`${keyPrefix}-line-${index}`}>
        {line}
      </React.Fragment>
    );
    if (index < lines.length - 1) {
      fragments.push(<br key={`${keyPrefix}-br-${index}`} />);
    }
  });
  return fragments;
};

const renderMessageContent = (text: string) => {
  if (!text) {
    return null;
  }

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    const [url] = match;
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(...renderSegment(text.slice(lastIndex, start), `text-${lastIndex}`));
    }

    const href = url.startsWith('http') ? url : `https://${url}`;
    nodes.push(
      <a
        key={`link-${start}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-indigo underline decoration-dotted break-all hover:text-brand-grape"
      >
        {url}
      </a>
    );

    lastIndex = start + url.length;
  }

  if (lastIndex < text.length) {
    nodes.push(...renderSegment(text.slice(lastIndex), `text-${lastIndex || 'end'}`));
  }

  return nodes.length ? nodes : text;
};

type MessageCluster = {
  id: string;
  sender: UserPreview;
  messages: ChatMessage[];
  isOwn: boolean;
  minuteKey: string;
  lastTimestamp: string;
};

const MessageClusterBlock: React.FC<{ cluster: MessageCluster }> = ({ cluster }) => (
  <div className={`flex flex-col gap-1 ${cluster.isOwn ? 'items-end' : 'items-start'}`}>
    {!cluster.isOwn && (
      <p className="text-[11px] uppercase tracking-[0.25em] text-text-muted">
        {cluster.sender.first_name} {cluster.sender.last_name}
      </p>
    )}
    <div className={`flex flex-col gap-1 w-full ${cluster.isOwn ? 'items-end' : 'items-start'}`}>
      {cluster.messages.map(message => (
        <div
          key={message._id}
          className={`max-w-[80%] rounded-3xl px-4 py-2 text-sm leading-relaxed shadow-brand-card break-words ${
            cluster.isOwn
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
              : 'bg-white text-text-primary border border-border-soft'
          }`}
        >
          {renderMessageContent(message.content)}
        </div>
      ))}
    </div>
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.3em] text-text-muted">
        {formatTime(cluster.lastTimestamp)}
      </span>
      {cluster.isOwn && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-brand-indigo">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  </div>
);

const ChatListItem: React.FC<{ chat: ChatSummary; active: boolean; onSelect: () => void }> = ({ chat, active, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
      active
        ? 'border-brand-indigo/30 bg-white shadow-brand-card'
        : 'border-border-subtle bg-transparent hover:border-brand-indigo/30'
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <p className="text-base font-semibold text-text-primary line-clamp-1">{chat.name}</p>
      <span className="text-[11px] uppercase tracking-widest text-text-muted">
        {formatTime(chat.lastMessageAt)}
      </span>
    </div>
    <p className="mt-1 text-sm text-text-secondary line-clamp-2">
      {chat.lastMessagePreview || 'Будьте первым, кто напишет сообщение'}
    </p>
  </button>
);

const FriendCard: React.FC<{
  friendship: Friendship;
  onMessage: () => void;
  onRemove: () => void;
}> = ({ friendship, onMessage, onRemove }) => (
  <div className="rounded-2xl border border-border-subtle bg-white p-4 flex items-center justify-between gap-3 shadow-brand-card">
    <div>
      <p className="text-text-primary font-semibold">
        {friendship.user.first_name} {friendship.user.last_name}
      </p>
      <p className="text-xs uppercase tracking-[0.3em] text-text-muted mt-1">
        {friendship.status === 'accepted' ? 'в друзьях' : friendship.status}
      </p>
    </div>
    <div className="flex gap-2">
      <Button size="sm" variant="outline" className="border-border-soft text-text-primary" onClick={onMessage}>
        Написать
      </Button>
      <Button size="sm" variant="outline" className="border-red-200 text-red-600" onClick={onRemove}>
        Удалить
      </Button>
    </div>
  </div>
);

const FriendSearchResultCard: React.FC<{
  user: FriendSearchResult;
  onAdd: () => void;
}> = ({ user, onAdd }) => (
  <div className="rounded-2xl border border-border-subtle bg-white p-3 flex items-center justify-between shadow-brand-card">
    <div>
      <p className="text-text-primary font-semibold">
        {user.first_name} {user.last_name}
      </p>
      <p className="text-xs text-text-muted">{user.friendshipStatus || 'не в списке друзей'}</p>
    </div>
    {!user.friendshipStatus && (
      <Button size="sm" variant="outline" className="border-border-soft text-text-primary" onClick={onAdd}>
        Добавить
      </Button>
    )}
  </div>
);

const RequestBadge: React.FC<{ label: string; actionLabel: string; onClick: () => void; tone?: 'primary' | 'danger' }>
  = ({ label, actionLabel, onClick, tone = 'primary' }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold flex justify-between items-center ${
        tone === 'primary'
          ? 'border-border-soft bg-white text-text-primary shadow-brand-card'
          : 'border-red-200 bg-red-50 text-red-600'
      }`}
    >
      <span>{label}</span>
      <span className="text-xs uppercase tracking-[0.3em] text-text-muted">{actionLabel}</span>
    </button>
  );

const useDebouncedValue = (value: string, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
};

const ChatHeader: React.FC<{ chat: ChatSummary }> = ({ chat }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="text-2xl font-semibold text-text-primary">{chat.name}</p>
      <p className="text-sm text-text-secondary">
        {chat.type === 'direct'
          ? 'Личное общение'
          : chat.visibility === 'public'
          ? 'Публичная группа'
          : 'Закрытая группа'}
      </p>
    </div>
    <div className="text-right text-xs uppercase tracking-[0.3em] text-text-muted">
      {chat.participantCount} участников
    </div>
  </div>
);

export const ChatPage: React.FC = () => {
  const {
    chats,
    activeChatId,
    messagesByChat,
    friends,
    friendRequests,
    friendSearchResults,
    currentUser,
    handleLoadChats,
    handleSelectChat,
    handleRequestMessages,
    handlePostMessage,
    handleJoinByCode,
    handleLoadFriends,
    handleLoadFriendRequests,
    handleRequestDirectChat,
    handleRequestGroupChat,
    handleSearchFriends,
    handleSendFriendRequest,
    handleRespond,
    handleRemoveFriend,
    handleLeaveChat,
    handleLogout,
  } = useUnit({
    chats: $chats,
    activeChatId: $activeChatId,
    messagesByChat: $messagesByChat,
    friends: $friends,
    friendRequests: $friendRequests,
    friendSearchResults: $friendSearchResults,
    currentUser: $currentUser,
    handleLoadChats: loadChats,
    handleSelectChat: selectChat,
    handleRequestMessages: requestMessages,
    handlePostMessage: postMessage,
    handleJoinByCode: joinChatByCode,
    handleLoadFriends: loadFriends,
    handleLoadFriendRequests: loadFriendRequests,
    handleRequestDirectChat: requestDirectChat,
    handleRequestGroupChat: requestGroupChat,
    handleSearchFriends: searchFriends,
    handleSendFriendRequest: sendFriendRequest,
    handleRespond: respondToRequest,
    handleRemoveFriend: removeFriend,
    handleLeaveChat: leaveChat,
    handleLogout: logout,
  });

  const currentUserId = currentUser?._id ?? '';
  const [messageDraft, setMessageDraft] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [chatFilter, setChatFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupVisibility, setGroupVisibility] = useState<'public' | 'private'>('private');
  const [groupMembers, setGroupMembers] = useState<Set<string>>(new Set());
  const [directModalOpen, setDirectModalOpen] = useState(false);
  const [directFilter, setDirectFilter] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const messageListRef = React.useRef<HTMLDivElement | null>(null);

  const debouncedSearch = useDebouncedValue(searchQuery);

  useEffect(() => {
    handleLoadChats();
    handleLoadFriends();
    handleLoadFriendRequests();
  }, [handleLoadChats, handleLoadFriends, handleLoadFriendRequests]);

  useEffect(() => {
    if (!activeChatId && chats.length) {
      handleSelectChat(chats[0]._id);
    }
  }, [activeChatId, chats, handleSelectChat]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetChatId = params.get('chatId');

    if (!targetChatId) {
      return;
    }

    const exists = chats.some(chat => chat._id === targetChatId);
    if (exists) {
      handleSelectChat(targetChatId);
    }
  }, [chats, handleSelectChat]);

  const handleAcceptRequest = (requestId: string) =>
    handleRespond({ requestId, action: 'accept' });

  const handleDeclineRequest = (requestId: string) =>
    handleRespond({ requestId, action: 'decline' });

  useEffect(() => {
    if (activeChatId) {
      handleRequestMessages(activeChatId);
    }
  }, [activeChatId, handleRequestMessages]);

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length >= 2) {
      handleSearchFriends(debouncedSearch);
    }
  }, [debouncedSearch, handleSearchFriends]);

  const filteredChats = useMemo(() => {
    const term = chatFilter.trim().toLowerCase();
    if (!term) {
      return chats;
    }
    return chats.filter(chat => chat.name.toLowerCase().includes(term));
  }, [chatFilter, chats]);

  const filteredFriendOptions = useMemo(() => {
    const term = directFilter.trim().toLowerCase();
    if (!term) {
      return friends;
    }
    return friends.filter(friendship =>
      `${friendship.user.first_name} ${friendship.user.last_name}`.toLowerCase().includes(term)
    );
  }, [directFilter, friends]);

  const activeChat = chats.find(chat => chat._id === activeChatId) || null;
  const activeMessages = (activeChatId && messagesByChat[activeChatId]) || [];
  const messageGroups = useMemo(() => {
    if (!activeMessages.length) {
      return [] as MessageCluster[];
    }

    const groups: MessageCluster[] = [];

    activeMessages.forEach(message => {
      const groupKey = minuteBucket(message.createdAt);
      const lastGroup = groups[groups.length - 1];
      const isOwn = message.sender._id === currentUserId;

      if (lastGroup && lastGroup.sender._id === message.sender._id && lastGroup.minuteKey === groupKey) {
        lastGroup.messages.push(message);
        lastGroup.lastTimestamp = message.createdAt;
      } else {
        groups.push({
          id: `${message._id}-group`,
          sender: message.sender,
          messages: [message],
          isOwn,
          minuteKey: groupKey,
          lastTimestamp: message.createdAt,
        });
      }
    });

    return groups;
  }, [activeMessages, currentUserId]);

  useEffect(() => {
    // auto-scroll to bottom on new groups/messages
    const el = messageListRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messageGroups]);

  const inviteCode = activeChat?.inviteCode ?? '';
  const isGroupChat = activeChat?.type === 'group';

  useEffect(() => {
    setInviteCopied(false);
  }, [inviteCode]);

  const handleSendMessage = () => {
    if (!activeChatId || !messageDraft.trim()) {
      return;
    }
    handlePostMessage({ chatId: activeChatId, content: messageDraft.trim() });
    setMessageDraft('');
  };

  const handleJoin = () => {
    if (!joinCode.trim()) {
      return;
    }
    handleJoinByCode(joinCode.trim());
    setJoinCode('');
  };

  const handleCopyInviteCode = async (code: string) => {
    if (!code) {
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setInviteCopied(false);
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 1500);
    } catch {
      setInviteCopied(false);
    }
  };

  const handleLeaveCurrentChat = () => {
    if (!activeChat) {
      return;
    }
    const confirmation = window.confirm('Вы уверены, что хотите покинуть чат?');
    if (confirmation) {
      handleLeaveChat(activeChat._id);
    }
  };

  const toggleMember = (userId: string) => {
    setGroupMembers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      return;
    }
    handleRequestGroupChat({
      name: groupName.trim(),
      description: groupDescription.trim(),
      visibility: groupVisibility,
      participantIds: Array.from(groupMembers),
    });
    setGroupModalOpen(false);
    setGroupName('');
    setGroupDescription('');
    setGroupMembers(new Set());
  };

  const handleStartDirectChat = (userId: string) => {
    handleRequestDirectChat(userId);
    setDirectModalOpen(false);
    setDirectFilter('');
  };

  const handleNavigation = React.useCallback((path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  const avatarUrl = currentUser?.avatar?.url;
  const userInitials = `${currentUser?.first_name?.[0] ?? ''}${currentUser?.last_name?.[0] ?? ''}`.toUpperCase() || 'U';

  const handleProfileNavigate = React.useCallback(() => {
    handleNavigation('/profile');
  }, [handleNavigation]);

  const handleLogoutClick = React.useCallback(() => {
    handleLogout();
    setTimeout(() => handleNavigation('/'), 120);
  }, [handleLogout, handleNavigation]);

  

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(76,99,255,0.08),_transparent_55%)] text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-white/95 shadow-sm backdrop-blur">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between gap-4 py-3 sm:py-4 min-h-[72px]">
            <button
              type="button"
              onClick={() => handleNavigation('/')}
              className="group flex items-center gap-3 rounded-2xl border border-transparent px-1 py-1 text-left transition-all duration-200 hover:border-brand-indigo/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/30"
              aria-label="Перейти на главную"
            >
              <img
                src={LogoSAU}
                alt="Логотип сервиса"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-3xl border border-transparent transition-transform duration-200 group-hover:scale-105"
              />
              <div className="leading-tight">
                <h1 className="flex items-center text-2xl font-black uppercase tracking-tight text-text-primary sm:text-[1.85rem] lg:text-[2.1rem]">
                  <span className="tracking-[-0.04em]">STUD</span>
                  <span className="ml-1 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent drop-shadow-sm tracking-[-0.04em]">
                    MI
                  </span>
                </h1>
                <p className="text-xs uppercase tracking-[0.35em] text-text-muted">чат</p>
              </div>
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsTopUpModalOpen(true)}
                    className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-sm font-semibold text-emerald-700 shadow-inner transition-colors hover:bg-emerald-100"
                  >
                    <span className="text-base sm:text-lg">{formatBalance(currentUser.balance)}</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">+</span>
                  </button>
                  <NotificationBell />
                  <button
                    type="button"
                    onClick={handleProfileNavigate}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-all duration-200 hover:border-emerald-300 hover:text-emerald-600"
                    aria-label="Профиль"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-brand-indigo text-base font-semibold text-white">
                      {avatarUrl ? <img src={avatarUrl} alt="Аватар" className="h-full w-full rounded-full object-cover" /> : userInitials}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-colors hover:border-emerald-300 hover:text-emerald-600"
                    aria-label="Выйти"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  </button>
                </>
              ) : (
                <Button variant="primary" size="md" onClick={() => handleNavigation('/login')}>
                  Войти
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6">
          <div className="rounded-3xl border border-border-soft bg-white/80 backdrop-blur-xl p-5 space-y-4 shadow-brand-card">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-text-muted">диалоги</p>
              <h2 className="text-2xl font-semibold text-text-primary">Ваши чаты</h2>
            </div>
            <Input
              placeholder="Поиск диалога"
              value={chatFilter}
              onChange={setChatFilter}
            />
            <div className="flex gap-2">
              <Button className="flex-1" size="md" variant="primary" onClick={() => setDirectModalOpen(true)}>
                Новый диалог
              </Button>
              <Button className="flex-1 text-text-primary border-border-soft" size="md" variant="outline" onClick={() => setGroupModalOpen(true)}>
                Группа
              </Button>
            </div>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {filteredChats.map(chat => (
                <ChatListItem
                  key={chat._id}
                  chat={chat}
                  active={chat._id === activeChatId}
                  onSelect={() => handleSelectChat(chat._id)}
                />
              ))}
              {!filteredChats.length && (
                <p className="text-sm text-text-secondary">Пока нет чатов — начните с создания диалога.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border-soft bg-white/80 backdrop-blur-xl p-5 space-y-3 shadow-brand-card">
            <p className="text-xs uppercase tracking-[0.4em] text-text-muted">доступ по ссылке</p>
            <Input
              placeholder="Вставьте код приглашения"
              value={joinCode}
              onChange={setJoinCode}
            />
            <Button variant="outline" className="border-border-soft text-text-primary" onClick={handleJoin}>
              Присоединиться
            </Button>
          </div>

          <div className="rounded-3xl border border-border-soft bg-white/80 backdrop-blur-xl p-5 space-y-4 shadow-brand-card">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-text-muted">друзья</p>
              <h3 className="text-xl font-semibold text-text-primary">Список контактов</h3>
            </div>
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {friends.length === 0 && (
                <p className="text-sm text-text-secondary">Добавляйте коллег, чтобы быстрее находить их в чатах.</p>
              )}
              {friends.map(friendship => (
                <FriendCard
                  key={friendship._id}
                  friendship={friendship}
                  onMessage={() => handleRequestDirectChat(friendship.user._id)}
                  onRemove={() => handleRemoveFriend(friendship._id)}
                />
              ))}
            </div>
            <div className="space-y-2">
              {friendRequests.incoming.map(request => (
                <RequestBadge
                  key={request._id}
                  label={`Запрос от ${request.user.first_name}`}
                  actionLabel="принять"
                  onClick={() => handleAcceptRequest(request._id)}
                />
              ))}
              {friendRequests.outgoing.map(request => (
                <RequestBadge
                  key={request._id}
                  label={`Ожидает ${request.user.first_name}`}
                  actionLabel="отменить"
                  tone="danger"
                  onClick={() => handleDeclineRequest(request._id)}
                />
              ))}
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Поиск коллег"
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {friendSearchResults.map(result => (
                  <FriendSearchResultCard
                    key={result._id}
                    user={result}
                    onAdd={() => handleSendFriendRequest(result._id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="rounded-[32px] border border-border-soft bg-white p-6 flex flex-col min-h-[72vh] shadow-brand-card">
          {activeChat ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                    className="rounded-full p-2 border border-border-subtle bg-white hover:bg-brand-almond/40 transition-colors"
                    aria-label="Назад"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-text-primary">
                      <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div>
                    <p className="text-xs text-text-muted">Сервис</p>
                    <h3 className="text-lg font-semibold">Чат</h3>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    className="min-w-[120px] h-11 px-6"
                  >
                    Поиск
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    className="min-w-[140px] h-11 px-6"
                    onClick={() => handleRequestGroupChat({ name: 'Новая группа (через шапку)' })}
                  >
                    Создать
                  </Button>
                </div>
              </div>
              <ChatHeader chat={activeChat} />
              {inviteCode && (
                <div className="mt-4 flex flex-wrap gap-3 items-center">
                  <div className="flex-1 min-w-[240px] rounded-2xl border border-border-soft bg-surface-muted p-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-text-muted">код доступа</p>
                    <div className="mt-2 flex items-center gap-3">
                      <p className="flex-1 break-all font-mono text-text-primary text-sm">{inviteCode}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border-soft text-text-primary text-xs h-9"
                        onClick={() => handleCopyInviteCode(inviteCode)}
                      >
                        {inviteCopied ? 'Скопировано' : 'Копировать'}
                      </Button>
                    </div>
                  </div>
                  {isGroupChat && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 h-11"
                      onClick={handleLeaveCurrentChat}
                    >
                      Покинуть чат
                    </Button>
                  )}
                </div>
              )}
              <div ref={messageListRef} className="flex-1 mt-6 overflow-y-auto space-y-5 pr-3 styled-scrollbar">
                {messageGroups.length === 0 && (
                  <div className="text-center text-text-secondary text-sm py-10">
                    Здесь пока пусто. Начните переписку!
                  </div>
                )}
                          {messageGroups.map(group => (
                            <div key={group.id} className="py-1">
                              <MessageClusterBlock cluster={group} />
                            </div>
                          ))}
              </div>
              <div className="mt-4 flex gap-3">
                <textarea
                  placeholder="Сообщение"
                  value={messageDraft}
                  onChange={event => setMessageDraft(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={1}
                  className="flex-1 rounded-2xl border border-border-soft bg-surface-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo resize-none min-h-[56px] max-h-32"
                />
                <Button variant="primary" onClick={handleSendMessage} disabled={!messageDraft.trim()} className="min-w-[120px]">
                  Отправить
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center text-text-secondary">
              <p>Выберите чат слева или создайте новый, чтобы начать общение.</p>
            </div>
          )}
        </section>
      </div>
      </main>

      <Footer />
      <TopUpRequestModal isOpen={isTopUpModalOpen} onClose={() => setIsTopUpModalOpen(false)} />

      {directModalOpen && (
        <div className="fixed inset-0 bg-brand-indigo/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-border-soft rounded-3xl p-6 w-full max-w-xl space-y-4 shadow-brand-card">
            <h3 className="text-2xl font-semibold text-text-primary">Новый диалог</h3>
            <Input placeholder="Поиск по имени" value={directFilter} onChange={setDirectFilter} />
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {filteredFriendOptions.length === 0 && (
                <p className="text-sm text-text-secondary">Нет друзей, соответствующих запросу</p>
              )}
              {filteredFriendOptions.map(friendship => (
                <button
                  key={friendship._id}
                  type="button"
                  onClick={() => handleStartDirectChat(friendship.user._id)}
                  className="w-full text-left rounded-2xl border border-border-subtle bg-surface-muted p-3 hover:border-brand-indigo/40 transition-colors"
                >
                  {friendship.user.first_name} {friendship.user.last_name}
                </button>
              ))}
            </div>
            <Button variant="outline" className="w-full border-border-soft text-text-primary" onClick={() => setDirectModalOpen(false)}>
              Закрыть
            </Button>
          </div>
        </div>
      )}

      {groupModalOpen && (
        <div className="fixed inset-0 bg-brand-indigo/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-border-soft rounded-3xl p-6 w-full max-w-xl space-y-4 shadow-brand-card">
            <h3 className="text-2xl font-semibold text-text-primary">Новая группа</h3>
            <Input placeholder="Название" value={groupName} onChange={setGroupName} />
            <textarea
              value={groupDescription}
              onChange={event => setGroupDescription(event.target.value)}
              placeholder="Описание (необязательно)"
              className="w-full rounded-2xl border border-border-soft bg-surface-muted p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                type="button"
                className={`flex-1 rounded-2xl border px-4 py-2 ${
                  groupVisibility === 'private'
                    ? 'border-brand-indigo text-text-primary bg-brand-almond/40'
                    : 'border-border-subtle text-text-muted'
                }`}
                onClick={() => setGroupVisibility('private')}
              >
                Приватная
              </button>
              <button
                type="button"
                className={`flex-1 rounded-2xl border px-4 py-2 ${
                  groupVisibility === 'public'
                    ? 'border-brand-indigo text-text-primary bg-brand-almond/40'
                    : 'border-border-subtle text-text-muted'
                }`}
                onClick={() => setGroupVisibility('public')}
              >
                Публичная
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {friends.map(friendship => (
                <label key={friendship._id} className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-white p-3 shadow-sm">
                  <input
                    type="checkbox"
                    checked={groupMembers.has(friendship.user._id)}
                    onChange={() => toggleMember(friendship.user._id)}
                  />
                  <span>
                    {friendship.user.first_name} {friendship.user.last_name}
                  </span>
                </label>
              ))}
              {friends.length === 0 && <p className="text-sm text-text-secondary">Нет друзей для добавления</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" variant="outline" onClick={() => setGroupModalOpen(false)}>
                Отмена
              </Button>
              <Button className="flex-1" variant="primary" onClick={handleCreateGroup}>
                Создать
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
