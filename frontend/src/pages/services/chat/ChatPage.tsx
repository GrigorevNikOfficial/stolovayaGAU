import { useUnit } from 'effector-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '../../../components/layout/Button/Button.tsx';
import Input from '../../../components/layout/Input/Input.tsx';
import TopUpRequestModal from '../../../components/Modal/TopUpRequestModal.tsx';
import {
  $activeChatId,
  $chats,
  $friends,
  $messagesByChat,
  addParticipantsToChat,
  leaveChat,
  loadChats,
  loadFriends,
  postMessage,
  requestDirectChat,
  requestGroupChat,
  requestMessages,
  selectChat,
  sendFriendRequest,
} from '../../../models/chat';
import { addParticipantsToChatFx, sendFriendRequestFx } from '../../../models/chat';
import { $currentUser, logout } from '../../../models/users';
import NotificationBell from '../../../components/Notifications/NotificationBell.tsx';
import LogoSAU from '../../../images/logo.jpg';
import { formatBalance } from '../../../utils/formatBalance';
import type { ChatMessage, ChatParticipant, ChatSummary, ParticipantRole } from '../../../types/chat';
import type { Friendship } from '../../../types/friend';
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

const PARTICIPANT_ROLE_LABELS: Record<ParticipantRole, string> = {
  owner: 'Создатель',
  admin: 'Администратор',
  member: 'Участник',
};

const SIDEBAR_TABS: Array<{ id: 'chats' | 'friends'; label: string }> = [
  { id: 'chats', label: 'Чаты' },
  { id: 'friends', label: 'Друзья' },
];

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
          className={`max-w-[80%] rounded-[10px] px-4 py-2 text-sm leading-relaxed shadow-brand-card break-words ${
            cluster.isOwn
              ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white'
              : 'bg-surface-base text-text-primary border border-border-soft'
          }`}
        >
          {renderMessageContent(message.content)}
        </div>
      ))}
    </div>
    <span className="text-[10px] uppercase tracking-[0.3em] text-text-muted">
      {formatTime(cluster.lastTimestamp)}
    </span>
  </div>
);

