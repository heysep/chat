import React, { useState, useEffect } from "react";

// 채팅방 컨텍스트
const ChatPage = ({ user, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const BASE_URL = "http://localhost:8080/api";
  const [chatRoomIdx, setChatRoomIdx] = useState(8);

  // 메시지 조회 함수
  const fetchMessages = async () => {
    try {
      const response = await fetch(`${BASE_URL}/chatmsg/${chatRoomIdx}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 세션 유지
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const messageData = Array.isArray(data) ? data : [];

      // chatSendDate 기준으로 오름차순 정렬
      const sortedMessages = messageData.sort(
        (a, b) => new Date(a.chatSendDate) - new Date(b.chatSendDate)
      );

      setMessages(sortedMessages);
      setError(null);
      setLastUpdate(new Date());
      console.log("받아온 메시지 데이터:", sortedMessages);
    } catch (err) {
      console.error("메시지 조회 실패:", err);
      setError(`메시지를 불러오는데 실패했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드 및 5초마다 새로고침
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [chatRoomIdx]);

  // 내 메시지인지 판별
  const isMyMessage = (message) => {
    return message.senderUserIdx === user.user_idx;
  };

  // 시간 포맷팅
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "오늘";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "어제";
    } else {
      return date.toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
      });
    }
  };

  // 날짜 구분선 필요 여부
  const needsDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    const currentDate = new Date(currentMessage.chatSendDate);
    const previousDate = new Date(previousMessage.chatSendDate);
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/users/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
    onLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">메시지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">채팅방</h1>
              <p className="text-sm text-gray-500">
                {user.company_name}님 환영합니다
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                className="text-xs border-gray-300 rounded px-2 py-1"
                value={chatRoomIdx}
                onChange={(e) => setChatRoomIdx(Number(e.target.value))}
              >
                {[1,2,3,4,5].map((idx) => (
                  <option key={idx} value={idx}>
                    방 {idx}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-400">채팅방 #{chatRoomIdx}</div>
              <button
                onClick={handleLogout}
                className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full hover:bg-red-100 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message, index) => {
            const isMine = isMyMessage(message);
            const messageText = message.chatMsgContent || "";
            const senderName = message.senderName;
            const showDateSeparator = needsDateSeparator(
              message,
              messages[index - 1]
            );

            return (
              <div key={`${message.chatMsgIdx}-${index}`}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-6">
                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {formatDate(message.chatSendDate)}
                    </div>
                  </div>
                )}

                <div
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex flex-col max-w-xs lg:max-w-md ${
                      isMine ? "items-end" : "items-start"
                    }`}
                  >
                    {!isMine && (
                      <div className="text-xs text-gray-500 mb-1 px-2">
                        {senderName}
                      </div>
                    )}

                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm ${
                        isMine
                          ? "bg-blue-500 text-white rounded-br-md"
                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {messageText}
                      </p>
                    </div>

                    <div
                      className={`text-xs text-gray-400 mt-1 px-2 ${
                        isMine ? "text-right" : "text-left"
                      }`}
                    >
                      {formatTime(message.chatSendDate)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {messages.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">💬</div>
            <p className="text-gray-500 text-lg">아직 메시지가 없습니다.</p>
            <p className="text-gray-400 text-sm mt-2">채팅을 시작해보세요!</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
        <div className="bg-white rounded-full shadow-lg px-3 py-2 flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600">5초마다 새로고침</span>
        </div>

        <div className="bg-white rounded-lg shadow-lg px-3 py-2 text-xs text-gray-500 text-center">
          마지막 업데이트: {lastUpdate.toLocaleTimeString("ko-KR")}
        </div>
      </div>
    </div>
  );
};
export default ChatPage;