const ChatPreviewButton: React.FC<{ chat: ChatSummary; active: boolean; onSelect: () => void }> = ({ chat, active, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs sm:text-sm transition-all ${
      active
        ? 'border-brand-indigo/40 bg-white shadow-brand-card'
        : 'border-border-subtle/80 bg-transparent hover:border-brand-indigo/30'
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-semibold text-text-primary line-clamp-1 sm:text-sm">{chat.name}</p>
      <span className="text-[9px] uppercase tracking-[0.35em] text-text-muted sm:text-[10px]">
        {formatTime(chat.lastMessageAt)}
      </span>
    </div>
    <p className="mt-1 text-[11px] text-text-secondary line-clamp-2 sm:text-xs">
      {chat.lastMessagePreview || 'Будьте первым, кто напишет сообщение'}
    </p>
  </button>
);

const FriendListCard: React.FC<{ friendship: Friendship; onClick?: (userId: string) => void }> = ({ friendship, onClick }) => {
  const user = friendship.user;
  if (!user) {
    return null;
  }
  const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.trim().toUpperCase() || 'U';

  const handleClick = () => {
    if (onClick) {
      onClick(user._id);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border-soft bg-white px-3 py-2 text-left transition-all duration-200 hover:border-brand-indigo/40 hover:shadow-brand-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/30"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-muted text-sm font-semibold text-text-primary">
        {user.avatar?.url ? (
          <img src={user.avatar.url} alt="Аватар" className="h-full w-full rounded-2xl object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-text-primary">
          {user.first_name} {user.last_name}
        </p>
        {friendship.status && (
          <p className="text-[11px] uppercase tracking-[0.35em] text-text-muted">{friendship.status}</p>
        )}
      </div>
    </button>
  );
};

const SidebarTabs: React.FC<{ active: 'chats' | 'friends'; onChange: (tab: 'chats' | 'friends') => void }> = ({ active, onChange }) => (
  <div className="flex w-full gap-2 overflow-x-auto px-0 py-1" role="tablist">
    {SIDEBAR_TABS.map(tab => {
      const isActive = active === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(tab.id)}
          className={`group relative flex flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-all duration-300 ${
            isActive
              ? 'border-emerald-400/70 bg-emerald-50 text-emerald-800 shadow-[0_18px_45px_rgba(16,185,129,0.25)]'
              : 'border-transparent bg-transparent text-text-secondary hover:text-emerald-600'
          } cursor-pointer hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/30`}
        >
          <span className="whitespace-nowrap">{tab.label}</span>
          <span
            className={`pointer-events-none absolute inset-x-6 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-all duration-300 ${
              isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-70'
            }`}
          />
        </button>
      );
    })}
  </div>
);

export const ChatPage: React.FC = () => {
  const {
    chats,
    activeChatId,
    messagesByChat,
    friends,
    currentUser,
    handleLoadChats,
    handleLoadFriends,
    handleSelectChat,
    handleRequestMessages,
    handleRequestDirectChat,
    handleRequestGroupChat,
    handlePostMessage,
    handleLeaveChat,
    handleAddParticipants,
    handleSendFriendRequest,
    handleLogout,
  } = useUnit({
    chats: $chats,
    activeChatId: $activeChatId,
    messagesByChat: $messagesByChat,
    friends: $friends,
    currentUser: $currentUser,
    handleLoadChats: loadChats,
    handleLoadFriends: loadFriends,
    handleSelectChat: selectChat,
    handleRequestMessages: requestMessages,
    handleRequestDirectChat: requestDirectChat,
    handleRequestGroupChat: requestGroupChat,
    handlePostMessage: postMessage,
    handleLeaveChat: leaveChat,
    handleAddParticipants: addParticipantsToChat,
    handleSendFriendRequest: sendFriendRequest,
    handleLogout: logout,
  });

  const isAddingParticipants = useUnit(addParticipantsToChatFx.pending);
  const isFriendRequestPending = useUnit(sendFriendRequestFx.pending);

  const messageListRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = currentUser?._id ?? '';
  const [messageDraft, setMessageDraft] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'friends'>('chats');
  const [sidebarFilter, setSidebarFilter] = useState('');
  const [copyUserCodeSuccess, setCopyUserCodeSuccess] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isCreateChatModalOpen, setIsCreateChatModalOpen] = useState(false);
  const [chatCreationMode, setChatCreationMode] = useState<'group' | 'direct'>('group');
  const [newChatName, setNewChatName] = useState('');
  const [directChatCode, setDirectChatCode] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
  const [codeParticipantInput, setCodeParticipantInput] = useState('');
  const [codeParticipants, setCodeParticipants] = useState<string[]>([]);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [isMobileChatVisible, setIsMobileChatVisible] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [participantFilter, setParticipantFilter] = useState('');
  const [selectedInvitees, setSelectedInvitees] = useState<Set<string>>(new Set());
  const [inviteCopySuccess, setInviteCopySuccess] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const showMobileChatList = isMobileLayout && !isMobileChatVisible;
  const showChatPanel = !isMobileLayout || isMobileChatVisible;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const updateLayout = () => setIsMobileLayout(mediaQuery.matches);
    updateLayout();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateLayout);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(updateLayout);
    }
    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', updateLayout);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(updateLayout);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMobileLayout) {
      setIsMobileChatVisible(false);
    }
  }, [isMobileLayout]);

  useEffect(() => {
    if (!activeChatId && isMobileLayout) {
      setIsMobileChatVisible(false);
    }
  }, [activeChatId, isMobileLayout]);

  useEffect(() => {
    setSidebarFilter('');
  }, [sidebarTab]);

  useEffect(() => {
    handleLoadChats();
  }, [handleLoadChats]);

  useEffect(() => {
    handleLoadFriends();
  }, [handleLoadFriends]);

  useEffect(() => {
    if (!activeChatId && chats.length && !isMobileLayout) {
      handleSelectChat(chats[0]._id);
    }
  }, [activeChatId, chats, handleSelectChat, isMobileLayout]);

  useEffect(() => {
    setSelectedInvitees(new Set());
    setParticipantFilter('');
  }, [activeChatId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetChatId = params.get('chatId');
    if (targetChatId && chats.some(chat => chat._id === targetChatId)) {
      handleSelectChat(targetChatId);
      if (isMobileLayout) {
        setIsMobileChatVisible(true);
      }
    }
  }, [chats, handleSelectChat, isMobileLayout]);

  useEffect(() => {
    if (activeChatId) {
      handleRequestMessages(activeChatId);
    }
  }, [activeChatId, handleRequestMessages]);

  useEffect(() => {
    if (!isParticipantsModalOpen) {
      setParticipantFilter('');
      setSelectedInvitees(new Set());
      setInviteCopySuccess(false);
    }
  }, [isParticipantsModalOpen]);

  useEffect(() => {
    if (!isAddFriendModalOpen) {
      setFriendCodeInput('');
    }
  }, [isAddFriendModalOpen]);

  const activeChat = chats.find(chat => chat._id === activeChatId) || null;
  const activeMessages = (activeChatId && messagesByChat[activeChatId]) || [];
  const chatInviteCode = activeChat?.inviteCode || activeChat?._id || '';
  const friendList = friends ?? [];
  const activeParticipantIds = useMemo(() => {
    if (!activeChat?.participants) {
      return new Set<string>();
    }
    return new Set(
      activeChat.participants.map(participant => {
        if (typeof participant.user === 'string') {
          return participant.user;
        }
        return participant.user?._id ?? '';
      }).filter(Boolean)
    );
  }, [activeChat]);
  const availableFriends = useMemo(() => {
    if (!friendList.length) {
      return [] as Friendship[];
    }
    return friendList.filter(friend => friend.user && !activeParticipantIds.has(friend.user._id));
  }, [friendList, activeParticipantIds]);
  const filteredInviteOptions = useMemo(() => {
    if (!participantFilter.trim()) {
      return availableFriends;
    }
    const term = participantFilter.trim().toLowerCase();
    return availableFriends.filter(friend => {
      const first = friend.user?.first_name ?? '';
      const last = friend.user?.last_name ?? '';
      return `${first} ${last}`.toLowerCase().includes(term);
    });
  }, [availableFriends, participantFilter]);
  const filteredFriends = useMemo(() => {
    if (!friendList.length) {
      return [] as Friendship[];
    }
    const term = sidebarFilter.trim().toLowerCase();
    if (!term) {
      return friendList;
    }
    return friendList.filter(friend => {
      const first = friend.user?.first_name ?? '';
      const last = friend.user?.last_name ?? '';
      return `${first} ${last}`.toLowerCase().includes(term);
    });
  }, [friendList, sidebarFilter]);
  const balanceLabel = currentUser ? formatBalance(currentUser.balance) : '';

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
    const el = messageListRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messageGroups]);

  const filteredChats = useMemo(() => {
    const term = sidebarFilter.trim().toLowerCase();
    if (!term) {
      return chats;
    }
    return chats.filter(chat => chat.name.toLowerCase().includes(term));
  }, [sidebarFilter, chats]);

  const handleCopyUserCode = async () => {
    if (!currentUser?._id || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(currentUser._id);
      setCopyUserCodeSuccess(true);
      window.setTimeout(() => setCopyUserCodeSuccess(false), 1500);
    } catch {
      setCopyUserCodeSuccess(false);
    }
  };

  const closeCreateChatModal = () => {
    setIsCreateChatModalOpen(false);
    setChatCreationMode('group');
    setNewChatName('');
    setDirectChatCode('');
    setSelectedFriendIds(new Set());
    setCodeParticipantInput('');
    setCodeParticipants([]);
  };

  const handleToggleFriendParticipant = (friendId: string) => {
    setSelectedFriendIds(prev => {
      const next = new Set(prev);
      if (next.has(friendId)) {
        next.delete(friendId);
      } else {
        next.add(friendId);
      }
      return next;
    });
  };

  const handleAddCodeParticipant = () => {
    const code = codeParticipantInput.trim();
    if (!code) {
      return;
    }
    setCodeParticipants(prev => (prev.includes(code) ? prev : [...prev, code]));
    setCodeParticipantInput('');
  };

  const handleRemoveCodeParticipant = (code: string) => {
    setCodeParticipants(prev => prev.filter(item => item !== code));
  };

  const handleToggleInvitee = (userId: string) => {
    setSelectedInvitees(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleAddSelectedInvitees = () => {
    if (!activeChat) {
      return;
    }
    const participantIds = Array.from(selectedInvitees);
    if (!participantIds.length) {
      return;
    }
    handleAddParticipants({ chatId: activeChat._id, participantIds });
    setSelectedInvitees(new Set());
  };

  const handleOpenParticipantsModal = () => {
    if (!activeChat) {
      return;
    }
    setIsParticipantsModalOpen(true);
  };

  const handleCloseParticipantsModal = () => {
    setIsParticipantsModalOpen(false);
  };

  const handleCopyInviteCode = async () => {
    const inviteCodeValue = activeChat?.inviteCode || activeChat?._id;
    if (!inviteCodeValue || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(inviteCodeValue);
      setInviteCopySuccess(true);
      window.setTimeout(() => setInviteCopySuccess(false), 2000);
    } catch {
      setInviteCopySuccess(false);
    }
  };

  const handleSubmitFriendRequest = () => {
    const code = friendCodeInput.trim();
    if (!code) {
      return;
    }
    handleSendFriendRequest(code);
    setIsAddFriendModalOpen(false);
  };

  const handleChatPreviewSelect = React.useCallback(
    (chatId: string) => {
      handleSelectChat(chatId);
      if (isMobileLayout) {
        setIsMobileChatVisible(true);
      }
    },
    [handleSelectChat, isMobileLayout]
  );

  const handleFriendClick = React.useCallback(
    (userId: string) => {
      if (!userId) {
        return;
      }

      const participantMatches = (participant: ChatParticipant) => {
        if (!participant) {
          return false;
        }
        if (typeof participant.user === 'string') {
          return participant.user === userId;
        }
        return participant.user?._id === userId;
      };

      const currentUserMatches = (participant: ChatParticipant) => {
        if (!participant) {
          return false;
        }
        if (typeof participant.user === 'string') {
          return participant.user === currentUserId;
        }
        return participant.user?._id === currentUserId;
      };

      const existingDirectChat = chats.find(
        chat =>
          chat.type === 'direct' &&
          Array.isArray(chat.participants) &&
          chat.participants.some(participantMatches) &&
          chat.participants.some(currentUserMatches)
      );

      if (existingDirectChat) {
        handleChatPreviewSelect(existingDirectChat._id);
        if (sidebarTab !== 'chats') {
          setSidebarTab('chats');
        }
        if (isMobileLayout) {
          setIsMobileChatVisible(true);
        }
        return;
      }

      handleRequestDirectChat(userId);
      setSidebarTab('chats');
      if (isMobileLayout) {
        setIsMobileChatVisible(true);
      }
    },
    [
      chats,
      currentUserId,
      handleChatPreviewSelect,
      handleRequestDirectChat,
      isMobileLayout,
      sidebarTab,
      setIsMobileChatVisible,
      setSidebarTab,
    ]
  );

  const handleBackToChatList = React.useCallback(() => {
    if (isMobileLayout) {
      setIsMobileChatVisible(false);
    }
  }, [isMobileLayout]);

  const handleCreateGroupChat = () => {
    if (!newChatName.trim()) {
      return;
    }
    const participantIds = Array.from(new Set([...Array.from(selectedFriendIds), ...codeParticipants]));
    handleRequestGroupChat({ name: newChatName.trim(), participantIds });
    closeCreateChatModal();
  };

  const handleStartDirectChatByCode = () => {
    const code = directChatCode.trim();
    if (!code) {
      return;
    }
    handleRequestDirectChat(code);
    closeCreateChatModal();
  };

  const handleSendMessage = () => {
    if (!activeChatId || !messageDraft.trim()) {
      return;
    }
    handlePostMessage({ chatId: activeChatId, content: messageDraft.trim() });
    setMessageDraft('');
  };

  const handleLeaveCurrentChat = () => {
    if (!activeChat) {
      return;
    }
    const confirmation = window.confirm('Вы уверены, что хотите покинуть чат?');
    if (confirmation) {
      handleLeaveChat(activeChat._id);
      setIsParticipantsModalOpen(false);
      if (isMobileLayout) {
        setIsMobileChatVisible(false);
      }
    }
  };

  const handleNavigation = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const avatarUrl = currentUser?.avatar?.url;
  const userInitials = `${currentUser?.first_name?.[0] ?? ''}${currentUser?.last_name?.[0] ?? ''}`.toUpperCase() || 'U';

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
                className="hidden h-12 w-12 rounded-3xl border border-transparent transition-transform duration-200 group-hover:scale-105 sm:block sm:h-14 sm:w-14"
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
                    className="flex min-w-0 items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-inner transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
                  >
                    <span
                      className="max-w-[90px] truncate text-sm font-semibold text-emerald-800 sm:max-w-[140px] sm:text-base"
                      title={balanceLabel}
                    >
                      {balanceLabel}
                    </span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white sm:h-6 sm:w-6">+</span>
                  </button>
                  <NotificationBell />
                  <button
                    type="button"
                    onClick={() => handleNavigation('/profile')}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-base text-text-secondary transition-all duration-200 hover:border-emerald-300 hover:text-emerald-600"
                    aria-label="Профиль"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-brand-indigo text-base font-semibold text-white">
                      {avatarUrl ? <img src={avatarUrl} alt="Аватар" className="h-full w-full rounded-full object-cover" /> : userInitials}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogout()}
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

      <main className="flex-1 w-full overflow-hidden min-h-0">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:py-8 lg:px-8 min-h-0">
          {showMobileChatList && (
            <div className="lg:hidden rounded-3xl border border-border-soft bg-white p-5 shadow-brand-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-text-muted">ваши беседы</p>
                  <h2 className="text-2xl font-semibold text-text-primary">Чат</h2>
                </div>
                {sidebarTab === 'chats' ? (
                  <Button variant="primary" size="sm" onClick={() => setIsCreateChatModalOpen(true)}>
                    Создать чат
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => setIsAddFriendModalOpen(true)}>
                    Добавить друга
                  </Button>
                )}
              </div>
              <div className="mt-4">
                <SidebarTabs active={sidebarTab} onChange={setSidebarTab} />
              </div>
              <div className="mt-4">
                <Input
                  placeholder={sidebarTab === 'chats' ? 'Поиск чата' : 'Поиск друга'}
                  value={sidebarFilter}
                  onChange={setSidebarFilter}
                />
              </div>
              <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto pr-1 styled-scrollbar">
                {sidebarTab === 'chats' ? (
                  filteredChats.length ? (
                    filteredChats.map(chat => (
                      <ChatPreviewButton
                        key={chat._id}
                        chat={chat}
                        active={chat._id === activeChatId}
                        onSelect={() => handleChatPreviewSelect(chat._id)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-text-secondary">Пока нет чатов — создайте новый, чтобы начать.</p>
                  )
                ) : filteredFriends.length ? (
                  filteredFriends.map(friendship =>
                    friendship.user ? (
                      <FriendListCard
                        key={friendship._id}
                        friendship={friendship}
                        onClick={handleFriendClick}
                      />
                    ) : null
                  )
                ) : (
                  <p className="text-sm text-text-secondary">Список друзей пуст.</p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-1 min-h-0 flex-col gap-6 lg:h-[72vh] lg:flex-row lg:overflow-hidden">
            <aside className="hidden w-[260px] min-h-[200px] flex-shrink-0 rounded-3xl border border-border-soft bg-white p-4 shadow-brand-card lg:flex lg:h-[72vh] lg:max-h-[72vh] lg:flex-col lg:items-center lg:overflow-hidden">
              <div className="flex h-full w-full max-w-[240px] flex-1 flex-col min-h-0">
                <div className="text-center">
                  <SidebarTabs active={sidebarTab} onChange={setSidebarTab} />
                </div>
                <div className="mt-4 w-full max-w-[220px] mx-auto">
                  <Input
                    placeholder={sidebarTab === 'chats' ? 'Поиск чата' : 'Поиск друга'}
                    value={sidebarFilter}
                    onChange={setSidebarFilter}
                  />
                </div>
                <div className="mt-4 flex-1 w-full space-y-2 overflow-y-auto pr-1 styled-scrollbar">
                  {sidebarTab === 'chats' ? (
                    filteredChats.length ? (
                      filteredChats.map(chat => (
                        <ChatPreviewButton
                          key={chat._id}
                          chat={chat}
                          active={chat._id === activeChatId}
                          onSelect={() => handleChatPreviewSelect(chat._id)}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-text-secondary">Пока нет чатов — создайте новый, чтобы начать.</p>
                    )
                  ) : filteredFriends.length ? (
                    filteredFriends.map(friendship =>
                      friendship.user ? (
                        <FriendListCard
                          key={friendship._id}
                          friendship={friendship}
                          onClick={handleFriendClick}
                        />
                      ) : null
                    )
                  ) : (
                    <p className="text-sm text-text-secondary">Список друзей пуст.</p>
                  )}
                </div>
                {sidebarTab === 'chats' ? (
                  <Button
                    type="button"
                    variant="primary"
                    className="mt-4 w-full"
                    onClick={() => setIsCreateChatModalOpen(true)}
                  >
                    Создать чат
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    className="mt-4 w-full"
                    onClick={() => setIsAddFriendModalOpen(true)}
                  >
                    Добавить друга
                  </Button>
                )}
              </div>
            </aside>

            {showChatPanel && (
              <section className="flex h-full min-h-[60vh] flex-1 flex-col rounded-3xl border border-border-soft bg-white shadow-brand-card overflow-hidden max-h-[85vh] md:max-h-[78vh] lg:h-[72vh] lg:max-h-[72vh] lg:min-h-0">
              {activeChat ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle px-6 py-4 flex-none">
                    <button
                      type="button"
                      onClick={handleOpenParticipantsModal}
                      className="group text-left"
                      aria-label="Открыть участников чата"
                    >
                      <h2 className="text-2xl font-semibold text-text-primary group-hover:text-brand-indigo transition-colors">
                        {activeChat.name}
                      </h2>
                      <p className="text-sm text-text-secondary group-hover:text-brand-indigo/80">
                        {activeChat.participantCount} участников
                      </p>
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      {isMobileLayout && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border-soft text-text-primary"
                          onClick={handleBackToChatList}
                        >
                          Назад к чатам
                        </Button>
                      )}
                    </div>
                  </div>

                  <div ref={messageListRef} className="flex-1 min-h-0 space-y-5 overflow-y-auto px-4 py-6 styled-scrollbar">
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

                  <div className="border-t border-border-subtle px-4 py-4 flex-none">
                    <div className="flex items-end gap-2 sm:gap-3">
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
                        className="flex-1 rounded-2xl border border-border-soft bg-surface-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo resize-none min-h-[52px] max-h-32"
                      />
                      <Button
                        variant="primary"
                        onClick={handleSendMessage}
                        disabled={!messageDraft.trim()}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl p-0 sm:h-14 sm:w-14"
                        aria-label="Отправить сообщение"
                      >
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        <span className="sr-only">Отправить</span>
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-10 text-center text-text-secondary">
                  <p>Выберите чат в списке, чтобы начать общение.</p>
                </div>
              )}
              </section>
            )}
          </div>
        </div>
      </main>
      <TopUpRequestModal isOpen={isTopUpModalOpen} onClose={() => setIsTopUpModalOpen(false)} />
      {isCreateChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeCreateChatModal} />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-border-soft bg-white p-6 shadow-brand-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-text-primary">Новый чат</h3>
              </div>
              <button
                type="button"
                onClick={closeCreateChatModal}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle text-text-secondary hover:text-brand-indigo"
                aria-label="Закрыть"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="mt-6 flex gap-3">
              {(
                [
                  { key: 'group', label: 'Общий чат' },
                  { key: 'direct', label: 'Личная переписка' },
                ] as const
              ).map(option => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setChatCreationMode(option.key)}
                  className={`flex-1 rounded-2xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    chatCreationMode === option.key
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-brand-card'
                      : 'border-border-subtle text-text-secondary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {chatCreationMode === 'group' ? (
              <div className="mt-5 space-y-4">
                <Input value={newChatName} onChange={setNewChatName} placeholder="Название общего чата" />
                <div className="rounded-2xl border border-border-soft bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-muted">выбрать из друзей</p>
                  <div className="mt-3 max-h-48 overflow-y-auto space-y-2 pr-1 styled-scrollbar">
                    {friendList.length ? (
                      friendList.map((friendship: Friendship) => {
                        const user = friendship.user;
                        if (!user) {
                          return null;
                        }
                        const isSelected = selectedFriendIds.has(user._id);
                        return (
                          <button
                            key={friendship._id}
                            type="button"
                            onClick={() => handleToggleFriendParticipant(user._id)}
                            className={`w-full rounded-2xl border px-4 py-2 text-left transition-colors ${
                              isSelected
                                ? 'border-emerald-400 bg-emerald-50 text-text-primary shadow-brand-card'
                                : 'border-border-subtle bg-white text-text-secondary hover:border-emerald-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-text-primary">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-[11px] uppercase tracking-[0.35em] text-text-muted">{friendship.status}</p>
                              </div>
                              <span
                                className={`text-xs font-semibold ${
                                  isSelected ? 'text-emerald-600' : 'text-text-secondary'
                                }`}
                              >
                                {isSelected ? 'Добавлен' : 'Добавить'}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-sm text-text-secondary">Список друзей пуст.</p>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-border-soft bg-white/70 p-4 space-y-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-muted">добавить по коду</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input value={codeParticipantInput} onChange={setCodeParticipantInput} placeholder="Код участника" />
                    <Button
                      variant="outline"
                      className="sm:min-w-[130px]"
                      onClick={handleAddCodeParticipant}
                      disabled={!codeParticipantInput.trim()}
                    >
                      Добавить
                    </Button>
                  </div>
                  {codeParticipants.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {codeParticipants.map(code => (
                        <span
                          key={code}
                          className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-muted px-3 py-1 text-xs font-mono"
                        >
                          {code}
                          <button
                            type="button"
                            onClick={() => handleRemoveCodeParticipant(code)}
                            className="text-text-secondary hover:text-brand-indigo"
                            aria-label="Удалить код участника"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="rounded-2xl border border-dashed border-border-soft bg-surface-muted/60 p-3 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-text-muted">ваш код</p>
                      <p className="mt-1 break-all font-mono text-sm text-text-primary">{currentUser?._id || '—'}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-border-soft text-text-primary sm:mt-0"
                      onClick={handleCopyUserCode}
                      disabled={!currentUser?._id}
                    >
                      {copyUserCodeSuccess ? 'Скопировано' : 'Копировать'}
                    </Button>
                  </div>
                </div>
                <Button variant="primary" className="w-full" onClick={handleCreateGroupChat} disabled={!newChatName.trim()}>
                  Создать чат
                </Button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <Input value={directChatCode} onChange={setDirectChatCode} placeholder="Код друга для личной переписки" />
                <Button variant="primary" className="w-full" onClick={handleStartDirectChatByCode} disabled={!directChatCode.trim()}>
                  Начать диалог
                </Button>
              </div>
            )}
            <Button variant="outline" className="mt-4 w-full border-border-soft text-text-primary" onClick={closeCreateChatModal}>
              Отменить
            </Button>
          </div>
        </div>
      )}
      {isAddFriendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsAddFriendModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-border-soft bg-white p-6 shadow-brand-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-text-primary">Добавить друга</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFriendModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle text-text-secondary hover:text-brand-indigo"
                aria-label="Закрыть"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <Input
                value={friendCodeInput}
                onChange={setFriendCodeInput}
                placeholder="Код пользователя"
              />
              <div className="rounded-2xl border border-dashed border-border-soft bg-surface-muted/60 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-text-muted">ваш код</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex-1 break-all font-mono text-sm text-text-primary">{currentUser?._id || '—'}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border-soft text-text-primary"
                    onClick={handleCopyUserCode}
                    disabled={!currentUser?._id}
                  >
                    {copyUserCodeSuccess ? 'Скопировано' : 'Копировать'}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleSubmitFriendRequest}
                  disabled={!friendCodeInput.trim() || isFriendRequestPending}
                >
                  {isFriendRequestPending ? 'Отправляем...' : 'Отправить запрос'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-border-soft text-text-primary"
                  onClick={() => setIsAddFriendModalOpen(false)}
                >
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isParticipantsModalOpen && activeChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={handleCloseParticipantsModal} />
          <div className="relative z-10 w-full max-w-4xl rounded-3xl border border-border-soft bg-white p-6 shadow-brand-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-text-primary">{activeChat.name}</h3>
                <p className="text-sm text-text-secondary">{activeChat.participantCount} участников</p>
              </div>
              <button
                type="button"
                onClick={handleCloseParticipantsModal}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle text-text-secondary hover:text-brand-indigo"
                aria-label="Закрыть"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-border-soft bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-muted">участники</p>
                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1 styled-scrollbar">
                    {activeChat.participants?.length ? (
                      activeChat.participants.map(participant => {
                        const user = participant.user;
                        const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.trim().toUpperCase() || 'U';
                        return (
                          <div
                            key={participant._id}
                            className="flex items-center gap-3 rounded-2xl border border-border-soft bg-white px-3 py-2"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-muted text-sm font-semibold text-text-primary">
                              {user?.avatar?.url ? (
                                <img src={user.avatar.url} alt="Аватар участника" className="h-full w-full rounded-2xl object-cover" />
                              ) : (
                                initials || 'U'
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-semibold text-text-primary">
                                {user?.first_name} {user?.last_name}
                              </p>
                              <p className="text-[11px] uppercase tracking-[0.35em] text-text-muted">
                                {PARTICIPANT_ROLE_LABELS[participant.role] || 'Участник'}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-text-secondary">Список участников пока пуст.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-border-soft bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-muted">добавить из друзей</p>
                  <div className="mt-3">
                    <Input value={participantFilter} onChange={setParticipantFilter} placeholder="Поиск по друзьям" />
                  </div>
                  <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1 styled-scrollbar">
                    {filteredInviteOptions.length ? (
                      filteredInviteOptions.map(friendship => {
                        const user = friendship.user;
                        if (!user) {
                          return null;
                        }
                        const isSelected = selectedInvitees.has(user._id);
                        return (
                          <button
                            key={friendship._id}
                            type="button"
                            onClick={() => handleToggleInvitee(user._id)}
                            className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition-colors ${
                              isSelected
                                ? 'border-emerald-400 bg-emerald-50 text-text-primary shadow-brand-card'
                                : 'border-border-subtle bg-white text-text-secondary hover:border-emerald-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-text-primary">
                                {user.first_name} {user.last_name}
                              </p>
                              <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-600' : 'text-text-secondary'}`}>
                                {isSelected ? 'Выбран' : 'Добавить'}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-sm text-text-secondary">Подходящих друзей нет.</p>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    className="mt-4 w-full"
                    onClick={handleAddSelectedInvitees}
                    disabled={!selectedInvitees.size || isAddingParticipants}
                  >
                    {isAddingParticipants
                      ? 'Добавляем...'
                      : selectedInvitees.size
                        ? `Добавить (${selectedInvitees.size})`
                        : 'Добавить участников'}
                  </Button>
                </div>
                <div className="rounded-2xl border border-border-soft bg-white/70 p-4 space-y-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-muted">пригласить по коду</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="flex-1 break-all font-mono text-sm text-text-primary">
                      {chatInviteCode || 'Код недоступен'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border-soft text-text-primary"
                      onClick={handleCopyInviteCode}
                      disabled={!chatInviteCode}
                    >
                      {inviteCopySuccess ? 'Скопировано' : 'Скопировать'}
                    </Button>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Поделитесь кодом с теми, кто ещё не в друзьях.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  onClick={handleLeaveCurrentChat}
                >
                  Покинуть чат
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
